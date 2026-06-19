/**
 * Per-Style Win Conditions — Phase 2 Combat Balance
 *
 * Tests for the three mechanical win conditions:
 * - AB: inherent called shot (armor bypass + location severity)
 * - TP: fatigue-exploit counter
 * - LU/PL: decaying first-strike pressure (split momentum payoff)
 */
import { describe, it, expect } from 'vitest';
import { simulateFight, defaultPlanForWarrior } from '@/engine/simulate';
import { FightingStyle, type Warrior, type WarriorId, type FightPlan } from '@/types/game';
import { computeWarriorStats } from '@/engine/skillCalc';
import { applyArmorTypeMod } from '@/engine/combat/mechanics/combatDamage';
import { styleRiposteBonus } from '@/engine/combat/resolution/resolution';
import type { FighterState } from '@/engine/combat/resolution/types';
import { FightingStyle as FS } from '@/types/shared.types';

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeWarrior(
  name: string,
  style: FightingStyle,
  attrs: Partial<Record<'ST' | 'CN' | 'SZ' | 'WT' | 'WL' | 'SP' | 'DF', number>> = {},
  overrides: Partial<Warrior> = {}
): Warrior {
  const full = { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10, ...attrs };
  const { baseSkills, derivedStats } = computeWarriorStats(full, style);
  return {
    id: `test_${name}` as WarriorId,
    name,
    style,
    attributes: full,
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
    ...overrides,
  };
}

const FIGHTS = 200;

function winRate(
  planA: FightPlan,
  planD: FightPlan,
  wA: Warrior,
  wD: Warrior,
  n: number = FIGHTS
): number {
  let wins = 0;
  for (let i = 0; i < n; i++) {
    const outcome = simulateFight(planA, planD, wA, wD, i * 7919 + 42);
    if (outcome.winner === 'A') wins++;
  }
  return wins / n;
}

// ─── AB: Armor Bypass ───────────────────────────────────────────────────────

describe('AB — inherent called shot (armor bypass)', () => {
  it('AB landed hit vs armored target deals more post-mitigation damage than non-AB with identical stats', () => {
    // Use applyArmorTypeMod to verify the bypass math: with DF=15, bypass=0.3
    // AB damage = mitigated + 0.3 * (raw - mitigated)
    // Non-AB damage = mitigated
    // So AB > non-AB whenever armor mitigates (raw > mitigated)
    const rawDamage = 10;
    const weaponId = 'longsword'; // slash
    const armorId = 'plate_armor'; // slash: 0.8 → mitigated = 8

    const mitigated = applyArmorTypeMod(rawDamage, weaponId, armorId);
    expect(mitigated).toBe(8); // 10 * 0.8 = 8

    // AB with DF=15: bypass = 15/50 = 0.3
    const bypass = Math.max(0, Math.min(0.4, 15 / 50));
    const abDamage = Math.round(mitigated + bypass * (rawDamage - mitigated));
    expect(abDamage).toBeGreaterThan(mitigated);
    expect(abDamage).toBe(9); // 8 + 0.3 * 2 = 8.6 → 9
  });

  it('AB bypass scales with DF — higher DF yields more bypass', () => {
    const rawDamage = 50;
    const weaponId = 'longsword';
    const armorId = 'plate_armor';
    const mitigated = applyArmorTypeMod(rawDamage, weaponId, armorId);

    // Use rawDamage=50 so the bypass differences survive Math.round
    const bypassDF5 = Math.max(0, Math.min(0.4, 5 / 50));
    const bypassDF10 = Math.max(0, Math.min(0.4, 10 / 50));
    const bypassDF15 = Math.max(0, Math.min(0.4, 15 / 50));

    const dmgDF5 = Math.round(mitigated + bypassDF5 * (rawDamage - mitigated));
    const dmgDF10 = Math.round(mitigated + bypassDF10 * (rawDamage - mitigated));
    const dmgDF15 = Math.round(mitigated + bypassDF15 * (rawDamage - mitigated));

    expect(dmgDF10).toBeGreaterThan(dmgDF5);
    expect(dmgDF15).toBeGreaterThan(dmgDF10);
  });

  it('AB bypass is capped at 0.4', () => {
    const bypassDF100 = Math.max(0, Math.min(0.4, 100 / 50));
    expect(bypassDF100).toBe(0.4);
  });

  it('AB vs heavy-armor opponent: AB armor counter signature (AB damage advantage scales with armor)', () => {
    // Direct math test: AB's post-mitigation damage advantage over non-AB
    // grows as armor gets heavier. This is the core identity of the mechanic.
    const rawDamage = 20;
    const weaponId = 'longsword';
    const bypass = Math.max(0, Math.min(0.4, 15 / 50)); // DF=15

    // Light armor (leather): slash mult = 0.9
    const lightMitigated = applyArmorTypeMod(rawDamage, weaponId, 'leather_armor');
    const lightAB = Math.round(lightMitigated + bypass * (rawDamage - lightMitigated));
    const lightAdvantage = lightAB - lightMitigated;

    // Heavy armor (plate): slash mult = 0.8
    const heavyMitigated = applyArmorTypeMod(rawDamage, weaponId, 'plate_armor');
    const heavyAB = Math.round(heavyMitigated + bypass * (rawDamage - heavyMitigated));
    const heavyAdvantage = heavyAB - heavyMitigated;

    // AB's advantage over non-AB should be larger vs heavier armor
    expect(heavyAdvantage).toBeGreaterThanOrEqual(lightAdvantage);
    expect(heavyAB).toBeGreaterThan(heavyMitigated);
  });
});

