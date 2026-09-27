/**
 * Stable Lords — Arena Championship Engine
 *
 * Pure per-week title bookkeeping, consumed by ArenaChampionshipPass.
 * Every mutating function accumulates its writes into a ChampionshipDelta —
 * nothing touches GameState directly, so the pass converts the delta into a
 * StateImpact and the pipeline merge order stays deterministic.
 *
 * Pass-internal order (tested): vacancies → result resolution → refusal sweep
 * → lifecycle transitions → scheduling → perks.
 */
import type {
  GameState,
  ArenaTitle,
  ArenaReignRecord,
  BoutOffer,
  NewsletterItem,
  RivalStableData,
  ArenaReignEndReason,
  GrandChampionEntry,
} from '@/types/state.types';
import type { Warrior } from '@/types/warrior.types';
import type { WarriorId, BoutOfferId, PromoterId, StableId, TournamentId } from '@/types/shared.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { ARENA_TITLE, ARENA_COMMISSION_ID, CHAMPIONS_TOURNEY } from '@/constants/arena';
import { getAllArenas } from '@/data/arenas';
import {
  displayWeek,
  isTournamentWeekOfYear,
  boutOfferExpirationAbsoluteWeek,
} from '@/engine/core/absoluteWeek';
import { collectAllWarriors, collectBookedWarriorIds } from '@/engine/core/warriorCollection';
import { findWarriorById } from '@/engine/core/warriorLookup';
import { isActive, isFightReady, isDead, isRetired } from '@/engine/warriorStatus';
import { isTooInjuredToFight } from '@/engine/injuries';
import type { InjuryData } from '@/types/warrior.types';

/**
 * Arenas that never carry a championship. Bloodsands is the reserved neutral
 * tournament venue (incl. the Grand Championship) — no "home" crown.
 */
export const CHAMPIONSHIP_EXCLUDED_ARENAS: ReadonlySet<string> = new Set(['bloodsands_arena']);

/** Accumulated championship writes for one tick. */
export interface ChampionshipDelta {
  /** arenaId → full ArenaTitle replacement for touched arenas. */
  arenaChampions: Record<string, ArenaTitle>;
  /** Newly created title offers. */
  newOffers: BoutOffer[];
  /** offerId → the offer with status 'Canceled' (ordinary offers voided by title rules). */
  canceledOffers: Record<string, BoutOffer>;
  newsletterItems: NewsletterItem[];
  rosterUpdates: Map<WarriorId, Partial<Warrior>>;
  /** stableId → { roster } partial for rival-owned warrior updates. */
  rivalsUpdates: Map<StableId, Partial<RivalStableData>>;
  /** Grand Championship winners recorded this tick. */
  grandChampions: GrandChampionEntry[];
  /** Player-stable purse award from a Grand Championship win. */
  treasuryDelta: number;
}

/** Debug counters for autosim diagnostics. */
export const CHAMPIONSHIP_DEBUG = {
  offersCreated: 0,
  signedSeen: 0,
  rejectedSeen: 0,
  expiredSeen: 0,
  resultsResolved: 0,
  defensesScheduled: 0,
};

export function createChampionshipDelta(): ChampionshipDelta {
  return {
    arenaChampions: {},
    newOffers: [],
    canceledOffers: {},
    newsletterItems: [],
    rosterUpdates: new Map(),
    rivalsUpdates: new Map(),
    grandChampions: [],
    treasuryDelta: 0,
  };
}

// ─── Internal state/delta overlay ───────────────────────────────────────────

function titleOf(state: GameState, delta: ChampionshipDelta | undefined, arenaId: string): ArenaTitle | undefined {
  return delta?.arenaChampions[arenaId] ?? state.arenaChampions?.[arenaId];
}

/** Get-or-create a delta copy of the title for an arena (never mutates state). */
function ensureTitle(state: GameState, delta: ChampionshipDelta, arenaId: string): ArenaTitle {
  const pending = delta.arenaChampions[arenaId];
  if (pending) return pending;
  const existing = state.arenaChampions?.[arenaId];
  const title: ArenaTitle = existing
    ? {
        ...existing,
        champion: existing.champion ? { ...existing.champion } : null,
        history: [...existing.history],
        declinedContenders: { ...existing.declinedContenders },
      }
    : {
        champion: null,
        status: 'active',
        history: [],
        refusals: 0,
        deferrals: 0,
        noContenderStreak: 0,
        declinedContenders: {},
      };
  delta.arenaChampions[arenaId] = title;
  return title;
}

/** All offers with delta overlay applied (canceled removed, new appended). */
function effectiveOffers(state: GameState, delta: ChampionshipDelta | undefined): BoutOffer[] {
  const canceled = new Set(Object.keys(delta?.canceledOffers ?? {}));
  const base = Object.values(state.boutOffers ?? {}).filter((o) => o && !canceled.has(o.id));
  return [...base, ...(delta?.newOffers ?? [])];
}

