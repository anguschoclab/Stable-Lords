/**
 * V32: entity gender fields — Warrior, PoolWarrior, Trainer, Owner, Promoter
 * schemas accept the avatar-gender vocabulary and reject anything else.
 */
import { describe, it, expect } from 'vitest';
import { WarriorSchema, PoolWarriorSchema } from '@/schemas/warriorSchemas';
import { OwnerSchema, PromoterSchema, TrainerSchema } from '@/schemas/economySchemas';
import { makeWarrior, makeOwner, makePoolWarrior } from '@/test/_fixtures/factories';
import type { Trainer, Promoter } from '@/types/state.types';

const trainer: Trainer = {
  id: 'tr-1',
  name: 'Dojo Master',
  tier: 'Novice',
  focus: 'Aggression',
  fame: 1,
  age: 40,
  contractWeeksLeft: 52,
};

const promoter: Promoter = {
  id: 'pr-1',
  name: 'Circus Maximus',
  age: 50,
  personality: 'Flashy',
  tier: 'Local',
  capacity: 4,
  biases: [],
  history: { totalPursePaid: 0, notableBouts: [], legacyFame: 0 },
} as Promoter;

describe('entity gender schema fields', () => {
  it('Warrior/PoolWarrior accept all three genders and round-trip them', () => {
    for (const gender of ['masc', 'fem', 'neutral'] as const) {
      const w = makeWarrior({ gender });
      expect(WarriorSchema.parse(w).gender).toBe(gender);
      const p = makePoolWarrior({ gender });
      expect(PoolWarriorSchema.parse(p).gender).toBe(gender);
    }
  });

  it('Trainer/Owner/Promoter accept and round-trip gender', () => {
    expect(TrainerSchema.parse({ ...trainer, gender: 'fem' }).gender).toBe('fem');
    expect(OwnerSchema.parse(makeOwner({ gender: 'masc' })).gender).toBe('masc');
    expect(PromoterSchema.parse({ ...promoter, gender: 'neutral' }).gender).toBe('neutral');
  });

  it('gender stays optional — entities without it still parse', () => {
    expect(WarriorSchema.parse(makeWarrior()).gender).toBeUndefined();
    expect(TrainerSchema.parse(trainer).gender).toBeUndefined();
  });

  it('rejects values outside the avatar-gender vocabulary', () => {
    expect(() => WarriorSchema.parse(makeWarrior({ gender: 'alien' as never }))).toThrow();
    expect(() => TrainerSchema.parse({ ...trainer, gender: 'x' })).toThrow();
  });
});