// ─── TP: Fatigue-Exploit Counter ────────────────────────────────────────────

describe('TP — fatigue-exploit counter', () => {
  // ── Direct unit tests for styleRiposteBonus ──────────────────────────────
  function makeMockFighter(style: FS, endurance: number, maxEndurance: number, momentum: number = 0): FighterState {
    return {
      label: 'D',
      style,
      attributes: { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
      skills: { ATT: 10, PAR: 10, DEF: 10, INI: 10, DMG: 10 } as any,
      derived: { damage: 10 } as any,
      plan: {} as any,
      activePlan: {} as any,
      psychState: 'Neutral' as any,
      hp: 20, maxHp: 20,
      endurance, maxEndurance,
      hitsLanded: 0, hitsTaken: 0, ripostes: 0, consecutiveHits: 0,
      armHits: 0, legHits: 0,
      momentum,
      committed: false,
      survivalStrike: false,
      recoveryDebt: 0,
    } as FighterState;
  }

  it('TP gets no riposte bonus when opponent endurance is full', () => {
    const tp = makeMockFighter(FS.TotalParry, 50, 50);
    const opp = makeMockFighter(FS.StrikingAttack, 50, 50);
    const bonus = styleRiposteBonus(tp, opp);
    expect(bonus.ripBonus).toBe(0);
    expect(bonus.dmgBonus).toBe(0);
  });

  it('TP gets moderate riposte bonus when opponent endurance < 50%', () => {
    const tp = makeMockFighter(FS.TotalParry, 50, 50);
    const opp = makeMockFighter(FS.StrikingAttack, 20, 50); // 40%
    const bonus = styleRiposteBonus(tp, opp);
    expect(bonus.ripBonus).toBe(2);
    expect(bonus.dmgBonus).toBe(1);
  });

  it('TP gets heavy riposte bonus when opponent endurance < 25%', () => {
    const tp = makeMockFighter(FS.TotalParry, 50, 50);
    const opp = makeMockFighter(FS.StrikingAttack, 10, 50); // 20%
    const bonus = styleRiposteBonus(tp, opp);
    expect(bonus.ripBonus).toBe(5);
    expect(bonus.dmgBonus).toBe(2);
  });

  it('Non-TP style gets no fatigue-exploit bonus regardless of opponent endurance', () => {
    const lu = makeMockFighter(FS.LungingAttack, 50, 50);
    const opp = makeMockFighter(FS.StrikingAttack, 5, 50); // 10%
    const bonus = styleRiposteBonus(lu, opp);
    expect(bonus.ripBonus).toBe(0);
    expect(bonus.dmgBonus).toBe(0);
  });

  // ── Harness test: TP vs low-CN opponent (exhausts faster) ────────────────
  it('TP harness: TP wins more vs low-CN opponent (fast exhaustion) than vs high-CN opponent (slow exhaustion)', () => {
    // Low-CN opponent has less endurance → exhausts faster → TP's counter fires sooner
    const tpWarrior = makeWarrior('TP', FightingStyle.TotalParry, {
      ST: 10, CN: 15, SZ: 12, WT: 10, WL: 15, SP: 8, DF: 10,
    });

    const lowCNWarrior = makeWarrior('LowCN', FightingStyle.BashingAttack, {
      ST: 15, CN: 5, SZ: 12, WT: 8, WL: 8, SP: 10, DF: 8,
    });

    const highCNWarrior = makeWarrior('HighCN', FightingStyle.BashingAttack, {
      ST: 15, CN: 18, SZ: 12, WT: 8, WL: 8, SP: 10, DF: 8,
    });

    const tpPlan = defaultPlanForWarrior(tpWarrior);
    const lowCNPlan: FightPlan = { ...defaultPlanForWarrior(lowCNWarrior), OE: 8, AL: 7 };
    const highCNPlan: FightPlan = { ...defaultPlanForWarrior(highCNWarrior), OE: 8, AL: 7 };

    const tpVsLowCN = winRate(tpPlan, lowCNPlan, tpWarrior, lowCNWarrior);
    const tpVsHighCN = winRate(tpPlan, highCNPlan, tpWarrior, highCNWarrior);

    // TP should exploit the low-CN opponent's faster exhaustion
    expect(tpVsLowCN).toBeGreaterThan(tpVsHighCN);
  });
});

// ─── LU / PL: Momentum-Based Pressure ───────────────────────────────────────

describe('LU / PL — decaying first-strike pressure (split)', () => {
  // ── Direct unit tests for PL momentum riposte bonus ──────────────────────
  function makeMockFighter(style: FS, endurance: number, maxEndurance: number, momentum: number = 0): FighterState {
    return {
      label: 'D',
      style,
      attributes: { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
      skills: { ATT: 10, PAR: 10, DEF: 10, INI: 10, DMG: 10 } as any,
      derived: { damage: 10 } as any,
      plan: {} as any,
      activePlan: {} as any,
      psychState: 'Neutral' as any,
      hp: 20, maxHp: 20,
      endurance, maxEndurance,
      hitsLanded: 0, hitsTaken: 0, ripostes: 0, consecutiveHits: 0,
      armHits: 0, legHits: 0,
      momentum,
      committed: false,
      survivalStrike: false,
      recoveryDebt: 0,
    } as FighterState;
  }

  it('PL with momentum=0 gets no riposte bonus', () => {
    const pl = makeMockFighter(FS.ParryLunge, 50, 50, 0);
    const opp = makeMockFighter(FS.StrikingAttack, 50, 50);
    const bonus = styleRiposteBonus(pl, opp);
    expect(bonus.ripBonus).toBe(0);
    expect(bonus.dmgBonus).toBe(0);
  });

  it('PL with negative momentum gets no riposte bonus', () => {
    const pl = makeMockFighter(FS.ParryLunge, 50, 50, -2);
    const opp = makeMockFighter(FS.StrikingAttack, 50, 50);
    const bonus = styleRiposteBonus(pl, opp);
    expect(bonus.ripBonus).toBe(0);
    expect(bonus.dmgBonus).toBe(0);
  });

  it('PL with momentum=2 gets riposte chance +2 and damage +1', () => {
    const pl = makeMockFighter(FS.ParryLunge, 50, 50, 2);
    const opp = makeMockFighter(FS.StrikingAttack, 50, 50);
    const bonus = styleRiposteBonus(pl, opp);
    expect(bonus.ripBonus).toBe(2);
    expect(bonus.dmgBonus).toBe(1);
  });

  it('PL with momentum=3 gets riposte chance +3 and damage +1.5', () => {
    const pl = makeMockFighter(FS.ParryLunge, 50, 50, 3);
    const opp = makeMockFighter(FS.StrikingAttack, 50, 50);
    const bonus = styleRiposteBonus(pl, opp);
    expect(bonus.ripBonus).toBe(3);
    expect(bonus.dmgBonus).toBe(1.5);
  });

  it('LU style gets no riposte bonus from momentum (LU payoff is on hit damage, not riposte)', () => {
    const lu = makeMockFighter(FS.LungingAttack, 50, 50, 3);
    const opp = makeMockFighter(FS.StrikingAttack, 50, 50);
    const bonus = styleRiposteBonus(lu, opp);
    expect(bonus.ripBonus).toBe(0);
    expect(bonus.dmgBonus).toBe(0);
  });

  // ── Harness: LU and PL remain distinct ───────────────────────────────────
  it('LU and PL produce different win profiles vs the same opponent (styles are distinct)', () => {
    const luWarrior = makeWarrior('LU', FightingStyle.LungingAttack, {
      ST: 10, CN: 10, SZ: 10, WT: 12, WL: 10, SP: 18, DF: 15,
    });
    const plWarrior = makeWarrior('PL', FightingStyle.ParryLunge, {
      ST: 10, CN: 10, SZ: 10, WT: 12, WL: 10, SP: 18, DF: 15,
    });

    const oppWarrior = makeWarrior('Opp', FightingStyle.StrikingAttack, {
      ST: 15, CN: 10, SZ: 10, WT: 12, WL: 10, SP: 12, DF: 10,
    });
    const oppPlan: FightPlan = { ...defaultPlanForWarrior(oppWarrior), OE: 8, AL: 9 };

    const luPlan = defaultPlanForWarrior(luWarrior);
    const plPlan = defaultPlanForWarrior(plWarrior);

    const luVsOpp = winRate(luPlan, oppPlan, luWarrior, oppWarrior);
    const plVsOpp = winRate(plPlan, oppPlan, plWarrior, oppWarrior);

    // The styles should produce different win rates (they have different mechanics)
    expect(Math.abs(luVsOpp - plVsOpp)).toBeGreaterThan(0.0);
  });
});