function isOpenOffer(o: BoutOffer): boolean {
  return o.status === 'Proposed' || o.status === 'Signed';
}

// ─── Queries ────────────────────────────────────────────────────────────────

/** The live reign at an arena, or null. */
export function getArenaChampion(state: GameState, arenaId: string): ArenaTitle['champion'] {
  return state.arenaChampions?.[arenaId]?.champion ?? null;
}

/** Warrior currently holds a crown at ANY arena, in any lifecycle state. */
export function isReigningChampion(state: GameState, warriorId: string): boolean {
  return Object.values(state.arenaChampions ?? {}).some(
    (t) => t.champion?.warriorId === warriorId
  );
}

/** Warrior holds a crown whose title is fully active (choke-point scope). */
export function isActiveChampion(state: GameState, warriorId: string): boolean {
  return Object.values(state.arenaChampions ?? {}).some(
    (t) => t.champion?.warriorId === warriorId && t.status === 'active'
  );
}

/**
 * Warrior holds a crown whose title is active OR pendingReengagement —
 * the producer-side exclusion predicate. Dormant champions stay bookable.
 */
export function isChampionBookingLocked(state: GameState, warriorId: string): boolean {
  return Object.values(state.arenaChampions ?? {}).some(
    (t) => t.champion?.warriorId === warriorId && t.status !== 'dormant'
  );
}

/** Arena ids where the warrior is the reigning champion (derived titles). */
export function getCurrentArenaTitles(state: GameState, warriorId: string): string[] {
  return Object.entries(state.arenaChampions ?? {})
    .filter(([, t]) => t.champion?.warriorId === warriorId)
    .map(([arenaId]) => arenaId)
    .sort();
}

/** Past reigns for a warrior across all arenas. */
export function getPastArenaTitles(
  state: GameState,
  warriorId: string
): { arenaId: string; record: ArenaReignRecord }[] {
  const out: { arenaId: string; record: ArenaReignRecord }[] = [];
  for (const [arenaId, t] of Object.entries(state.arenaChampions ?? {})) {
    for (const r of t.history) {
      if (r.warriorId === warriorId) out.push({ arenaId, record: r });
    }
  }
  return out;
}

/** Resolve the stable currently owning a warrior (live lookup — never stamped on the reign). */
export function owningStableOf(
  state: GameState,
  warriorId: string
): { stableId: string; stableName: string; isPlayer: boolean } | null {
  if ((state.roster ?? []).some((w) => w.id === warriorId)) {
    return { stableId: state.player.id, stableName: state.player.stableName, isPlayer: true };
  }
  for (const r of state.rivals ?? []) {
    if ((r.roster ?? []).some((w) => w.id === warriorId)) {
      return { stableId: r.id, stableName: r.owner.stableName, isPlayer: false };
    }
  }
  return null;
}

/** Arena ids where the reigning champion belongs to the given stable. */
export function championsHeldByStable(state: GameState, stableId: string): string[] {
  return Object.entries(state.arenaChampions ?? {})
    .filter(([, t]) => {
      if (!t.champion) return false;
      return owningStableOf(state, t.champion.warriorId)?.stableId === stableId;
    })
    .map(([arenaId]) => arenaId)
    .sort();
}

interface RankedContender {
  warrior: Warrior;
  wins: number;
  losses: number;
  kills: number;
  winRate: number;
}

function contenderComparator(a: RankedContender, b: RankedContender): number {
  return (
    b.wins - a.wins ||
    b.winRate - a.winRate ||
    b.kills - a.kills ||
    (a.warrior.id < b.warrior.id ? -1 : a.warrior.id > b.warrior.id ? 1 : 0)
  );
}

/**
 * Ordered eligible contenders at an arena, best first.
 *
 * Eligibility: ≥ MIN_BOUTS venue bouts, fight-ready, not a reigning champion
 * anywhere (single crown), not inside a declinedContenders cooldown.
 * `opts.bookedIds` additionally filters warriors already signed for the
 * target week — used by scheduling only, never by dormancy accounting.
 */
function rankContenders(
  state: GameState,
  arenaId: string,
  delta?: ChampionshipDelta,
  opts?: { bookedIds?: Set<string>; includeUnready?: boolean }
): RankedContender[] {
  const now = state.absoluteWeek;
  const title = titleOf(state, delta, arenaId);
  const declined = title?.declinedContenders ?? {};

  // Crowned ids — state titles overlaid with delta writes (delta wins per key).
  const mergedTitles = { ...(state.arenaChampions ?? {}), ...(delta?.arenaChampions ?? {}) };
  const crownedIds = new Set(
    Object.values(mergedTitles)
      .map((t) => t.champion?.warriorId)
      .filter((id): id is WarriorId => id != null)
  );

  const rows: RankedContender[] = [];
  for (const w of collectAllWarriors(state)) {
    const rec = w.career?.byArena?.[arenaId];
    if (!rec) continue;
    if (rec.wins + rec.losses < ARENA_TITLE.MIN_BOUTS) continue;
    if (!isActive(w)) continue;
    if (!opts?.includeUnready && !isFightReady(w)) continue;
    // Single crown — a reigning champion anywhere can't contend here.
    if (crownedIds.has(w.id)) continue;
    const cooldownUntil = declined[w.id];
    if (cooldownUntil != null && cooldownUntil > now) continue;
    if (opts?.bookedIds?.has(w.id)) continue;
    const total = rec.wins + rec.losses;
    rows.push({
      warrior: w,
      wins: rec.wins,
      losses: rec.losses,
      kills: rec.kills,
      winRate: total > 0 ? rec.wins / total : 0,
    });
  }
  return rows.sort(contenderComparator);
}

