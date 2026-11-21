import { describe, it, expect } from 'vitest';
// V30-W3.1: training-injury ids must be deterministic under a seed — the
// current generateId() call inside rollForTrainingInjury produces a
// crypto-random id inside an otherwise-seeded path (V26-D4 bug class).
import { rollForTrainingInjury } from '@/engine/training/trainingGains';
import { makeComputedWarrior } from '@/test/_fixtures/factories';
import { SeededRNG } from '@/utils/random';
import { FightingStyle } from '@/types/game';
import type { WarriorId } from '@/types/shared.types';

const warrior = () =>
  makeComputedWarrior({}, FightingStyle.StrikingAttack, {
    id: 'w1' as WarriorId,
    age: 20,
    fame: 0,
  });

describe('training-injury id determinism (V30)', () => {
  it('two identical seeds produce byte-identical injury ids', () => {
    // next() must land < injuryChance — script a tiny seed-driven stream where
    // the first draw is ~0 so the injury fires on both runs.
    const a = rollForTrainingInjury(warrior(), 0, new SeededRNG(1), 'Clear');
    const b = rollForTrainingInjury(warrior(), 0, new SeededRNG(1), 'Clear');
    // Determinism pin: if an injury fired on both runs the ids must match.
    // (If this seed produces no injury, the pin still holds vacuously — try a
    // few seeds so at least one run actually exercises the id path.)
    if (a.injury && b.injury) {
      expect(a.injury.id).toBe(b.injury.id);
    }
    let fired = 0;
    for (let seed = 1; seed <= 200; seed++) {
      const r1 = rollForTrainingInjury(warrior(), 0, new SeededRNG(seed), 'Clear');
      const r2 = rollForTrainingInjury(warrior(), 0, new SeededRNG(seed), 'Clear');
      if (r1.injury && r2.injury) {
        fired++;
        expect(r1.injury.id).toBe(r2.injury.id);
        expect(r1.injury.weeksRemaining).toBe(r2.injury.weeksRemaining);
      } else {
        expect(r1.injury).toBe(r2.injury);
      }
    }
    expect(fired).toBeGreaterThan(0);
  });
});
