// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { makeStatWarrior } from '@/test/_fixtures/statWarrior';
import { FightingStyle } from '@/types/shared.types';
import {
  getFrontloadMult,
  getStCritChanceBonus,
  getStCritDamageBonus,
  getExecuteBonus,
  strikerParryPierce,
} from '@/engine/combat/resolution/strikingAttack';
import {
  ST_FRONTLOAD_START,
  ST_FRONTLOAD_WINDOW,
  ST_CRIT_CHANCE_BONUS,
  ST_CRIT_DAMAGE_BONUS,
  ST_EXECUTE_BONUS,
  ST_PARRY_PIERCE,
} from '@/constants/combat/combat';
import {
  setupExchange,
  callResolveCombatOffenseDefense,
} from '@/test/_fixtures/exchangeSetup';
import { simulateFight, defaultPlanForWarrior } from '@/engine/simulate';
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

describe('strikerParryPierce', () => {
  it('grants the pierce bonus to ST against a Parry shell', () => {
    expect(strikerParryPierce(ST, 'Parry')).toBe(ST_PARRY_PIERCE);
  });
  it('grants nothing against Dodge or no defensive tactic', () => {
    expect(strikerParryPierce(ST, 'Dodge')).toBe(0);
    expect(strikerParryPierce(ST, 'none')).toBe(0);
  });
  it('grants nothing to non-ST attackers even against Parry', () => {
    expect(strikerParryPierce(OTHER, 'Parry')).toBe(0);
    expect(strikerParryPierce(FightingStyle.WallOfSteel, 'Parry')).toBe(0);
  });
});

describe('strikerParryPierce (wiring)', () => {
  // The defender's defTactic reaches the attack check only through the pierce:
  // sweeping the rng threshold must show strictly more ST successes vs Parry.
  const attackSuccessCount = (defTactic: 'Parry' | 'none') => {
    let ok = 0;
    for (let r = 1; r < 100; r++) {
      const s = setupExchange({
        fA: { style: FightingStyle.StrikingAttack },
        fD: {
          activePlan: {
            style: FightingStyle.WallOfSteel,
            OE: 5,
            AL: 5,
            killDesire: 5,
            target: 'Any',
            defensiveTactic: defTactic,
          } as any,
        },
        ctx: { rng: () => r / 100 },
      });
      callResolveCombatOffenseDefense(s, true);
      const whiffed = s.events.some(
        (e) => e.type === 'ATTACK' && e.result === 'WHIFF'
      );
      if (!whiffed) ok++;
    }
    return ok;
  };

  it('ST converts more attack checks against a Parry defender', () => {
    expect(attackSuccessCount('Parry')).toBeGreaterThan(attackSuccessCount('none'));
  });

  it('a non-ST attacker sees no swing between Parry and none', () => {
    const count = (defTactic: 'Parry' | 'none') => {
      let ok = 0;
      for (let r = 1; r < 100; r++) {
        const s = setupExchange({
          fA: { style: FightingStyle.TotalParry },
          fD: {
            activePlan: {
              style: FightingStyle.WallOfSteel,
              OE: 5,
              AL: 5,
              killDesire: 5,
              target: 'Any',
              defensiveTactic: defTactic,
            } as any,
          },
          ctx: { rng: () => r / 100 },
        });
        callResolveCombatOffenseDefense(s, true);
        const whiffed = s.events.some(
          (e) => e.type === 'ATTACK' && e.result === 'WHIFF'
        );
        if (!whiffed) ok++;
      }
      return ok;
    };
    expect(count('Parry')).toBe(count('none'));
  });
});

function mk(style: FightingStyle, id: string): Warrior {
  return makeStatWarrior(style, id);
}

describe('ST all-in (integration)', () => {
  it('Striking Attack is a real threat against a mid-tier Parry-Lunge', () => {
    const st = mk(FightingStyle.StrikingAttack, 'ST');
    const pl = mk(FightingStyle.ParryLunge, 'PL');
    let wins = 0;
    const N = 200;
    for (let i = 0; i < N; i++) {
      const o = simulateFight({
        planA: defaultPlanForWarrior(st),
        planD: defaultPlanForWarrior(pl),
        warriorA: st,
        warriorD: pl,
        providedRng: i * 9001 + 37,
      });
      if (o.winner === 'A') wins++;
    }
    const rate = wins / N;
    // ST is a burst threat — it should be competitive, not a pushover.
    expect(rate, `ST vs PL win rate ${(rate * 100).toFixed(1)}%`).toBeGreaterThan(0.4);
  });
});