/** Top eligible contender at an arena, or null. `delta` overlays pending tick writes. */
export function selectTitleContender(
  state: GameState,
  arenaId: string,
  delta?: ChampionshipDelta,
  opts?: { bookedIds?: Set<string>; includeUnready?: boolean }
): Warrior | null {
  return rankContenders(state, arenaId, delta, opts)[0]?.warrior ?? null;
}

/** 1-based position in the eligible-contender ordering, or null if not ranked. */
export function contenderRankAtArena(
  state: GameState,
  arenaId: string,
  warriorId: string
): number | null {
  const idx = rankContenders(state, arenaId).findIndex((r) => r.warrior.id === warriorId);
  return idx === -1 ? null : idx + 1;
}

// ─── Reign transitions ──────────────────────────────────────────────────────

function pushHistory(title: ArenaTitle, record: ArenaReignRecord): void {
  title.history.push(record);
  if (title.history.length > ARENA_TITLE.HISTORY_CAP) {
    title.history.splice(0, title.history.length - ARENA_TITLE.HISTORY_CAP);
  }
}

function endReign(
  state: GameState,
  title: ArenaTitle,
  reason: ArenaReignEndReason,
  now: number
): void {
  const reign = title.champion;
  if (!reign) return;
  const stable = owningStableOf(state, reign.warriorId);
  const warrior = findWarriorById(state, reign.warriorId);
  pushHistory(title, {
    warriorId: reign.warriorId,
    warriorName: warrior?.name ?? reign.warriorId,
    stableName: stable?.stableName,
    startedAbsoluteWeek: reign.startedAbsoluteWeek,
    endedAbsoluteWeek: now,
    endReason: reason,
    defenses: reign.defenses,
  });
  title.champion = null;
  title.status = 'active';
  title.refusals = 0;
  title.deferrals = 0;
  title.noContenderStreak = 0;
  if (reason === 'stripped' || reason === 'relinquished') {
    title.declinedContenders[reign.warriorId] = now + ARENA_TITLE.EX_CHAMPION_COOLDOWN_WEEKS;
  }
}

function crown(title: ArenaTitle, warriorId: WarriorId, now: number): void {
  title.champion = {
    warriorId,
    startedAbsoluteWeek: now,
    defenses: 0,
    lastActivityWeek: now,
  };
  title.status = 'active';
  title.refusals = 0;
  title.deferrals = 0;
  title.noContenderStreak = 0;
}

function news(delta: ChampionshipDelta, week: number, title: string, items: string[], idSeed: string): void {
  delta.newsletterItems.push({ id: `champ-${idSeed}`, week, title, items });
}

function cancelUnsignedOffersInvolving(
  state: GameState,
  delta: ChampionshipDelta,
  warriorId: WarriorId
): void {
  for (const o of effectiveOffers(state, delta)) {
    if (o.titleArenaId) continue;
    if (o.status !== 'Proposed') continue;
    if (!o.warriorIds.includes(warriorId)) continue;
    delta.canceledOffers[o.id] = { ...o, status: 'Canceled' };
  }
}

/** Cancel ALL unresolved non-title offers involving the warrior (used at coronation). */
function cancelAllOpenOffersInvolving(
  state: GameState,
  delta: ChampionshipDelta,
  warriorId: WarriorId
): void {
  for (const o of effectiveOffers(state, delta)) {
    if (o.titleArenaId) continue;
    if (!isOpenOffer(o)) continue;
    if (!o.warriorIds.includes(warriorId)) continue;
    delta.canceledOffers[o.id] = { ...o, status: 'Canceled' };
  }
}

// ─── 1. Seeding ─────────────────────────────────────────────────────────────

/**
 * Crowns the initial champion at every arena lacking one.
 * Deterministic: arenas processed in sorted id order; a warrior leading at
 * multiple venues keeps the crown at the largest-margin one (margin = wins
 * minus runner-up wins). Idempotent — existing reigns are never touched.
 */
