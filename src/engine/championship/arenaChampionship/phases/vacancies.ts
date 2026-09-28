import type { GameState } from '@/types/state.types';
import { findWarriorById } from '@/engine/core/warriorLookup';
import {
  isDead,
  isRetired,
} from '@/engine/warrior/warriorStatus';
import type { ChampionshipDelta } from '../core';
import { titleOf, ensureTitle, endReign, sortedTitleKeys } from '../core';

// ─── 2. Vacancies ───────────────────────────────────────────────────────────

/** Ends reigns whose champion died or retired since the last tick. */
export function enforceVacancies(state: GameState, delta: ChampionshipDelta): void {
  const now = state.absoluteWeek;
  const deadIds = new Set((state.graveyard ?? []).map((w) => w.id));
  const retiredIds = new Set((state.retired ?? []).map((w) => w.id));

  for (const arenaId of sortedTitleKeys(state, delta)) {
    const reign = titleOf(state, delta, arenaId)?.champion;
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
