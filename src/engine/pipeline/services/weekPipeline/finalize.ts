import type { GameState } from '@/types/state.types';
import type { WarriorId, BoutOfferId } from '@/types/shared.types';
import type { StateImpact } from '@/engine/impacts';
import { BANKRUPTCY_THRESHOLD } from '@/constants/economy';
import { deriveAbsoluteWeek, isTournamentWeekOfYear } from '@/engine/core/absoluteWeek';
import { clearExpiredRest } from '@/engine/matchmaking/historyLogic';
import { pruneBoutOffers, voidUnresolvableSignedOffers } from '@/engine/bout/offerCleanup';
import { endReign } from '@/engine/championship/arenaChampionship';
import { validateStateInvariants } from '@/engine/validate/stateInvariants';
import { truncateState } from '@/engine/storage/truncation';
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
 * Accumulate the all-time counters — immune to the periodic truncation of
 * arenaHistory. next === prev.slice(K) ++ appended (truncation only ever
 * drops a prefix), so the boundary is located by scanning backwards for
 * prev's last id — O(appended) instead of an O(history) Set-diff per array.
 * Falls back to the diff if the expected suffix structure doesn't hold
 * (defensive).
 */
function accumulateLifetimeStats(state: GameState, oldState: GameState): void {
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
}

/**
 * Season boundary crossed — prune season-scoped growth, reset the season
 * points race for every warrior (player + rivals), then resync caches since
 * roster identities changed.
 */
function applySeasonBoundaryReset(state: GameState, oldState: GameState): void {
  if (state.season === oldState.season) return;
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

/**
 * Collect transcripts from this week's bout summaries for off-thread OPFS
 * archiving, then clear them from state. Never performs I/O — the queue is
 * drained by the main-thread caller.
 */
function deferBoutArchives(state: GameState, currentWeek: number): void {
  const pendingArchives: Array<{
    year: number;
    season: number;
    boutId: string;
    transcript: string[];
  }> = [];
  for (const summary of state.arenaHistory || []) {
    if (summary.transcript && summary.transcript.length > 0 && summary.week === currentWeek) {
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
  state.deferredBoutLogs = [...(state.deferredBoutLogs || []), ...pendingArchives];
}

/**
 * Backstop for the championship pass's vacancy sweep: any pass that dissolves
 * a stable mid-stage (starvation fold, bankruptcy churn, succession swap) can
 * leave a reign pointing at a warrior who is no longer in any roster. Ending
 * it here — after all stage impacts have merged — guarantees the committed
 * state never holds an orphaned crown, whatever order passes wrote in.
 */
function sweepOrphanedReigns(state: GameState): void {
  const titles = state.arenaChampions;
  if (!titles) return;
  // Gate the Set builds: weeks with no crowned reigns (early game) skip
  // all three indexes. Semantics preserved — a champion who is dead or
  // retired while still rostered still loses the crown.
  const reigns: { title: (typeof titles)[string]; warriorId: string }[] = [];
  for (const title of Object.values(titles)) {
    if (title.champion) reigns.push({ title, warriorId: title.champion.warriorId });
  }
  if (reigns.length === 0) return;

  const rosteredIds = new Set<string>();
  for (const w of state.roster ?? []) rosteredIds.add(w.id);
  for (const r of state.rivals ?? []) {
    for (const w of r.roster) rosteredIds.add(w.id);
  }
  const deadIds = new Set((state.graveyard ?? []).map((w) => w.id));
  const retiredIds = new Set((state.retired ?? []).map((w) => w.id));
  for (const { title, warriorId } of reigns) {
    const gone = !rosteredIds.has(warriorId);
    const dead = deadIds.has(warriorId);
    const retired = retiredIds.has(warriorId);
    if (!gone && !dead && !retired) continue;
    endReign(
      state,
      title,
      dead ? 'died' : retired ? 'retired' : 'displaced',
      state.absoluteWeek
    );
  }
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

  accumulateLifetimeStats(state, oldState);

  state.trainingAssignments = (state.trainingAssignments ?? [])
    .filter((a) => a.type === 'trait' && (a.weeksRemaining ?? 0) > 1)
    .map((a) => ({ ...a, weeksRemaining: (a.weeksRemaining ?? 0) - 1 }));

  // Prune expired rest states so warriors become bookable again after KO recovery
  state.restStates = clearExpiredRest(state.restStates || [], state.absoluteWeek);

  // 🧹 Bout offer cleanup — single implementation in offerCleanup.ts, shared
  // with RivalStrategyPass's pre-bidding purge. Signed contracts whose
  // combatant died/retired/disappeared this week are voided here (same week,
  // not at their scheduled bout) so they can never sit as stale ghosts.
  if (state.boutOffers) {
    const voided = voidUnresolvableSignedOffers(state);
    if (voided.length > 0) {
      state.newsletter = [
        ...(state.newsletter || []),
        {
          id: `voided_contracts_${state.absoluteWeek}`,
          week: state.absoluteWeek,
          title: 'Bout Contract Voided',
          items: voided.map(
            (o) =>
              `Contract ${o.id} was voided — a signed bout could not be fought (a combatant retired, died, or left the roster).`
          ),
          category: 'news' as const,
        },
      ];
    }
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

  applySeasonBoundaryReset(state, oldState);

  sweepOrphanedReigns(state);

  // Handle OPFS archiving — always defer to off-thread flush for consistency
  deferBoutArchives(state, ctx.currentWeek);

  if (import.meta.env.DEV) {
    const violations = validateStateInvariants(state);
    if (violations.length > 0) {
      console.error(`finalizeState invariant violations (week ${ctx.nextWeek}):`, violations);
    }
  }

  // V14 B1: truncate at EVERY week boundary — previously only batch spans and
  // autosim (every 50w) truncated, so sequential in-session play accumulated
  // unbounded history and diverged from batch worlds once a cap was crossed
  // (capped arrays feed rivalStrategy/PromoterPass/championship reads). One
  // cadence for every time scale keeps sequential ≡ batch byte-identical.
  // Runs after deferBoutArchives so this week's transcripts drain before any
  // transcript stripping; span teardown still truncates after its terminal
  // sweep (which can append entries a cap would drop).
  return truncateState(state);
}