export function seedChampions(state: GameState, delta: ChampionshipDelta): void {
  const arenas = getAllArenas()
    .filter((a) => !CHAMPIONSHIP_EXCLUDED_ARENAS.has(a.id))
    .map((a) => a.id)
    .sort();

  // Ranked contenders per arena, computed once against state (not delta) —
  // seeding evaluates the pre-existing record book.
  const rankedByArena = new Map<string, RankedContender[]>();
  for (const arenaId of arenas) {
    rankedByArena.set(arenaId, rankContenders(state, arenaId, delta));
  }

  // claimed: warriorId → { arenaId, margin }
  const claimed = new Map<string, { arenaId: string; margin: number }>();
  const marginOf = (rows: RankedContender[], top: RankedContender): number => {
    const runnerUp = rows.find((r) => r.warrior.id !== top.warrior.id);
    return top.wins - (runnerUp?.wins ?? 0);
  };

  // Pass 1: provisional claims — top contender at each arena.
  for (const arenaId of arenas) {
    const title = titleOf(state, delta, arenaId);
    if (title?.champion) continue;
    const rows = rankedByArena.get(arenaId)!;
    const top = rows[0];
    if (!top) continue;
    const margin = marginOf(rows, top);
    const prior = claimed.get(top.warrior.id);
    if (!prior || margin > prior.margin) {
      claimed.set(top.warrior.id, { arenaId, margin });
    }
  }

  // Pass 2: fill arenas whose top contender was claimed at a higher-margin
  // venue, using the next eligible warrior.
  for (const arenaId of arenas) {
    const title = titleOf(state, delta, arenaId);
    if (title?.champion) continue;
    const rows = rankedByArena.get(arenaId)!;
    const pick = rows.find((r) => claimed.get(r.warrior.id)?.arenaId === arenaId)
      ?? rows.find((r) => {
        const c = claimed.get(r.warrior.id);
        return !c; // unclaimed warrior
      });
    if (!pick) continue;
    const t = ensureTitle(state, delta, arenaId);
    crown(t, pick.warrior.id, state.absoluteWeek);
  }
}

// ─── 2. Vacancies ───────────────────────────────────────────────────────────

/** Ends reigns whose champion died or retired since the last tick. */
export function enforceVacancies(state: GameState, delta: ChampionshipDelta): void {
  const now = state.absoluteWeek;
  const deadIds = new Set((state.graveyard ?? []).map((w) => w.id));
  const retiredIds = new Set((state.retired ?? []).map((w) => w.id));

  for (const arenaId of sortedTitleKeys(state, delta)) {
    const title = titleOf(state, delta, arenaId)!;
    const reign = title.champion;
    if (!reign) continue;
    const w = findWarriorById(state, reign.warriorId);
    const dead = deadIds.has(reign.warriorId) || (w ? isDead(w) : false);
    const retired = retiredIds.has(reign.warriorId) || (w ? isRetired(w) : false);
    // Champion missing from all rosters AND not in graveyard/retired — treat as vacated
    // via retirement to avoid a stuck crown.
    if (!w && !dead && !retired) {
      const t = ensureTitle(state, delta, arenaId);
      endReign(state, t, 'retired', now);
      continue;
    }
    if (dead || retired) {
      const t = ensureTitle(state, delta, arenaId);
      endReign(state, t, dead ? 'died' : 'retired', now);
    }
  }
}

function sortedTitleKeys(state: GameState, delta: ChampionshipDelta | undefined): string[] {
  const keys = new Set<string>([
    ...Object.keys(state.arenaChampions ?? {}),
    ...Object.keys(delta?.arenaChampions ?? {}),
  ]);
  return [...keys].sort();
}

// ─── 3. Result resolution ───────────────────────────────────────────────────

