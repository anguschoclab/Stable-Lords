import { describe, it, expect } from 'vitest';
import {
  traitCapacity,
  meritsTraitDevelopment,
  countFlaws,
  pickExposureFlaw,
} from '@/engine/training/trainingGains/traitCapacity';
import { TRAITS } from '@/engine/traits';
import { SeededRNGService } from '@/utils/random';
import type { Warrior } from '@/types/warrior.types';

const w = (over: Partial<Warrior> = {}): Warrior =>
  ({
    id: 'x',
    traits: [],
    trainability: 0.65,
    fame: 0,
    career: { wins: 0, losses: 0, kills: 0 },
    ...over,
  }) as unknown as Warrior;

describe('traitCapacity', () => {
  it('scales the personal trait ceiling with trainability across the [0.4,0.9] range', () => {
    expect(traitCapacity(w({ trainability: 0.45 }))).toBe(0); // low aptitude → permanent blank
    expect(traitCapacity(w({ trainability: 0.6 }))).toBe(1);
    expect(traitCapacity(w({ trainability: 0.72 }))).toBe(2);
    expect(traitCapacity(w({ trainability: 0.88 }))).toBe(3);
  });

  it('defaults sanely when trainability is missing', () => {
    expect(traitCapacity(w({ trainability: undefined }))).toBeGreaterThanOrEqual(0);
  });
});

describe('meritsTraitDevelopment', () => {
  it('gates development behind a winning record or real fame', () => {
    expect(meritsTraitDevelopment(w({ career: { wins: 0, losses: 4, kills: 0 }, fame: 4 }))).toBe(
      false
    );
    expect(meritsTraitDevelopment(w({ career: { wins: 4, losses: 1, kills: 0 }, fame: 4 }))).toBe(
      true
    );
    expect(meritsTraitDevelopment(w({ career: { wins: 0, losses: 0, kills: 0 }, fame: 40 }))).toBe(
      true
    );
  });
});

describe('countFlaws', () => {
  it('counts only Flaw-tier traits', () => {
    expect(countFlaws(w({ traits: ['fragile', 'slow', 'quick'] }))).toBe(2);
    expect(countFlaws(w({ traits: ['quick'] }))).toBe(0);
  });
});

describe('pickExposureFlaw', () => {
  it('returns an acquirable Flaw id, or null when none can be added', () => {
    const rng = new SeededRNGService(42);
    const id = pickExposureFlaw(w({ traits: [] }), rng);
    expect(id).not.toBeNull();
    expect(TRAITS[id!]!.tier).toBe('Flaw');

    // A full roster (3 traits) cannot take another flaw (hard cap).
    const full = pickExposureFlaw(w({ traits: ['quick', 'agile', 'sturdy'] }), rng);
    expect(full).toBeNull();
  });
});
