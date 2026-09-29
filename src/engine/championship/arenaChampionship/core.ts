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
import type {
  WarriorId,
  StableId,
} from '@/types/shared.types';
import { ARENA_TITLE } from '@/constants/arena';
import { findWarriorById } from '@/engine/core/warriorLookup';
import { earnEpithet, type EpithetCause } from '@/data/names/epithets';

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

/** Fresh accumulator for one championship pass — mutated by each sub-step. */
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

/** Live title record for an arena, preferring the in-flight delta over state. */
export function titleOf(state: GameState, delta: ChampionshipDelta | undefined, arenaId: string): ArenaTitle | undefined {
  return delta?.arenaChampions[arenaId] ?? state.arenaChampions?.[arenaId];
}

/** Get-or-create a delta copy of the title for an arena (never mutates state). */
export function ensureTitle(state: GameState, delta: ChampionshipDelta, arenaId: string): ArenaTitle {
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
export function effectiveOffers(state: GameState, delta: ChampionshipDelta | undefined): BoutOffer[] {
  const canceled = new Set(Object.keys(delta?.canceledOffers ?? {}));
  const base = Object.values(state.boutOffers ?? {}).filter((o) => o && !canceled.has(o.id));
  return [...base, ...(delta?.newOffers ?? [])];
}

/** True while a bout offer is still pending a response. */
export function isOpenOffer(o: BoutOffer): boolean {
  return o.status === 'Proposed' || o.status === 'Signed';
}


/** Stable (player or rival) that owns the given warrior, or null. */
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


// ─── Reign transitions ──────────────────────────────────────────────────────

/** Appends a completed reign to the title history. */
export function pushHistory(title: ArenaTitle, record: ArenaReignRecord): void {
  title.history.push(record);
  if (title.history.length > ARENA_TITLE.HISTORY_CAP) {
    title.history.splice(0, title.history.length - ARENA_TITLE.HISTORY_CAP);
  }
}

/** Ends the current reign with a reason and records it in history. */
export function endReign(
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
    warriorEpithet: warrior?.epithet,
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

/** Installs a new champion on the title. */
export function crown(title: ArenaTitle, warriorId: WarriorId, now: number): void {
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

/**
 * Awards an earned epithet to a warrior through the delta — never mutates
 * state, never touches the canonical name, never downgrades a higher-ranked
 * epithet. Writes to rosterUpdates (player) or rivalsUpdates (rival).
 */
export function awardEpithet(
  state: GameState,
  delta: ChampionshipDelta,
  warriorId: WarriorId,
  cause: EpithetCause
): void {
  const w = findWarriorById(state, warriorId);
  if (!w) return;
  const owner = owningStableOf(state, warriorId);
  if (owner?.isPlayer) {
    const existing = delta.rosterUpdates.get(warriorId) ?? {};
    const epithet = earnEpithet(cause, warriorId, existing.epithet ?? w.epithet);
    if (epithet) delta.rosterUpdates.set(warriorId, { ...existing, epithet });
    return;
  }
  const rival = (state.rivals ?? []).find((r) => r.id === owner?.stableId);
  if (!rival) return;
  const pending = delta.rivalsUpdates.get(rival.id);
  const baseRoster = pending?.roster ?? rival.roster;
  const roster = baseRoster.map((x) => {
    if (x.id !== warriorId) return x;
    const epithet = earnEpithet(cause, warriorId, x.epithet);
    return epithet ? { ...x, epithet } : x;
  });
  delta.rivalsUpdates.set(rival.id, { ...(pending ?? {}), roster });
}

/** Queues a newsletter item into the delta. */
export function news(delta: ChampionshipDelta, week: number, title: string, items: string[], idSeed: string): void {
  delta.newsletterItems.push({ id: `champ-${idSeed}`, week, title, items });
}

/** Cancels unsigned title offers involving the warrior. */
export function cancelUnsignedOffersInvolving(
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
export function cancelAllOpenOffersInvolving(
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


/** Arena ids with titles, in stable order (delta-aware). */
export function sortedTitleKeys(state: GameState, delta: ChampionshipDelta | undefined): string[] {
  const keys = new Set<string>([
    ...Object.keys(state.arenaChampions ?? {}),
    ...Object.keys(delta?.arenaChampions ?? {}),
  ]);
  return [...keys].sort();
}
