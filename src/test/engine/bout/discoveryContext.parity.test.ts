/**
 * V26 N2 — discovery context must come from the RESOLVED plan, not `w.plan`:
 * Tactician/Methodical rivals persist a decoy (`planMasked`) while fighting
 * the real plan, so reading `w.plan` can silently grade the wrong fight.
 * `handleProgressions` gains `planA`/`planD` — the resolved plans the bout
 * actually simulated — and discovery symmetry reads those.
 *
 * Live since Phase 4 — resolved plans are threaded through.
 */
import { describe, it, expect } from 'vitest';
import { handleProgressions } from '@/engine/bout/progressionHandler';
import { makeGameState, makeWarrior } from '@/test/_fixtures/factories';
import { FightingStyle } from '@/types/shared.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import type { FightOutcome } from '@/types/combat.types';
import type { WarriorFavorites } from '@/types/warrior.types';

/** 0.1 < symmetry 0.25, ≥ base 0.02 and ≥ hint 0.1 — reveals only on symmetry. */
const midRng: IRNGService = {
  next: () => 0.1,
  uuid: () => 'u',
  pick: <T>(arr: T[]): T => arr[0] as T,
  roll: (min: number) => min,
  shuffle: <T>(arr: T[]) => arr,
  rollWeighted: <K extends string>(wts: Partial<Record<K, number>>): K =>
    Object.keys(wts)[0] as K,
  chance: () => false,
};

const outcome = { winner: 'A', by: 'KO', minutes: 3, log: [] } as unknown as FightOutcome;

const favorites: WarriorFavorites = {
  weaponId: 'shortsword',
  rhythm: { oe: 7, al: 5 },
  discovered: { weapon: true, rhythm: false, weaponHints: 0, rhythmHints: 0, learn: true },
} as WarriorFavorites;

describe('handleProgressions — resolved-plan discovery context', () => {
  it('grades rhythm symmetry off the fought plan, not the persisted decoy', () => {
    const wA = makeWarrior({
      style: FightingStyle.StrikingAttack,
      favorites: { ...favorites, discovered: { ...favorites.discovered } },
      // The persisted plan is wrong/masked — the FOUGHT plan (planA) is the
      // one sitting exactly on the favorite rhythm.
      plan: { OE: 1, AL: 1, killDesire: 3 } as never,
    });
    const wD = makeWarrior({ stableId: 'rival-1' as never });
    const s = makeGameState({ roster: [wA] });

    handleProgressions({
      s,
      wA,
      wD,
      outcome,
      tags: [],
      week: 5,
      rng: midRng,
      headless: true,
      planA: { OE: 7, AL: 5 },
      planD: { OE: 5, AL: 5 },
    } as never);

    expect(wA.favorites?.discovered.rhythm).toBe(true);
  });

  it('does not reveal when the FOUGHT plan missed the rhythm (decoy would match)', () => {
    const wA = makeWarrior({
      style: FightingStyle.StrikingAttack,
      favorites: { ...favorites, discovered: { ...favorites.discovered } },
      // Persisted plan sits on the rhythm — but the bout was actually fought
      // on a different plan, so no symmetry credit.
      plan: { OE: 7, AL: 5, killDesire: 3 } as never,
    });
    const wD = makeWarrior({ stableId: 'rival-1' as never });
    const s = makeGameState({ roster: [wA] });

    handleProgressions({
      s,
      wA,
      wD,
      outcome,
      tags: [],
      week: 5,
      rng: midRng,
      headless: true,
      planA: { OE: 1, AL: 1 },
      planD: { OE: 5, AL: 5 },
    } as never);

    expect(wA.favorites?.discovered.rhythm).toBe(false);
  });
});