/** Applies this week's title-bout summaries to title records. */
export function resolveTitleBoutResults(state: GameState, delta: ChampionshipDelta): void {
  const now = state.absoluteWeek;
  for (const summary of state.arenaHistory ?? []) {
    const arenaId = summary.titleArenaId;
    if (!arenaId) continue;
    if (summary.absoluteWeek != null && summary.absoluteWeek !== now) continue;

    const title = ensureTitle(state, delta, arenaId);
    CHAMPIONSHIP_DEBUG.resultsResolved++;
    const champId = title.champion?.warriorId ?? null;

    if (summary.winner == null) {
      // Draw — champion retains; still counts as reign activity.
      if (title.champion) title.champion.lastActivityWeek = now;
      continue;
    }
    const winnerId = (summary.winner === 'A' ? summary.warriorIdA : summary.warriorIdD) as WarriorId;
    const loserId = (summary.winner === 'A' ? summary.warriorIdD : summary.warriorIdA) as WarriorId;

    if (champId == null) {
      // Vacant title bout — decisive winner takes the crown.
      crown(title, winnerId, now);
      news(delta, state.week, `New Champion Crowned`, [
        `${findWarriorById(state, winnerId)?.name ?? winnerId} claims the vacant crown.`,
      ], `crown-${arenaId}-${now}`);
      continue;
    }

    if (winnerId === champId) {
      title.champion!.defenses += 1;
      title.champion!.lastActivityWeek = now;
      title.refusals = 0;
      continue;
    }

    // Challenger won — did the champion die? A 'Kill' outcome means the loser
    // was killed; deathEventData.killerId confirms who dealt it.
    const champDied =
      loserId === champId &&
      (summary.by === 'Kill' ||
        (summary.isDeathEvent === true && summary.deathEventData?.killerId === winnerId));
    endReign(state, title, champDied ? 'died' : 'defeated', now);
    // Defensive single-crown enforcement: if the new champion somehow holds
    // another crown, that reign ends as relinquished.
    for (const [otherArena, other] of Object.entries(delta.arenaChampions)) {
      if (otherArena === arenaId) continue;
      if (other.champion?.warriorId === winnerId) {
        endReign(state, other, 'relinquished', now);
      }
    }
    for (const [otherArena, other] of Object.entries(state.arenaChampions ?? {})) {
      if (otherArena === arenaId || delta.arenaChampions[otherArena]) continue;
      if (other.champion?.warriorId === winnerId) {
        const t = ensureTitle(state, delta, otherArena);
        endReign(state, t, 'relinquished', now);
      }
    }
    crown(title, winnerId, now);
    // Coronation cancels the new champion's unresolved ordinary offers.
    cancelAllOpenOffersInvolving(state, delta, winnerId);
    news(delta, state.week, `Title Changes Hands`, [
      `${findWarriorById(state, winnerId)?.name ?? winnerId} takes the crown.`,
    ], `upset-${arenaId}-${now}`);
  }
}

// ─── 4. Refusal sweep ───────────────────────────────────────────────────────

/**
 * Reads resolved title-offer responses. Champion Declined with a blocking
 * injury is a postponement; otherwise refusals++ and strip at REFUSALS_TO_STRIP.
 * Challenger decline → CHALLENGER_COOLDOWN. A Signed title offer clears refusals.
 */
export function sweepTitleRefusals(state: GameState, delta: ChampionshipDelta): void {
  const now = state.absoluteWeek;
  for (const offer of Object.values(state.boutOffers ?? {})) {
    const arenaId = offer?.titleArenaId;
    if (!arenaId) continue;
    const title = titleOf(state, delta, arenaId);
    if (!title) continue;

    if (offer.status === 'Signed') {
      CHAMPIONSHIP_DEBUG.signedSeen++;
      if (title.refusals !== 0) ensureTitle(state, delta, arenaId).refusals = 0;
      continue;
    }
    // Nothing ever writes 'Expired' — unsigned offers are silently pruned once
    // their expiration passes. Because this sweep runs before that prune, a
    // Proposed offer past its expiration IS an expiration: the bout window is
    // already gone (bout phase precedes the world stage), so any late response
    // cannot rescue it.
    const lapsedUnsigned =
      offer.status === 'Proposed' &&
      offer.expirationWeek != null &&
      boutOfferExpirationAbsoluteWeek(offer) <= now;
    if (offer.status !== 'Rejected' && offer.status !== 'Expired' && !lapsedUnsigned) continue;
    if (offer.status === 'Rejected') CHAMPIONSHIP_DEBUG.rejectedSeen++;
    else CHAMPIONSHIP_DEBUG.expiredSeen++;

    // Rejected → the explicit Declined party. Expired/lapsed → whoever never
    // accepted; the champion is checked first (silence = ducking).
    const declinerId =
      offer.status === 'Rejected'
        ? offer.warriorIds.find((id) => offer.responses?.[id] === 'Declined')
        : title.champion && offer.responses?.[title.champion.warriorId] !== 'Accepted'
          ? title.champion.warriorId
          : offer.warriorIds.find((id) => offer.responses?.[id] !== 'Accepted');
    if (!declinerId) continue;
    const t = ensureTitle(state, delta, arenaId);

    if (declinerId === title.champion?.warriorId) {
      const champ = findWarriorById(state, declinerId);
      const blocking =
        champ &&
        !isFightReady(champ) &&
        (champ.injuries ?? []).some(
          (i): i is InjuryData => typeof i !== 'string' && isTooInjuredToFight([i])
        );
      if (blocking) {
        // Medical postponement — not a refusal.
        t.deferrals += 1;
        continue;
      }
      t.refusals += 1;
      if (t.refusals >= ARENA_TITLE.REFUSALS_TO_STRIP) {
        const champName = champ?.name ?? declinerId;
        endReign(state, t, 'stripped', now);
        news(delta, state.week, `Champion Stripped`, [
          `${champName} is stripped of the crown for refusing to defend.`,
        ], `stripped-${arenaId}-${now}`);
      }
    } else {
      t.declinedContenders[declinerId] = now + ARENA_TITLE.CHALLENGER_COOLDOWN_WEEKS;
    }
  }
}

