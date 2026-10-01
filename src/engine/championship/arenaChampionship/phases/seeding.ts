import type { GameState } from '@/types/state.types';
import { getAllArenas } from '@/data/arenas';
import type { ChampionshipDelta } from '../core';
import { titleOf, ensureTitle, crown, awardEpithet, CHAMPIONSHIP_EXCLUDED_ARENAS } from '../core';
import type { RankedContender } from '../queries';
import { rankContenders } from '../queries';

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
    const rows = rankedByArena.get(arenaId) ?? [];
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
    const rows = rankedByArena.get(arenaId) ?? [];
    const pick =
      rows.find((r) => claimed.get(r.warrior.id)?.arenaId === arenaId) ??
      rows.find((r) => {
        const c = claimed.get(r.warrior.id);
        return !c; // unclaimed warrior
      });
    if (!pick) continue;
    const t = ensureTitle(state, delta, arenaId);
    crown(t, pick.warrior.id, state.absoluteWeek);
    awardEpithet(state, delta, pick.warrior.id, 'arena_champion');
  }
}
