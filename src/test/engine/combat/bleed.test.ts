import { describe, it, expect } from 'vitest';
import { accumulateBleed, tickBleed } from '@/engine/combat/resolution/bleed';
import {
  SL_BLEED_STACKS_PER_HIT,
  SL_BLEED_CAP,
  SL_BLEED_TICK_DMG,
  SL_BLEED_DECAY,
} from '@/constants/combat/combat';
import { FightingStyle, type WarriorId } from '@/types/shared.types';
import type { Warrior } from '@/types/game';
import { simulateFight, defaultPlanForWarrior } from '@/engine/simulate';
import { computeWarriorStats } from '@/engine/skillCalc';

function mk(style: FightingStyle, id: string): Warrior {
  const attrs = { ST: 15, CN: 15, SZ: 15, WT: 15, WL: 15, SP: 15, DF: 15 };
  const { baseSkills, derivedStats } = computeWarriorStats(attrs, style);
  return {
    id: id as WarriorId,
    name: id,
    style,
    attributes: attrs,
    baseSkills,
    derivedStats,
    fame: 0,
    popularity: 0,
    titles: [],
    injuries: [],
    flair: [],
    career: { wins: 0, losses: 0, kills: 0 },
    champion: false,
    status: 'Active',
    age: 20,
    traits: [],
  };
}

describe('accumulateBleed', () => {
  it('adds the per-hit flurry stacks from zero', () => {
    expect(accumulateBleed(0)).toBe(SL_BLEED_STACKS_PER_HIT);
  });

  it('accumulates across hits and clamps at the cap', () => {
    let s = 0;
    for (let i = 0; i < 10; i++) s = accumulateBleed(s);
    expect(s).toBe(SL_BLEED_CAP);
  });
});

describe('tickBleed', () => {
  it('deals stacks × tick damage and decays the stacks', () => {
    const { damage, next } = tickBleed(3);
    expect(damage).toBe(3 * SL_BLEED_TICK_DMG);
    expect(next).toBe(3 - SL_BLEED_DECAY);
  });

  it('never decays below zero', () => {
    const { damage, next } = tickBleed(0);
    expect(damage).toBe(0);
    expect(next).toBe(0);
  });

  it('a full stack bleeds down over successive ticks', () => {
    let s = SL_BLEED_CAP;
    let total = 0;
    while (s > 0) {
      const t = tickBleed(s);
      total += t.damage;
      s = t.next;
    }
    // 5+4+3+2+1 = 15 total bleed damage from a maxed stack
    expect(total).toBe(15 * SL_BLEED_TICK_DMG);
  });
});

describe('SL bleed (integration)', () => {
  it('Slashing Attack stays competitive vs a defensive Parry-Strike via attrition', () => {
    const sl = mk(FightingStyle.SlashingAttack, 'SL');
    const ps = mk(FightingStyle.ParryStrike, 'PS');
    let wins = 0;
    const N = 200;
    for (let i = 0; i < N; i++) {
      const o = simulateFight(
        defaultPlanForWarrior(sl),
        defaultPlanForWarrior(ps),
        sl,
        ps,
        i * 10009 + 41
      );
      if (o.winner === 'A') wins++;
    }
    const rate = wins / N;
    // Bleed rewards sustained engagement — SL should hold its own.
    expect(rate, `SL vs PS win rate ${(rate * 100).toFixed(1)}%`).toBeGreaterThan(0.4);
  });
});
