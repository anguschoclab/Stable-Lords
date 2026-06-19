import { describe, it, expect } from 'vitest';
import { FightingStyle } from '@/types/shared.types';
import type { WarriorId } from '@/types/shared.types';
import {
  getFrontloadMult,
  getStCritChanceBonus,
  getStCritDamageBonus,
  getExecuteBonus,
} from '@/engine/combat/resolution/strikingAttack';
import {
  ST_FRONTLOAD_START,
  ST_FRONTLOAD_WINDOW,
  ST_CRIT_CHANCE_BONUS,
  ST_CRIT_DAMAGE_BONUS,
  ST_EXECUTE_BONUS,
} from '@/constants/combat/combat';
import { simulateFight, defaultPlanForWarrior } from '@/engine/simulate';
import { computeWarriorStats } from '@/engine/skillCalc';
import type { Warrior } from '@/types/game';

const ST = FightingStyle.StrikingAttack;
const OTHER = FightingStyle.TotalParry;

describe('getFrontloadMult', () => {
  it('peaks at the start for ST', () => {
    expect(getFrontloadMult(ST, 0)).toBeCloseTo(ST_FRONTLOAD_START);
  });
  it('decays to 1.0 by the end of the window', () => {
    expect(getFrontloadMult(ST, ST_FRONTLOAD_WINDOW)).toBeCloseTo(1.0);
  });
  it('never drops below 1.0 past the window', () => {
    expect(getFrontloadMult(ST, ST_FRONTLOAD_WINDOW * 3)).toBe(1.0);
  });
  it('is 1.0 (no-op) for non-ST styles', () => {
    expect(getFrontloadMult(OTHER, 0)).toBe(1.0);
  });
});

describe('ST crit bonuses', () => {
  it('grants chance + damage bonuses for ST', () => {
    expect(getStCritChanceBonus(ST)).toBe(ST_CRIT_CHANCE_BONUS);
    expect(getStCritDamageBonus(ST)).toBe(ST_CRIT_DAMAGE_BONUS);
  });
  it('are zero for non-ST styles', () => {
    expect(getStCritChanceBonus(OTHER)).toBe(0);
    expect(getStCritDamageBonus(OTHER)).toBe(0);
  });
});

describe('getExecuteBonus', () => {
  it('fires against a low-HP target for ST', () => {
    expect(getExecuteBonus(ST, 20, 100)).toBe(ST_EXECUTE_BONUS); // 20% < 30%
  });
  it('does not fire against a healthy target', () => {
    expect(getExecuteBonus(ST, 80, 100)).toBe(0);
  });
  it('is zero for non-ST styles even against a low-HP target', () => {
    expect(getExecuteBonus(OTHER, 20, 100)).toBe(0);
  });
});

function mk(style: FightingStyle, id: string): Warrior {
  const attrs = { ST: 15, CN: 15, SZ: 15, WT: 15, WL: 15, SP: 15, DF: 15 };
  const { baseSkills, derivedStats } = computeWarriorStats(attrs, style);
  return {
    id: id as WarriorId, name: id, style,
    attributes: attrs, baseSkills, derivedStats, fame: 0, popularity: 0,
    titles: [], injuries: [], flair: [], career: { wins: 0, losses: 0, kills: 0 },
    champion: false, status: 'Active', age: 20, traits: [],
  };
}

describe('ST all-in (integration)', () => {
  it('Striking Attack is a real threat against a mid-tier Parry-Lunge', () => {
    const st = mk(FightingStyle.StrikingAttack, 'ST');
    const pl = mk(FightingStyle.ParryLunge, 'PL');
    let wins = 0;
    const N = 400;
    for (let i = 0; i < N; i++) {
      const o = simulateFight(defaultPlanForWarrior(st), defaultPlanForWarrior(pl), st, pl, i * 9001 + 37);
      if (o.winner === 'A') wins++;
    }
    const rate = wins / N;
    // ST is a burst threat — it should be competitive, not a pushover.
    expect(rate, `ST vs PL win rate ${(rate * 100).toFixed(1)}%`).toBeGreaterThan(0.40);
  });
});