// ─── 5. Lifecycle transitions ───────────────────────────────────────────────

/**
 * Evaluates every titled arena each week — dormant titles included.
 *
 *  active            + no contender ≥ DORMANCY_STREAK  → dormant
 *  dormant           + contender emerges               → pendingReengagement
 *                    (+ cancel the champion's unsigned ordinary offers)
 *  pendingReengagement + signed ordinary offers remain → stay pending (deferrals++)
 *  pendingReengagement + drained                       → active (defense books same pass)
 *  pending/dormant   + contender gone                  → dormant
 */
export function applyLifecycleTransitions(state: GameState, delta: ChampionshipDelta): void {
  const now = state.absoluteWeek;
  for (const arenaId of sortedTitleKeys(state, delta)) {
    const base = titleOf(state, delta, arenaId)!;
    if (!base.champion) continue; // vacant titles have no dormancy lifecycle
    const champId = base.champion.warriorId;

    // Contender existence ignores booking — a booked contender still counts.
    const contender = selectTitleContender(state, arenaId, delta, { includeUnready: false });

    switch (base.status) {
      case 'active': {
        if (contender) {
          if (base.noContenderStreak !== 0) {
            ensureTitle(state, delta, arenaId).noContenderStreak = 0;
          }
        } else {
          const t = ensureTitle(state, delta, arenaId);
          t.noContenderStreak += 1;
          if (t.noContenderStreak >= ARENA_TITLE.DORMANCY_STREAK) {
            t.status = 'dormant';
            news(delta, state.week, `Title Goes Dormant`, [
              `No eligible contender remains — the champion may take ordinary bouts.`,
            ], `dormant-${arenaId}-${now}`);
          }
        }
        break;
      }
      case 'dormant': {
        const t = ensureTitle(state, delta, arenaId);
        if (contender) {
          t.status = 'pendingReengagement';
          t.noContenderStreak = 0;
          // Cancel unsigned ordinary offers now so the drain bound is real.
          cancelUnsignedOffersInvolving(state, delta, champId);
          news(delta, state.week, `Title Re-engages`, [
            `A challenger has emerged — the champion must return to title bouts.`,
          ], `pending-${arenaId}-${now}`);
        } else {
          t.noContenderStreak += 1;
        }
        break;
      }
      case 'pendingReengagement': {
        const t = ensureTitle(state, delta, arenaId);
        if (!contender) {
          t.status = 'dormant';
          t.noContenderStreak = 1;
          break;
        }
        const hasSignedOrdinary = effectiveOffers(state, delta).some(
          (o) =>
            !o.titleArenaId &&
            o.status === 'Signed' &&
            o.warriorIds.includes(champId)
        );
        if (hasSignedOrdinary) {
          t.deferrals += 1;
        } else {
          t.status = 'active';
        }
        break;
      }
    }
  }
}

// ─── 6. Scheduling ──────────────────────────────────────────────────────────

/**
 * Books title defenses for the next week on the normal cadence.
 * Skips non-active titles (transitions ran first), tournament weeks,
 * arenas with a live title offer, and reigns inside DEFENSE_INTERVAL_WEEKS.
 */
export function scheduleTitleBouts(
  state: GameState,
  delta: ChampionshipDelta,
  rng: IRNGService
): void {
  // Tournament weeks lock ordinary matchmaking — no defenses booked.
  if (isTournamentWeekOfYear(state.week)) return;

  const now = state.absoluteWeek;
  // Title offers use the same two-week horizon as ordinary producers: the bout
  // is targeted at now+2 so the week between (now+1) is the response window —
  // offers created for the immediately-next week can never be responded to in
  // time, since bout resolution runs before the world stage that processes
  // responses.
  const targetWeek = displayWeek(now + 2);
  const bookedNext = collectBookedWarriorIds(state, now + 2);
  const offers = effectiveOffers(state, delta);
  const liveTitleArenas = new Set(
    offers.filter((o) => o.titleArenaId && isOpenOffer(o)).map((o) => o.titleArenaId!)
  );

  let bookedCount = 0;
  for (const arenaId of sortedTitleKeys(state, delta)) {
    if (bookedCount >= ARENA_TITLE.MAX_TITLE_BOUTS_PER_WEEK) break;
    const title = titleOf(state, delta, arenaId)!;
    if (title.status !== 'active') continue;
    if (liveTitleArenas.has(arenaId)) continue;

    if (title.champion) {
      const reign = title.champion;
      if (now - reign.lastActivityWeek < ARENA_TITLE.DEFENSE_INTERVAL_WEEKS) continue;
      if (bookedNext.has(reign.warriorId)) {
        ensureTitle(state, delta, arenaId).deferrals += 1;
        continue;
      }
      const contender = selectTitleContender(state, arenaId, delta, { bookedIds: bookedNext });
      if (!contender) {
        // Eligible-but-booked slides are informational; true no-contender
        // weeks are counted by the transition step.
        if (selectTitleContender(state, arenaId, delta)) {
          ensureTitle(state, delta, arenaId).deferrals += 1;
        }
        continue;
      }
      delta.newOffers.push(makeTitleOffer(rng, arenaId, reign.warriorId, contender.id, targetWeek, now));
      CHAMPIONSHIP_DEBUG.offersCreated++;
      CHAMPIONSHIP_DEBUG.defensesScheduled++;
      liveTitleArenas.add(arenaId);
      bookedNext.add(contender.id);
      bookedNext.add(reign.warriorId);
      bookedCount++;
    } else {
      // Vacant — top two eligible contenders fight for the crown.
      const ranked = rankContenders(state, arenaId, delta, { bookedIds: bookedNext });
      if (ranked.length < 2) {
        if (ranked.length >= 1) ensureTitle(state, delta, arenaId).deferrals += 1;
        continue;
      }
      const [a, b] = ranked;
      delta.newOffers.push(makeTitleOffer(rng, arenaId, a!.warrior.id, b!.warrior.id, targetWeek, now));
      CHAMPIONSHIP_DEBUG.offersCreated++;
      liveTitleArenas.add(arenaId);
      bookedNext.add(a!.warrior.id);
      bookedNext.add(b!.warrior.id);
      bookedCount++;
    }
  }
}

