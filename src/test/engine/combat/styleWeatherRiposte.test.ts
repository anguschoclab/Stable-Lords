/**
 * Gap 4 — STYLE_WEATHER_MODIFIERS riposteMod is computed but never applied
 * in combat resolution. The initiativeMod and damageMult fields are used,
 * but riposteMod is silently discarded.
 */
import { describe, it, expect } from 'vitest';
import { FightingStyle } from '@/types/shared.types';
import type { Warrior, WarriorId } from '@/types/shared.types';
import { getStyleWeatherModifier } from '@/constants/arena';
import { simulateFight, defaultPlanForWarrior } from '@/engine/simulate';
import { computeWarriorStats } from '@/engine/skillCalc';

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeWarrior(name: string, style: FightingStyle): Warrior {
  const attrs = { ST: 12, CN: 12, SZ: 10, WT: 12, WL: 12, SP: 12, DF: 12 };
  const { baseSkills, derivedStats } = computeWarriorStats(attrs, style);
  return {
    id: `test_${name}` as WarriorId,
    name,
    style,
    attributes: attrs,
    baseSkills,
    derivedStats,
    fame: 0,
    popularity: 0,
    titles: [],
    injuries: [],
    flair: [],
    traits: [],
    career: { wins: 0, losses: 0, kills: 0 },
    champion: false,
    status: 'Active',
    age: 20,
  } as Warrior;
}

function countRipostes(log: any[]): number {
  return log.filter((e) => e.type === 'RIPOSTE' || e.result === 'RIPOSTE').length;
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('Gap 4: getStyleWeatherModifier returns riposteMod for known combinations', () => {
  it('returns riposteMod +3 for Dense Fog:ParryRiposte', () => {
    const mod = getStyleWeatherModifier(FightingStyle.ParryRiposte, 'Dense Fog', []);
    expect(mod.riposteMod).toBe(3);
    expect(mod.descriptions.length).toBeGreaterThan(0);
  });

  it('returns riposteMod +2 for Dense Fog:ParryLunge', () => {
    const mod = getStyleWeatherModifier(FightingStyle.ParryLunge, 'Dense Fog', []);
    expect(mod.riposteMod).toBe(2);
  });

  it('returns riposteMod +3 for magical:Mana Surge arena tag', () => {
    const mod = getStyleWeatherModifier(FightingStyle.ParryRiposte, 'Mana Surge', ['magical']);
    // Base style mod + tag mod
    expect(mod.riposteMod).toBeGreaterThanOrEqual(3);
  });

  it('returns riposteMod 0 for Clear weather (no modifier)', () => {
    const mod = getStyleWeatherModifier(FightingStyle.ParryRiposte, 'Clear', []);
    expect(mod.riposteMod).toBe(0);
  });
});

describe('Gap 4: style-weather riposteMod is applied in combat resolution', () => {
  it('ParryRiposte in Dense Fog gets more ripostes than in Clear weather', () => {
    const defender = makeWarrior('Riposter', FightingStyle.ParryRiposte);
    const attacker = makeWarrior('Basher', FightingStyle.BashingAttack);
    const planD = defaultPlanForWarrior(defender);
    const planA = defaultPlanForWarrior(attacker);

    // Run multiple seeds to get a statistical sample
    let fogRipostes = 0;
    let clearRipostes = 0;
    const seeds = [42, 100, 200, 300, 500, 700, 1000, 1500, 2000, 3000];

    for (const seed of seeds) {
      const fogOutcome = simulateFight(planA, planD, attacker, defender, seed, undefined, 'Dense Fog');
      const clearOutcome = simulateFight(planA, planD, attacker, defender, seed, undefined, 'Clear');

      fogRipostes += countRipostes(fogOutcome.log);
      clearRipostes += countRipostes(clearOutcome.log);
    }

    // Dense Fog should produce more ripostes due to the +3 riposteMod
    // from STYLE_WEATHER_MODIFIERS plus the +12 from WEATHER_EFFECTS
    expect(fogRipostes).toBeGreaterThan(clearRipostes);
  });

  it('ParryLunge in Dense Fog gets more ripostes than in Clear weather', () => {
    const defender = makeWarrior('ParryLunger', FightingStyle.ParryLunge);
    const attacker = makeWarrior('Basher', FightingStyle.BashingAttack);
    const planD = defaultPlanForWarrior(defender);
    const planA = defaultPlanForWarrior(attacker);

    let fogRipostes = 0;
    let clearRipostes = 0;
    const seeds = [42, 100, 200, 300, 500, 700, 1000, 1500, 2000, 3000];

    for (const seed of seeds) {
      const fogOutcome = simulateFight(planA, planD, attacker, defender, seed, undefined, 'Dense Fog');
      const clearOutcome = simulateFight(planA, planD, attacker, defender, seed, undefined, 'Clear');

      fogRipostes += countRipostes(fogOutcome.log);
      clearRipostes += countRipostes(clearOutcome.log);
    }

    // Dense Fog should produce more ripostes due to the +2 riposteMod
    expect(fogRipostes).toBeGreaterThan(clearRipostes);
  });

  it('style-weather riposteMod stacks with weatherEffect.riposteMod', () => {
    // Dense Fog base weatherEffect.riposteMod = +12 (from WEATHER_EFFECTS)
    // Dense Fog:ParryRiposte styleWeatherMod.riposteMod = +3 (from STYLE_WEATHER_MODIFIERS)
    // Total should be +15, producing significantly more ripostes than
    // a weather with only base riposteMod and no style bonus

    const defender = makeWarrior('Riposter', FightingStyle.ParryRiposte);
    const attacker = makeWarrior('Basher', FightingStyle.BashingAttack);
    const planD = defaultPlanForWarrior(defender);
    const planA = defaultPlanForWarrior(attacker);

    // Mist has riposteMod +2 but no style-weather modifier for ParryRiposte
    let fogRipostes = 0;
    let mistRipostes = 0;
    const seeds = [42, 100, 200, 300, 500, 700, 1000, 1500, 2000, 3000];

    for (const seed of seeds) {
      const fogOutcome = simulateFight(planA, planD, attacker, defender, seed, undefined, 'Dense Fog');
      const mistOutcome = simulateFight(planA, planD, attacker, defender, seed, undefined, 'Mist');

      fogRipostes += countRipostes(fogOutcome.log);
      mistRipostes += countRipostes(mistOutcome.log);
    }

    // Dense Fog (+12 base + +3 style = +15) should have more ripostes
    // than Mist (+2 base + 0 style = +2)
    expect(fogRipostes).toBeGreaterThan(mistRipostes);
  });
});
