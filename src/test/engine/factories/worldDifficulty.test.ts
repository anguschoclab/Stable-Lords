import { describe, it, expect } from 'vitest';
import { rollCompetence } from '@/engine/ai/competence';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import { GameStateSchema } from '@/schemas/gameStateSchema';
import { WORLD_DIFFICULTIES } from '@/types/enumSources';
import { SeededRNG } from '@/utils/random';

/**
 * Stage E — WorldDifficulty skew on the minted stablemaster field.
 * Pins the seeder semantics before V11 refactors touch gameStateFactory:
 * worldOptions is read ONLY by the seeder; mid-game refills ignore it.
 */

const draws = (difficulty: (typeof WORLD_DIFFICULTIES)[number] | undefined, n = 400) => {
  const rng = new SeededRNG(31337);
  const counts: Record<string, number> = {};
  for (let i = 0; i < n; i++) {
    const c = rollCompetence(rng, 'Established', difficulty);
    counts[c] = (counts[c] ?? 0) + 1;
  }
  return counts;
};

describe('rollCompetence — world-difficulty skew', () => {
  it('Contender mints an easier field (Novice/Journeyman overrepresented)', () => {
    const easy = draws('Contender');
    const neutral = draws(undefined);
    const easyShare = ((easy['Novice'] ?? 0) + (easy['Journeyman'] ?? 0)) / 400;
    const neutralShare = ((neutral['Novice'] ?? 0) + (neutral['Journeyman'] ?? 0)) / 400;
    expect(easyShare).toBeGreaterThan(neutralShare);
    expect(easy['Master'] ?? 0).toBeLessThan(neutral['Master'] ?? 0);
  });

  it('Legend mints a harder field (Veteran/Master overrepresented)', () => {
    const hard = draws('Legend');
    const hardShare = ((hard['Veteran'] ?? 0) + (hard['Master'] ?? 0)) / 400;
    const neutral = draws(undefined);
    const neutralShare = ((neutral['Veteran'] ?? 0) + (neutral['Master'] ?? 0)) / 400;
    expect(hardShare).toBeGreaterThan(neutralShare);
    expect(hard['Novice'] ?? 0).toBeLessThan(neutral['Novice'] ?? 0);
  });

  it('Challenger is distribution-neutral (identical draws to omitted difficulty)', () => {
    const a = new SeededRNG(7);
    const b = new SeededRNG(7);
    for (let i = 0; i < 50; i++) {
      expect(rollCompetence(a, 'Established', 'Challenger')).toBe(rollCompetence(b, 'Established'));
    }
  });

  it('is deterministic for a given seed + difficulty', () => {
    const a = new SeededRNG(55);
    const b = new SeededRNG(55);
    for (let i = 0; i < 30; i++) {
      expect(rollCompetence(a, 'Established', 'Legend')).toBe(
        rollCompetence(b, 'Established', 'Legend')
      );
    }
  });
});

describe('createFreshState — worldOptions', () => {
  it('persists worldOptions onto the fresh state', () => {
    const s = createFreshState('seed-wo', '2026-01-01T00:00:00.000Z', { difficulty: 'Legend' });
    expect(s.worldOptions).toEqual({ difficulty: 'Legend' });
  });

  it('leaves worldOptions unset when omitted', () => {
    const s = createFreshState('seed-wo', '2026-01-01T00:00:00.000Z');
    expect(s.worldOptions).toBeUndefined();
  });

  it('same seed + difficulty produces identical rivals', () => {
    const a = createFreshState('det-seed', '2026-01-01T00:00:00.000Z', { difficulty: 'Contender' });
    const b = createFreshState('det-seed', '2026-01-01T00:00:00.000Z', { difficulty: 'Contender' });
    expect(a.rivals.map((r) => r.owner.competence)).toEqual(
      b.rivals.map((r) => r.owner.competence)
    );
  });

  it('every minted rival owner carries a valid competence tier', () => {
    const s = createFreshState('seed-wo2', '2026-01-01T00:00:00.000Z', { difficulty: 'Legend' });
    expect(s.rivals.length).toBeGreaterThan(0);
    for (const r of s.rivals) {
      expect(['Novice', 'Journeyman', 'Veteran', 'Master']).toContain(r.owner.competence);
    }
  });

  it('difficulty shifts the minted field (Legend ≠ Contender on same seed)', () => {
    const easy = createFreshState('cmp-seed', '2026-01-01T00:00:00.000Z', { difficulty: 'Contender' });
    const hard = createFreshState('cmp-seed', '2026-01-01T00:00:00.000Z', { difficulty: 'Legend' });
    const score = (s: typeof easy) =>
      s.rivals.reduce(
        (acc, r) =>
          acc + ({ Novice: 0, Journeyman: 1, Veteran: 2, Master: 3 }[r.owner.competence!] ?? 0),
        0
      );
    expect(score(hard)).toBeGreaterThan(score(easy));
  });
});

describe('worldOptions schema', () => {
  it('accepts a state carrying worldOptions.difficulty', () => {
    const s = createFreshState('schema-seed', '2026-01-01T00:00:00.000Z', {
      difficulty: 'Contender',
    });
    const parsed = GameStateSchema.parse(s);
    expect(parsed.worldOptions?.difficulty).toBe('Contender');
  });

  it('accepts a state with worldOptions absent', () => {
    const s = createFreshState('schema-seed2', '2026-01-01T00:00:00.000Z');
    expect(() => GameStateSchema.parse(s)).not.toThrow();
  });

  it('rejects an invalid difficulty value', () => {
    const s = createFreshState('schema-seed3', '2026-01-01T00:00:00.000Z', {
      difficulty: 'Legend',
    });
    const bad = { ...s, worldOptions: { difficulty: 'Nightmare' } };
    expect(() => GameStateSchema.parse(bad)).toThrow();
  });
});
