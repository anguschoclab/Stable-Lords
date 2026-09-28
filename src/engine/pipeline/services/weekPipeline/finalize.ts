import type { GameState } from '@/types/state.types';
import type { WarriorId, BoutOfferId } from '@/types/shared.types';
import type { StateImpact } from '@/engine/impacts';
import { BANKRUPTCY_THRESHOLD } from '@/constants/economy';
import { deriveAbsoluteWeek, isTournamentWeekOfYear } from '@/engine/core/absoluteWeek';
import { clearExpiredRest } from '@/engine/matchmaking/historyLogic';
import { pruneBoutOffers } from '@/engine/bout/offerCleanup';
import { buildWeekCaches } from './caches';
import type { WeekContext } from './context';
/**
 * Check whether the treasury would fall below the bankruptcy threshold after applying core impacts.
 */
export function checkBankruptcy(state: GameState, coreImpacts: StateImpact[]): boolean {
  const netTreasuryDelta = coreImpacts.reduce((sum, i) => sum + (i.treasuryDelta ?? 0), 0);
  return state.treasury + netTreasuryDelta < BANKRUPTCY_THRESHOLD;
}

/**
 * Applies week-boundary bookkeeping to the settled state: week/year rollover,
 * tournament-mode release, lifetime counters, training decay, rest pruning,
 * bout-offer cleanup, season-boundary resets, and deferred bout archiving.
 */
export function finalizeState(state: GameState, oldState: GameState, ctx: WeekContext): GameState {
  state.week = ctx.nextWeek;
  state.year = ctx.nextYear;
  state.absoluteWeek = deriveAbsoluteWeek(ctx.nextYear, ctx.nextWeek);
  state.day = 0;

  // Release tournament mode when entering a non-tournament week. The impact
  // system can't write `undefined`, and headless/batch advances never run the
  // day ticks that clear these flags — leaving them stuck on forever.
  if (!isTournamentWeekOfYear(ctx.nextWeek)) {
    state.isTournamentWeek = false;
    state.activeTournamentId = undefined;
  }

  // All-time counters — immune to the periodic truncation of arenaHistory.
  // next === prev.slice(K) ++ appended (truncation only ever drops a prefix),
  // so the boundary is located by scanning backwards for prev's last id —
  // O(appended) instead of an O(history) Set-diff per array. Falls back to
  // the diff if the expected suffix structure doesn't hold (defensive).
  const prevLifetime = state.lifetimeStats ?? { bouts: 0, kills: 0, retirements: 0 };
  const newIds = <T extends { id: unknown }>(next: T[] | undefined, prev: T[] | undefined) => {
    const n = next ?? [];
    const p = prev ?? [];
    const lastPrevId = p.length > 0 ? p[p.length - 1]?.id : undefined;
    if (lastPrevId === undefined) return n.length;
    let boundary = -1;
    for (let i = n.length - 1; i >= 0; i--) {
      if (n[i]?.id === lastPrevId) {
        boundary = i + 1;
        break;
      }
    }
    // Sanity: retained prefix must align with prev's tail (covers duplicate ids).
    if (boundary >= 0 && p[p.length - boundary]?.id === n[0]?.id) {
      return n.length - boundary;
    }
    const seen = new Set(p.map((x) => x.id));
    return n.filter((x) => !seen.has(x.id)).length;
  };
  state.lifetimeStats = {
    bouts: prevLifetime.bouts + newIds(state.arenaHistory, oldState.arenaHistory),
    kills: prevLifetime.kills + newIds(state.graveyard, oldState.graveyard),
    retirements: prevLifetime.retirements + newIds(state.retired, oldState.retired),
  };

  state.trainingAssignments = (state.trainingAssignments ?? [])
    .filter((a) => a.type === 'trait' && (a.weeksRemaining ?? 0) > 1)
    .map((a) => ({ ...a, weeksRemaining: (a.weeksRemaining ?? 0) - 1 }));

  // Prune expired rest states so warriors become bookable again after KO recovery
  state.restStates = clearExpiredRest(state.restStates || [], state.absoluteWeek);

  // 🧹 Bout offer cleanup — single implementation in offerCleanup.ts, shared
  // with RivalStrategyPass's pre-bidding purge.
  if (state.boutOffers) {
    const justFinishedWeek = deriveAbsoluteWeek(ctx.nextYear, ctx.nextWeek) - 1;
    state.boutOffers = pruneBoutOffers(state.boutOffers, justFinishedWeek);
  }

  // Build warrior→offerIds index for O(1) lookup in autosim
  const warriorToOfferIds = new Map<WarriorId, BoutOfferId[]>();
  for (const offer of Object.values(state.boutOffers || {})) {
    for (const wId of offer.warriorIds) {
      let list = warriorToOfferIds.get(wId as WarriorId);
      if (!list) {
        list = [];
        warriorToOfferIds.set(wId as WarriorId, list);
      }
      list.push(offer.id);
    }
  }
  state.warriorToOfferIds = warriorToOfferIds;

  if (state.season !== oldState.season) {
    state.seasonalGrowth = (state.seasonalGrowth ?? []).filter((sg) => sg.season === state.season);
    // Season points race resets at the season boundary for every warrior.
    state.roster = state.roster.map((w) => (w.seasonPoints ? { ...w, seasonPoints: 0 } : w));
    if (state.rivals) {
      state.rivals = state.rivals.map((r) => ({
        ...r,
        seasonalGrowth: r.seasonalGrowth?.filter((sg) => sg.season === state.season),
        roster: r.roster.map((w) => (w.seasonPoints ? { ...w, seasonPoints: 0 } : w)),
      }));
    }
    // Season boundary changed roster identities — resync caches.
    buildWeekCaches(state);
  }

  // Handle OPFS archiving — always defer to off-thread flush for consistency
  const pendingArchives: Array<{
    year: number;
    season: number;
    boutId: string;
    transcript: string[];
  }> = [];
  for (const summary of state.arenaHistory || []) {
    if (summary.transcript && summary.transcript.length > 0 && summary.week === ctx.currentWeek) {
      const seasonIdx = ['Spring', 'Summer', 'Fall', 'Winter'].indexOf(state.season);
      pendingArchives.push({
        year: state.year,
        season: seasonIdx >= 0 ? seasonIdx : 0,
        boutId: summary.id,
        transcript: summary.transcript,
      });
      // Clear transcript to save memory
      summary.transcript = undefined;
    }
  }

  // Store in state for batch flushing (drained by the main-thread caller —
  // this function never performs I/O itself).
  state.deferredBoutLogs = [...(state.deferredBoutLogs || []), ...pendingArchives];
  return state;
}
