import type { GameState, ArenaTitle, ArenaReignRecord } from '@/types/state.types';
import type { Warrior } from '@/types/warrior.types';
import type { WarriorId } from '@/types/shared.types';
import { ARENA_TITLE } from '@/constants/arena';
import { getAllArenas } from '@/data/arenas';
import { collectAllWarriors } from '@/engine/core/warriorCollection';
import { isActive, isFightReady } from '@/engine/warrior/warriorStatus';
import type { ChampionshipDelta } from './core';
import { titleOf, owningStableOf, CHAMPIONSHIP_EXCLUDED_ARENAS } from './core';

// ─── Queries ────────────────────────────────────────────────────────────────

/** The live reign at an arena, or null. */
export function getArenaChampion(state: GameState, arenaId: string): ArenaTitle['champion'] {
  return state.arenaChampions?.[arenaId]?.champion ?? null;
}

/** Warrior currently holds a crown at ANY arena, in any lifecycle state. */
export function isReigningChampion(state: GameState, warriorId: string): boolean {
  return Object.values(state.arenaChampions ?? {}).some((t) => t.champion?.warriorId === warriorId);
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

/** A warrior with their venue-specific record, as ordered by rankContenders. */
export interface RankedContender {
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
export function rankContenders(
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

/**
 * Top-N eligible contenders at an arena — the same ordering the championship
 * pass books title bouts from, exposed for posture surfaces (arena detail,
 * advisor cards). Unready contenders included: the ladder shows standing,
 * not just this week's bookability.
 */
export function topContenders(state: GameState, arenaId: string, depth = 3): RankedContender[] {
  return rankContenders(state, arenaId, undefined, { includeUnready: true }).slice(0, depth);
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

/**
 * Per-arena top-N eligible contender ids — one pass over every championship
 * arena, built once per tick for the shared perception snapshot so rival AI
 * never re-ranks the ladder per stable.
 */
export function buildContenderIndex(state: GameState, depth = 5): Map<string, WarriorId[]> {
  const index = new Map<string, WarriorId[]>();
  for (const arena of getAllArenas()) {
    if (CHAMPIONSHIP_EXCLUDED_ARENAS.has(arena.id)) continue;
    const ranked = rankContenders(state, arena.id, undefined, { includeUnready: true });
    if (ranked.length === 0) continue;
    index.set(
      arena.id,
      ranked.slice(0, depth).map((r) => r.warrior.id)
    );
  }
  return index;
}