function makeTitleOffer(
  rng: IRNGService,
  arenaId: string,
  aId: WarriorId,
  bId: WarriorId,
  targetDisplayWeek: number,
  now: number
): BoutOffer {
  const purse = Math.round(200 * ARENA_TITLE.PURSE_MULTIPLIER);
  return {
    id: rng.uuid('title-offer') as BoutOfferId,
    promoterId: ARENA_COMMISSION_ID as PromoterId,
    warriorIds: [aId, bId],
    boutWeek: targetDisplayWeek,
    // Expiry is the bout week itself, not the week before: offer impacts only
    // land in state at world-stage resolution, so rival responses always come
    // one tick later — during advance(now+1→now+2)'s world stage, whose prune
    // drops unsigned offers with expiration <= absoluteWeek(now+1). Expiring at
    // the bout week gives the offer exactly one full response window and is
    // still caught by the refusal sweep (which runs before the prune) if
    // nobody answers.
    expirationWeek: displayWeek(now + 2),
    purse,
    hype: 50 + ARENA_TITLE.HYPE_BONUS,
    status: 'Proposed',
    responses: { [aId]: 'Pending', [bId]: 'Pending' },
    proposerStableId: undefined,
    conditions: ['TITLE BOUT'],
    arenaId,
    createdAbsoluteWeek: now,
    titleArenaId: arenaId,
  };
}

// ─── 7. Perks ───────────────────────────────────────────────────────────────

/**
 * Weekly champion trickle — only for active titles whose reign saw activity
 * inside ACTIVITY_WINDOW_WEEKS (or has a live title offer outstanding).
 */
export function applyChampionPerks(state: GameState, delta: ChampionshipDelta): void {
  const now = state.absoluteWeek;
  const offers = effectiveOffers(state, delta);
  const arenasWithLiveOffer = new Set(
    offers.filter((o) => o.titleArenaId && isOpenOffer(o)).map((o) => o.titleArenaId!)
  );

  for (const arenaId of sortedTitleKeys(state, delta)) {
    const title = titleOf(state, delta, arenaId)!;
    if (!title.champion || title.status !== 'active') continue;
    const recentActivity =
      now - title.champion.lastActivityWeek <= ARENA_TITLE.ACTIVITY_WINDOW_WEEKS ||
      arenasWithLiveOffer.has(arenaId);
    if (!recentActivity) continue;

    const id = title.champion.warriorId;
    const isPlayerWarrior = (state.roster ?? []).some((w) => w.id === id);
    if (isPlayerWarrior) {
      const existing = delta.rosterUpdates.get(id) ?? {};
      delta.rosterUpdates.set(id, {
        ...existing,
        fame: (existing.fame ?? findWarriorById(state, id)?.fame ?? 0) + ARENA_TITLE.CHAMPION_FAME_PER_WEEK,
        popularity:
          (existing.popularity ?? findWarriorById(state, id)?.popularity ?? 0) +
          ARENA_TITLE.CHAMPION_POPULARITY_PER_WEEK,
      });
    } else {
      const rival = (state.rivals ?? []).find((r) => (r.roster ?? []).some((w) => w.id === id));
      if (!rival) continue;
      const roster = rival.roster.map((x) =>
        x.id === id
          ? {
              ...x,
              fame: (x.fame ?? 0) + ARENA_TITLE.CHAMPION_FAME_PER_WEEK,
              popularity: (x.popularity ?? 0) + ARENA_TITLE.CHAMPION_POPULARITY_PER_WEEK,
            }
          : x
      );
      delta.rivalsUpdates.set(rival.id, { roster });
    }
  }
}

