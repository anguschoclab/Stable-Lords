/**
 * Gap 4 — STYLE_WEATHER_MODIFIERS riposteMod is computed but never applied
 * in combat resolution. The initiativeMod and damageMult fields are used,
 * but riposteMod is silently discarded.
 */
import { describe, it, expect } from 'vitest';
import { FightingStyle } from '@/types/shared.types';
import type { WarriorId } from '@/types/shared.types';
import type { Warrior } from '@/types/warrior.types';
import { getStyleWeatherModifier } from '@/constants/arena';
import { simulateFight } from '@/engine/simulate';
import { computeWarriorStats } from '@/engine/skillCalc';

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeWarrior(
  name: string,
  style: FightingStyle,
  overrides: Partial<Record<string, number>> = {}
): Warrior {
  const full = { ST: 12, CN: 15, SZ: 10, WT: 12, WL: 12, SP: 12, DF: 15, ...overrides };
  const { baseSkills, derivedStats } = computeWarriorStats(full, style);
  return {
    id: `test_${name}` as WarriorId,
    name,
    style,
    attributes: full as any,
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

function makePlan(style: FightingStyle, overrides: Partial<any> = {}): any {
  return {
    style,
    OE: 7,
    AL: 6,
    killDesire: 5,
    target: 'Any',
    protect: 'Any',
    offensiveTactic: 'none',
    defensiveTactic: 'none',
    ...overrides,
  };
}

function countRipostes(outcome: any): number {
  const exLog = outcome.exchangeLog ?? [];
  return exLog.filter((e: any) => e.ripResult === 'hit').length;
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
    const defender = makeWarrior('Riposter', FightingStyle.ParryRiposte, {
      DF: 17,
      CN: 20,
      WL: 15,
    });
    const attacker = makeWarrior('Basher', FightingStyle.BashingAttack, {
      ST: 8,
      CN: 20,
      SP: 6,
      DF: 5,
    });
    const planD = makePlan(FightingStyle.ParryRiposte, {
      OE: 3,
      AL: 5,
      killDesire: 1,
      defensiveTactic: 'Parry',
    });
    const planA = makePlan(FightingStyle.BashingAttack, { OE: 5, AL: 3, killDesire: 1 });

    let fogRipostes = 0;
    let clearRipostes = 0;
    const seeds = [42, 100, 200, 300, 500, 700, 1000, 1500, 2000, 3000];

    for (const seed of seeds) {
      const fogOutcome = simulateFight(
        planA,
        planD,
        attacker,
        defender,
        seed,
        undefined,
        'Dense Fog'
      );
      const clearOutcome = simulateFight(
        planA,
        planD,
        attacker,
        defender,
        seed,
        undefined,
        'Clear'
      );

      fogRipostes += countRipostes(fogOutcome);
      clearRipostes += countRipostes(clearOutcome);
    }

    // Dense Fog should produce more ripostes due to the +3 riposteMod
    // from STYLE_WEATHER_MODIFIERS plus the +12 from WEATHER_EFFECTS
    expect(fogRipostes).toBeGreaterThan(clearRipostes);
  });

  it('ParryLunge in Dense Fog gets more ripostes than in Clear weather', () => {
    const defender = makeWarrior('ParryLunger', FightingStyle.ParryLunge, {
      DF: 17,
      CN: 20,
      WL: 15,
    });
    const attacker = makeWarrior('Basher', FightingStyle.BashingAttack, {
      ST: 8,
      CN: 20,
      SP: 6,
      DF: 5,
    });
    const planD = makePlan(FightingStyle.ParryLunge, {
      OE: 3,
      AL: 5,
      killDesire: 1,
      defensiveTactic: 'Parry',
    });
    const planA = makePlan(FightingStyle.BashingAttack, { OE: 5, AL: 3, killDesire: 1 });

    let fogRipostes = 0;
    let clearRipostes = 0;
    const seeds = [42, 100, 200, 300, 500, 700, 1000, 1500, 2000, 3000];

    for (const seed of seeds) {
      const fogOutcome = simulateFight(
        planA,
        planD,
        attacker,
        defender,
        seed,
        undefined,
        'Dense Fog'
      );
      const clearOutcome = simulateFight(
        planA,
        planD,
        attacker,
        defender,
        seed,
        undefined,
        'Clear'
      );

      fogRipostes += countRipostes(fogOutcome);
      clearRipostes += countRipostes(clearOutcome);
    }

    // Dense Fog should produce more ripostes due to the +2 riposteMod
    expect(fogRipostes).toBeGreaterThan(clearRipostes);
  });

  it('style-weather riposteMod stacks with weatherEffect.riposteMod', () => {
    const defender = makeWarrior('Riposter', FightingStyle.ParryRiposte, {
      DF: 17,
      CN: 20,
      WL: 15,
    });
    const attacker = makeWarrior('Basher', FightingStyle.BashingAttack, {
      ST: 8,
      CN: 20,
      SP: 6,
      DF: 5,
    });
    const planD = makePlan(FightingStyle.ParryRiposte, {
      OE: 3,
      AL: 5,
      killDesire: 1,
      defensiveTactic: 'Parry',
    });
    const planA = makePlan(FightingStyle.BashingAttack, { OE: 5, AL: 3, killDesire: 1 });

    // Overcast has riposteMod 0 and no style-weather modifier for ParryRiposte
    let fogRipostes = 0;
    let overcastRipostes = 0;
    const seeds = [42, 100, 200, 300, 500, 700, 1000, 1500, 2000, 3000];

    for (const seed of seeds) {
      const fogOutcome = simulateFight(
        planA,
        planD,
        attacker,
        defender,
        seed,
        undefined,
        'Dense Fog'
      );
      const overcastOutcome = simulateFight(
        planA,
        planD,
        attacker,
        defender,
        seed,
        undefined,
        'Overcast'
      );

      fogRipostes += countRipostes(fogOutcome);
      overcastRipostes += countRipostes(overcastOutcome);
    }

    // Dense Fog (+12 base + +3 style = +15) should have more ripostes
    // than Overcast (+0 base + 0 style = +0)
    expect(fogRipostes).toBeGreaterThan(overcastRipostes);
  });
});
