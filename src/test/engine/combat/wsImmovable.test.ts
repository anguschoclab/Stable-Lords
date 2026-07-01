import { describe, it, expect } from 'vitest';
import { FightingStyle } from '@/types/shared.types';
import type { WarriorId } from '@/types/shared.types';
import { styleRiposteBonus } from '@/engine/combat/resolution/resolution';
import { simulateFight, defaultPlanForWarrior } from '@/engine/simulate';
import { computeWarriorStats } from '@/engine/skillCalc';
import type { Warrior } from '@/types/game';

// Shim: styleRiposteBonus reads only style/momentum (PL) and endurance (TP).
const f = (style: FightingStyle, momentum = 0) =>
  ({ style, momentum, endurance: 100, maxEndurance: 100 }) as any;

describe('styleRiposteBonus — WS immovable', () => {
  it('PL gets momentum riposte pressure vs a normal target', () => {
    const r = styleRiposteBonus(f(FightingStyle.ParryLunge, 2), f(FightingStyle.StrikingAttack));
    expect(r.ripBonus).toBe(2);
    expect(r.dmgBonus).toBe(1);
  });

  it('PL momentum riposte is negated when the target is Wall of Steel', () => {
    const r = styleRiposteBonus(f(FightingStyle.ParryLunge, 2), f(FightingStyle.WallOfSteel));
    expect(r.ripBonus).toBe(0);
    expect(r.dmgBonus).toBe(0);
  });
});

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

describe('WS immovable (integration)', () => {
  it('Wall of Steel resists a Lunging Attack tempo snowball', () => {
    const ws = mk(FightingStyle.WallOfSteel, 'WS');
    const lu = mk(FightingStyle.LungingAttack, 'LU');
    let wins = 0;
    const N = 200;
    for (let i = 0; i < N; i++) {
      const o = simulateFight(
        defaultPlanForWarrior(ws),
        defaultPlanForWarrior(lu),
        ws,
        lu,
        i * 7177 + 29
      );
      if (o.winner === 'A') wins++;
    }
    const rate = wins / N;
    // WS is immune to LU's snowball — it should hold its own, not get run over.
    expect(rate, `WS vs LU win rate ${(rate * 100).toFixed(1)}%`).toBeGreaterThan(0.35);
  });
});