// ─── Relinquish (player/AI action) ──────────────────────────────────────────

/** Voluntarily end a reign — same cooldown consequences as being stripped. */
export function relinquishCrown(
  state: GameState,
  delta: ChampionshipDelta,
  arenaId: string
): void {
  const title = titleOf(state, delta, arenaId);
  if (!title?.champion) return;
  const t = ensureTitle(state, delta, arenaId);
  const name = findWarriorById(state, t.champion!.warriorId)?.name ?? t.champion!.warriorId;
  endReign(state, t, 'relinquished', state.absoluteWeek);
  news(delta, state.week, `Crown Relinquished`, [`${name} gives up the crown.`], `relinq-${arenaId}-${state.absoluteWeek}`);
}

// ─── Grand Championship ─────────────────────────────────────────────────────

/**
 * The week-52 field: every reigning arena champion, fight-ready. Dormant and
 * re-engaging titles still hold their crown, so their champions enter.
 * Deterministic arenaId order pre-shuffle, capped at FIELD_CAP.
 */
export function selectGrandChampionshipField(state: GameState): Warrior[] {
  return Object.keys(state.arenaChampions ?? {})
    .sort()
    .map((arenaId) => state.arenaChampions![arenaId]!.champion?.warriorId)
    .filter((id): id is WarriorId => id != null)
    .map((id) => findWarriorById(state, id))
    .filter((w): w is Warrior => w != null && isFightReady(w, true))
    .slice(0, CHAMPIONS_TOURNEY.FIELD_CAP);
}

/**
 * Detect completed 'Champions' tournaments not yet in `grandChampions` and
 * record the winner + awards. The generic tournament prize path skips this
 * tier (see resolution.ts) — this is the single award home.
 */
export function recordGrandChampions(state: GameState, delta: ChampionshipDelta): void {
  const recorded = new Set([
    ...(state.grandChampions ?? []).map((g) => g.tournamentId),
    ...delta.grandChampions.map((g) => g.tournamentId),
  ]);

  for (const t of state.tournaments ?? []) {
    if (t.tierId !== CHAMPIONS_TOURNEY.TIER_ID || !t.completed || recorded.has(t.id)) continue;
    const finals = [...t.bracket]
      .filter((b) => !b.isBronzeMatch)
      .sort((a, b) => b.round - a.round || a.matchIndex - b.matchIndex)[0];
    if (!finals?.winner) continue;
    const winnerId = (finals.winner === 'A' ? finals.warriorIdA : finals.warriorIdD) as WarriorId;
    const w = findWarriorById(state, winnerId);
    if (!w) continue;

    const owner = owningStableOf(state, winnerId);
    delta.grandChampions.push({
      tournamentId: t.id as TournamentId,
      year: state.year ?? 1,
      warriorId: w.id,
      warriorName: w.name,
      stableName: owner?.stableName,
    });

    const titles = [...(w.titles ?? []), CHAMPIONS_TOURNEY.TITLE];
    if (owner?.isPlayer) {
      delta.treasuryDelta += CHAMPIONS_TOURNEY.PURSE;
      const existing = delta.rosterUpdates.get(w.id) ?? {};
      delta.rosterUpdates.set(w.id, {
        ...existing,
        fame: (existing.fame ?? w.fame ?? 0) + CHAMPIONS_TOURNEY.WINNER_FAME,
        popularity: (existing.popularity ?? w.popularity ?? 0) + CHAMPIONS_TOURNEY.WINNER_POP,
        titles,
        champion: true,
      });
    } else {
      const rival = (state.rivals ?? []).find((r) =>
        (r.roster ?? []).some((x) => x.id === w.id)
      );
      if (rival) {
        const pending = delta.rivalsUpdates.get(rival.id);
        const baseRoster = pending?.roster ?? rival.roster;
        delta.rivalsUpdates.set(rival.id, {
          ...(pending ?? {}),
          treasury: (rival.treasury ?? 0) + CHAMPIONS_TOURNEY.PURSE,
          roster: baseRoster.map((x) =>
            x.id === w.id
              ? {
                  ...x,
                  fame: (x.fame ?? 0) + CHAMPIONS_TOURNEY.WINNER_FAME,
                  popularity: (x.popularity ?? 0) + CHAMPIONS_TOURNEY.WINNER_POP,
                  titles,
                  champion: true,
                }
              : x
          ),
        });
      }
    }

    news(
      delta,
      state.week,
      `Grand Champion Crowned`,
      [
        `${w.name} of ${owner?.stableName ?? 'an unknown stable'} is the ${CHAMPIONS_TOURNEY.TITLE} — last warrior standing at ${CHAMPIONS_TOURNEY.NAME}.`,
        `Purse: ${CHAMPIONS_TOURNEY.PURSE}g. The arena crowns them immortal.`,
      ],
      `gc-${t.id}`
    );
  }
}
