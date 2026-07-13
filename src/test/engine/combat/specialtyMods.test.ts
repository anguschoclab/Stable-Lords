/**
 * Specialty Mods — exhaustive coverage for applySpecialtyMods covering
 * no-op guard, base snapshotting, per-exchange recalculation, and all mod fields.
 */
import { describe, it, expect } from 'vitest';
import { FightingStyle } from '@/types/shared.types';
import { applySpecialtyMods } from '@/engine/combat/resolution/specialtyMods';
import type { FighterState, ResolutionContext } from '@/engine/combat/resolution/types';
import type { Trainer } from '@/types/shared.types';

function createMockFighter(overrides: Partial<FighterState> = {}): FighterState {
  return {
    label: 'A',
    style: FightingStyle.StrikingAttack,
    attributes: { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
    skills: { ATT: 10, PAR: 10, DEF: 10, INI: 10, RIP: 10, DEC: 10 },
    derived: { hp: 100, endurance: 100, damage: 5, encumbrance: 10 },
    plan: { style: FightingStyle.StrikingAttack, OE: 5, AL: 5, killDesire: 5, target: 'Any' } as any,
    activePlan: { style: FightingStyle.StrikingAttack, OE: 5, AL: 5, killDesire: 5, target: 'Any' } as any,
    psychState: 'CRUISING' as any,
    hp: 100, maxHp: 100, endurance: 100, maxEndurance: 100,
    hitsLanded: 0, hitsTaken: 0, ripostes: 0, consecutiveHits: 0,
    armHits: 0, legHits: 0, totalFights: 0,
    momentum: 0, committed: false, survivalStrike: false, recoveryDebt: 0,
    ...overrides,
  } as FighterState;
}

function createMockCtx(overrides: Partial<ResolutionContext> = {}): ResolutionContext {
  return {
    rng: () => 0.5,
    phase: 'OPENING', exchange: 0,
    weather: 'Clear', weatherEffect: {} as any,
    matchupA: 0, matchupD: 0,
    trainerModsA: { attMod: 0, parMod: 0, defMod: 0, iniMod: 0, decMod: 0, endMod: 0, healMod: 0 },
    trainerModsD: { attMod: 0, parMod: 0, defMod: 0, iniMod: 0, decMod: 0, endMod: 0, healMod: 0 },
    weaponReqA: { endurancePenalty: 0, attPenalty: 0 },
    weaponReqD: { endurancePenalty: 0, attPenalty: 0 },
    tacticStreakA: 0, tacticStreakD: 0,
    range: 'Striking', zone: 'Center',
    arenaConfig: {} as any, surfaceMod: {} as any,
    maxRange: 'Extended', zoneStepBias: 0,
    ...overrides,
  } as unknown as ResolutionContext;
}

function createMockTrainer(overrides: Partial<Trainer> = {}): Trainer {
  return {
    id: 't1', name: 'Test Trainer', tier: 'Novice', focus: 'Aggression',
    fame: 0, age: 30, contractWeeksLeft: 10,
    ...overrides,
  } as Trainer;
}

describe('specialtyMods — applySpecialtyMods', () => {
  it('is a no-op when ctx.trainers is undefined', () => {
    const ctx = createMockCtx({ trainers: undefined });
    const fA = createMockFighter();
    const fD = createMockFighter();
    const originalModsA = { ...ctx.trainerModsA };
    const originalModsD = { ...ctx.trainerModsD };
    applySpecialtyMods(ctx, fA, fD);
    expect(ctx.trainerModsA).toEqual(originalModsA);
    expect(ctx.trainerModsD).toEqual(originalModsD);
  });

  it('is a no-op when ctx.trainers is empty array', () => {
    const ctx = createMockCtx({ trainers: [] });
    const fA = createMockFighter();
    const fD = createMockFighter();
    const originalModsA = { ...ctx.trainerModsA };
    const originalModsD = { ...ctx.trainerModsD };
    applySpecialtyMods(ctx, fA, fD);
    expect(ctx.trainerModsA).toEqual(originalModsA);
    expect(ctx.trainerModsD).toEqual(originalModsD);
  });

  it('snapshots baseTrainerModsA on first call', () => {
    const trainers = [createMockTrainer({ specialty: 'KillerInstinct', tier: 'Master' })];
    const ctx = createMockCtx({
      trainers,
      trainerModsA: { attMod: 5, parMod: 2, defMod: 1, iniMod: 3, decMod: 0, endMod: 0, healMod: 1 },
    });
    const fA = createMockFighter();
    const fD = createMockFighter({ hp: 30, maxHp: 100 });
    applySpecialtyMods(ctx, fA, fD);
    expect(ctx.baseTrainerModsA).toBeDefined();
    expect(ctx.baseTrainerModsA!.attMod).toBe(5);
    expect(ctx.baseTrainerModsA!.parMod).toBe(2);
  });

  it('snapshots baseTrainerModsD on first call', () => {
    const trainers = [createMockTrainer({ specialty: 'KillerInstinct', tier: 'Master' })];
    const ctx = createMockCtx({
      trainers,
      trainerModsD: { attMod: 3, parMod: 1, defMod: 4, iniMod: 0, decMod: 2, endMod: 1, healMod: 0 },
    });
    const fA = createMockFighter();
    const fD = createMockFighter({ hp: 30, maxHp: 100 });
    applySpecialtyMods(ctx, fA, fD);
    expect(ctx.baseTrainerModsD).toBeDefined();
    expect(ctx.baseTrainerModsD!.defMod).toBe(4);
  });

  it('does not re-snapshot baseTrainerModsA on second call', () => {
    const trainers = [createMockTrainer({ specialty: 'KillerInstinct', tier: 'Master' })];
    const ctx = createMockCtx({
      trainers,
      trainerModsA: { attMod: 5, parMod: 0, defMod: 0, iniMod: 0, decMod: 0, endMod: 0, healMod: 0 },
    });
    const fA = createMockFighter();
    const fD = createMockFighter({ hp: 30, maxHp: 100 });
    applySpecialtyMods(ctx, fA, fD);
    const firstSnapshot = { ...ctx.baseTrainerModsA! };
    // Mutate trainerModsA before second call — snapshot should be preserved
    ctx.trainerModsA.attMod = 999;
    applySpecialtyMods(ctx, fA, fD);
    expect(ctx.baseTrainerModsA!.attMod).toBe(firstSnapshot.attMod);
  });

  it('sets trainerModsA as base + specialty delta for additive fields', () => {
    const trainers = [createMockTrainer({ specialty: 'KillerInstinct', tier: 'Master' })];
    const ctx = createMockCtx({
      trainers,
      trainerModsA: { attMod: 5, parMod: 0, defMod: 0, iniMod: 0, decMod: 0, endMod: 0, healMod: 0 },
    });
    const fA = createMockFighter();
    const fD = createMockFighter({ hp: 30, maxHp: 100 }); // HP < 40% triggers KillerInstinct
    applySpecialtyMods(ctx, fA, fD);
    // KillerInstinct adds killWindowBonus, not attMod — attMod should stay at base
    expect(ctx.trainerModsA.attMod).toBe(5);
    // killWindowBonus should be > 0 since opponent HP < 40%
    expect(ctx.trainerModsA.killWindowBonus).toBeGreaterThan(0);
  });

  it('sets healMod to base only (no specialty contribution)', () => {
    const trainers = [createMockTrainer({ specialty: 'KillerInstinct', tier: 'Master' })];
    const ctx = createMockCtx({
      trainers,
      trainerModsA: { attMod: 0, parMod: 0, defMod: 0, iniMod: 0, decMod: 0, endMod: 0, healMod: 7 },
    });
    const fA = createMockFighter();
    const fD = createMockFighter({ hp: 30, maxHp: 100 });
    applySpecialtyMods(ctx, fA, fD);
    expect(ctx.trainerModsA.healMod).toBe(7);
  });

  it('sets killWindowBonus from specialty only (replaces base)', () => {
    const trainers = [createMockTrainer({ specialty: 'KillerInstinct', tier: 'Master' })];
    const ctx = createMockCtx({
      trainers,
      trainerModsA: { attMod: 0, parMod: 0, defMod: 0, iniMod: 0, decMod: 0, endMod: 0, healMod: 0, killWindowBonus: 99 },
    } as any);
    const fA = createMockFighter();
    const fD = createMockFighter({ hp: 30, maxHp: 100 });
    applySpecialtyMods(ctx, fA, fD);
    // killWindowBonus comes from specA, not base
    expect(ctx.trainerModsA.killWindowBonus).not.toBe(99);
  });

  it('sets damageReceivedMult from specialty only', () => {
    const trainers = [createMockTrainer({ specialty: 'IronGuard', tier: 'Master' })];
    const ctx = createMockCtx({
      trainers,
      trainerModsA: { attMod: 0, parMod: 0, defMod: 0, iniMod: 0, decMod: 0, endMod: 0, healMod: 0 },
    });
    const fA = createMockFighter({ endurance: 50, maxEndurance: 100 });
    const fD = createMockFighter();
    applySpecialtyMods(ctx, fA, fD);
    // IronGuard reduces damageReceivedMult when endurance is low
    expect(ctx.trainerModsA.damageReceivedMult).toBeDefined();
    expect(typeof ctx.trainerModsA.damageReceivedMult).toBe('number');
  });

  it('sets riposteDamageMult from specialty only', () => {
    const trainers = [createMockTrainer({ specialty: 'CounterFighter', tier: 'Master' })];
    const ctx = createMockCtx({
      trainers,
      trainerModsA: { attMod: 0, parMod: 0, defMod: 0, iniMod: 0, decMod: 0, endMod: 0, healMod: 0 },
    });
    const fA = createMockFighter({ ripostes: 1 });
    const fD = createMockFighter();
    applySpecialtyMods(ctx, fA, fD);
    expect(ctx.trainerModsA.riposteDamageMult).toBeDefined();
    expect(typeof ctx.trainerModsA.riposteDamageMult).toBe('number');
  });

  it('sets fatiguePenaltyReduction from specialty only', () => {
    const trainers = [createMockTrainer({ specialty: 'RopeADope', tier: 'Master' })];
    const ctx = createMockCtx({
      trainers,
      trainerModsA: { attMod: 0, parMod: 0, defMod: 0, iniMod: 0, decMod: 0, endMod: 0, healMod: 0 },
    });
    const fA = createMockFighter();
    const fD = createMockFighter();
    applySpecialtyMods(ctx, fA, fD);
    expect(ctx.trainerModsA.fatiguePenaltyReduction).toBeDefined();
    expect(typeof ctx.trainerModsA.fatiguePenaltyReduction).toBe('number');
  });

  it('computes specA with (trainers, fA, fD, ctx) and specD with (trainers, fD, fA, ctx)', () => {
    // Verify both fighters get specialty mods computed
    const trainers = [createMockTrainer({ specialty: 'KillerInstinct', tier: 'Master' })];
    const ctx = createMockCtx({
      trainers,
      trainerModsA: { attMod: 0, parMod: 0, defMod: 0, iniMod: 0, decMod: 0, endMod: 0, healMod: 0 },
      trainerModsD: { attMod: 0, parMod: 0, defMod: 0, iniMod: 0, decMod: 0, endMod: 0, healMod: 0 },
    });
    const fA = createMockFighter({ hp: 100, maxHp: 100 });
    const fD = createMockFighter({ hp: 30, maxHp: 100 }); // fD HP < 40% → specA gets killWindowBonus
    applySpecialtyMods(ctx, fA, fD);
    // specA: fA is the attacker, fD is the opponent with low HP → KillerInstinct triggers
    expect(ctx.trainerModsA.killWindowBonus).toBeGreaterThan(0);
    // specD: fD is now the "self", fA is the opponent with full HP → KillerInstinct doesn't trigger for D
    expect(ctx.trainerModsD.killWindowBonus).toBe(0);
  });

  it('handles trainers with no specialty (undefined specialty)', () => {
    const trainers = [createMockTrainer({ specialty: undefined })];
    const ctx = createMockCtx({ trainers });
    const fA = createMockFighter();
    const fD = createMockFighter();
    expect(() => applySpecialtyMods(ctx, fA, fD)).not.toThrow();
  });

  it('handles multiple trainers with different specialties', () => {
    const trainers = [
      createMockTrainer({ id: 't1', specialty: 'KillerInstinct', tier: 'Master' }),
      createMockTrainer({ id: 't2', specialty: 'IronConditioning', tier: 'Seasoned' }),
    ];
    const ctx = createMockCtx({ trainers });
    const fA = createMockFighter();
    const fD = createMockFighter({ hp: 30, maxHp: 100 });
    expect(() => applySpecialtyMods(ctx, fA, fD)).not.toThrow();
    // Both specialties should contribute
    expect(ctx.trainerModsA.killWindowBonus).toBeGreaterThan(0);
  });

  it('preserves base values for fields with no specialty contribution', () => {
    const trainers = [createMockTrainer({ specialty: 'KillerInstinct', tier: 'Master' })];
    const ctx = createMockCtx({
      trainers,
      trainerModsA: { attMod: 3, parMod: 7, defMod: 2, iniMod: 1, decMod: 4, endMod: 6, healMod: 8 },
    });
    const fA = createMockFighter();
    const fD = createMockFighter({ hp: 100, maxHp: 100 }); // Full HP → KillerInstinct doesn't trigger
    applySpecialtyMods(ctx, fA, fD);
    // With no specialty triggering, additive mods should equal base
    expect(ctx.trainerModsA.attMod).toBe(3);
    expect(ctx.trainerModsA.parMod).toBe(7);
    expect(ctx.trainerModsA.defMod).toBe(2);
    expect(ctx.trainerModsA.iniMod).toBe(1);
    expect(ctx.trainerModsA.decMod).toBe(4);
    expect(ctx.trainerModsA.endMod).toBe(6);
    expect(ctx.trainerModsA.healMod).toBe(8);
  });

  it('handles undefined base mod values with nullish coalescing (attMod)', () => {
    const trainers = [createMockTrainer({ specialty: 'KillerInstinct', tier: 'Master' })];
    const ctx = createMockCtx({
      trainers,
      trainerModsA: {} as any,
    });
    const fA = createMockFighter();
    const fD = createMockFighter();
    expect(() => applySpecialtyMods(ctx, fA, fD)).not.toThrow();
    // baseA.attMod ?? 0 → 0 + specA.attMod
    expect(ctx.trainerModsA.attMod).toBeDefined();
  });
});
