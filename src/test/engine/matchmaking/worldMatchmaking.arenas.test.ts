/**
 * Megaplan Phase 4 — world matchmaking respects `eligibleArenasFor`: a bout's
 * venue must be legal for BOTH warriors, not just the promoter pool.
 */
import { describe, it, expect } from 'vitest';
import { planWorldBouts } from '@/engine/matchmaking/worldMatchmaking';
import { eligibleArenasFor } from '@/engine/matchmaking/arenaFit';
import { SeededRNGService } from '@/utils/random';
import { makeWarrior, makeRival, makeGameState } from '@/test/_fixtures/factories';
import type { WarriorId, StableId } from '@/types/shared.types';
import type { GameState } from '@/types/state.types';

function stateWith(fameA: number, fameB: number): GameState {
  return makeGameState({
    week: 1,
    absoluteWeek: 1,
    rivals: [
      makeRival({
        id: 'r1' as StableId,
        roster: [makeWarrior({ id: 'w1' as WarriorId, fame: fameA })],
      }),
      makeRival({
        id: 'r2' as StableId,
        roster: [makeWarrior({ id: 'w2' as WarriorId, fame: fameB })],
      }),
    ],
  });
}

describe('planWorldBouts — arena eligibility', () => {
  it('books rookies only at venues a fame-0 warrior may enter', () => {
    const state = stateWith(0, 0);
    const w1 = state.rivals[0]!.roster[0]!;
    const w2 = state.rivals[1]!.roster[0]!;
    const legal = new Set(
      eligibleArenasFor(w1)
        .filter((a) => eligibleArenasFor(w2).some((b) => b.id === a.id))
        .map((a) => a.id)
    );
    for (let seed = 0; seed < 50; seed++) {
      const offers = planWorldBouts(state, new SeededRNGService(seed * 13 + 5));
      for (const o of offers) expect(legal.has(o.arenaId!)).toBe(true);
    }
  });

  it('a rookie/champion pairing still lands on rookie-legal ground', () => {
    const state = stateWith(0, 999);
    const rookie = state.rivals[0]!.roster[0]!;
    const rookieLegal = new Set(eligibleArenasFor(rookie).map((a) => a.id));
    for (let seed = 0; seed < 50; seed++) {
      const offers = planWorldBouts(state, new SeededRNGService(seed * 29 + 11));
      for (const o of offers) expect(rookieLegal.has(o.arenaId!)).toBe(true);
    }
  });
});
