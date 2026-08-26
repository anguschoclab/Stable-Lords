import { describe, it, expect } from 'vitest';
import { applySpecialtyMods } from '@/engine/combat/resolution/specialtyMods';

describe('applySpecialtyMods', () => {
  it('does nothing if no trainers are provided in context', () => {
    const ctx = {
      trainers: [],
      trainerModsA: { attMod: 1 },
      trainerModsD: { defMod: 1 },
    } as any;
    const fA = {} as any;
    const fD = {} as any;

    applySpecialtyMods(ctx, fA, fD);

    expect(ctx.baseTrainerModsA).toBeUndefined();
  });
});
