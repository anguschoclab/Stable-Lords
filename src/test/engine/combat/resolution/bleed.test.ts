import { describe, it, expect } from 'vitest';
import { makeStatWarrior } from '@/test/_fixtures/statWarrior';
import { makeFighterState, makeResolutionContext } from '@/test/_fixtures/factories';
import { accumulateBleed, tickBleed } from '@/engine/combat/resolution/bleed';
import { resolveExchange } from '@/engine/combat/resolution/resolution';
import { emitDownedBoutEnd } from '@/engine/combat/mechanics/downedFighterEnd';
import {
  SL_BLEED_STACKS_PER_HIT,
  SL_BLEED_CAP,
  SL_BLEED_TICK_DMG,
  SL_BLEED_DECAY,
} from '@/constants/combat/combat';
import { FightingStyle } from '@/types/shared.types';
import type { Warrior } from '@/types/game';
import type { CombatEvent } from '@/types/combat.types';
import { simulateFight, defaultPlanForWarrior } from '@/engine/simulate';

function mk(style: FightingStyle, id: string): Warrior {
  return makeStatWarrior(style, id);
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
        { planA: defaultPlanForWarrior(sl), planD: defaultPlanForWarrior(ps), warriorA: sl, warriorD: ps, providedRng: i * 10009 + 41 }
      );
      if (o.winner === 'A') wins++;
    }
    const rate = wins / N;
    // Bleed rewards sustained engagement — SL should hold its own.
    expect(rate, `SL vs PS win rate ${(rate * 100).toFixed(1)}%`).toBeGreaterThan(0.4);
  });
});

describe('Bleed Mechanics', () => {
  describe('accumulateBleed', () => {
    it('adds stacks up to the cap (5)', () => {
      // 0 + 2 = 2
      expect(accumulateBleed(0)).toBe(2);
      // 3 + 2 = 5
      expect(accumulateBleed(3)).toBe(5);
      // 4 + 2 = 6, capped to 5
      expect(accumulateBleed(4)).toBe(5);
      // 5 + 2 = 7, capped to 5
      expect(accumulateBleed(5)).toBe(5);
    });
  });

  describe('tickBleed', () => {
    it('calculates damage and decays stacks correctly', () => {
      // 0 stacks -> 0 damage, 0 next
      expect(tickBleed(0)).toEqual({ damage: 0, next: 0 });
      // 2 stacks -> 2*1 damage, 2-1 next
      expect(tickBleed(2)).toEqual({ damage: 2, next: 1 });
      // 5 stacks -> 5*1 damage, 5-1 next
      expect(tickBleed(5)).toEqual({ damage: 5, next: 4 });
    });

    it('prevents next stacks from dropping below zero', () => {
      expect(tickBleed(0).next).toBe(0);
    });
  });
});

describe('emitDownedBoutEnd', () => {
  it('emits a KO with the survivor as actor when one fighter is down', () => {
    const fA = makeFighterState({ hp: 30 });
    const fD = makeFighterState({ label: 'D', hp: -2 });
    const events: CombatEvent[] = [];

    emitDownedBoutEnd(fA, fD, events, 'BLEED');

    const end = events.find((e) => e.type === 'BOUT_END');
    expect(end?.result).toBe('KO');
    expect(end?.actor).toBe('A');
    expect(end?.metadata?.cause).toBe('BLEED');
  });

  it('emits an Exhaustion draw when both fighters are down', () => {
    const fA = makeFighterState({ hp: 0 });
    const fD = makeFighterState({ label: 'D', hp: -1 });
    const events: CombatEvent[] = [];

    emitDownedBoutEnd(fA, fD, events, 'ARENA_HAZARD');

    const end = events.find((e) => e.type === 'BOUT_END');
    expect(end?.result).toBe('Exhaustion');
    expect(end?.metadata?.cause).toBe('ARENA_HAZARD');
  });

  it('does nothing when both fighters are still standing', () => {
    const fA = makeFighterState({ hp: 10 });
    const fD = makeFighterState({ label: 'D', hp: 10 });
    const events: CombatEvent[] = [];

    emitDownedBoutEnd(fA, fD, events, 'BLEED');

    expect(events).toHaveLength(0);
  });

  it('does not double-end a bout that already decided', () => {
    const fA = makeFighterState({ hp: 0 });
    const fD = makeFighterState({ label: 'D', hp: 30 });
    const events: CombatEvent[] = [
      { type: 'BOUT_END', actor: 'A', result: 'Kill', metadata: { cause: 'FATAL_DAMAGE' } },
    ];

    emitDownedBoutEnd(fA, fD, events, 'BLEED');

    expect(events.filter((e) => e.type === 'BOUT_END')).toHaveLength(1);
  });
});

describe('bleed termination', () => {
  // Sky-high DEF on both fighters guarantees no weapon hit lands, so the
  // bleed tick is the only thing that can down a low-hp fighter.
  const wall = { ATT: 10, PAR: 200, DEF: 200, INI: 10, RIP: 10, DEC: 10 };

  it('ends the bout when bleed damage drops a fighter to 0 hp', () => {
    const ctx = makeResolutionContext();
    const fA = makeFighterState({ hp: 100, skills: { ...wall } });
    const fD = makeFighterState({ label: 'D', hp: 3, bleedStacks: 5, skills: { ...wall } });

    const events = resolveExchange(ctx, fA, fD);

    const end = events.find((e) => e.type === 'BOUT_END');
    expect(end?.result).toBe('KO');
    expect(end?.actor).toBe('A');
    expect(end?.metadata?.cause).toBe('BLEED');
  });

  it('declares an Exhaustion draw when bleed drops both fighters', () => {
    const ctx = makeResolutionContext();
    const fA = makeFighterState({ hp: 2, bleedStacks: 5, skills: { ...wall } });
    const fD = makeFighterState({ label: 'D', hp: 3, bleedStacks: 5, skills: { ...wall } });

    const events = resolveExchange(ctx, fA, fD);

    const end = events.find((e) => e.type === 'BOUT_END');
    expect(end?.result).toBe('Exhaustion');
    expect(end?.metadata?.cause).toBe('BLEED');
  });
});
