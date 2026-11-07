import { describe, it, expect } from 'vitest';
import { getWallHarmonyBonus } from '@/engine/combat/resolution/wallHarmony';
import { WS_HARMONY_PAR } from '@/constants/combat';
import { prepareExchange } from '@/engine/combat/resolution/exchangePrep';
import { FightingStyle } from '@/types/shared.types';
import type { CombatEvent } from '@/types/combat.types';
import type { FighterState } from '@/engine/combat/resolution/types';
import type { FightPlan } from '@/types/shared.types';
import { makeCombatFighter } from '@/test/_fixtures/combatFighter';
import { makeResolutionContext } from '@/test/_fixtures/factories';

// The She-Puppy rumor (Arena 93, unconfirmed in canon): a wall of steel gets
// a bonus when its OE equals its kill desire — the wall hums behind a
// steadier guard when effort matches intent.
const fighterOf = (style: FightingStyle, oe: number, kd: number): FighterState => {
  const plan = {
    style,
    OE: oe,
    AL: 5,
    killDesire: kd,
    target: 'Any',
    protect: 'Any',
  } as FightPlan;
  return makeCombatFighter({ style, plan, activePlan: plan });
};

describe('getWallHarmonyBonus', () => {
  it('returns the harmony parry bonus for a Wall of Steel whose OE equals KD', () => {
    expect(getWallHarmonyBonus(FightingStyle.WallOfSteel, 6, 6)).toBe(WS_HARMONY_PAR);
  });

  it('returns zero when OE and KD differ', () => {
    expect(getWallHarmonyBonus(FightingStyle.WallOfSteel, 6, 5)).toBe(0);
    expect(getWallHarmonyBonus(FightingStyle.WallOfSteel, 10, 4)).toBe(0);
    expect(getWallHarmonyBonus(FightingStyle.WallOfSteel, 5, 6)).toBe(0);
  });

  it('returns zero for other styles even when OE equals KD', () => {
    for (const style of Object.values(FightingStyle)) {
      if (style === FightingStyle.WallOfSteel) continue;
      expect(getWallHarmonyBonus(style, 6, 6)).toBe(0);
    }
  });
});

describe('WS wall harmony — prepareExchange integration', () => {
  const events = (): CombatEvent[] => [];
  const striker = () => makeCombatFighter({ label: 'D', style: FightingStyle.StrikingAttack });

  it("adds the harmony bonus to a harmonized wall's parry", () => {
    const harmonized = prepareExchange(
      makeResolutionContext(),
      fighterOf(FightingStyle.WallOfSteel, 6, 6),
      striker(),
      events()
    ).passA.parBonus;
    const disharmonized = prepareExchange(
      makeResolutionContext(),
      fighterOf(FightingStyle.WallOfSteel, 6, 5),
      striker(),
      events()
    ).passA.parBonus;
    expect(harmonized - disharmonized).toBe(WS_HARMONY_PAR);
  });

  it('reads phase overrides — a harmonized opening phase hums even off a split base plan', () => {
    const splitPlan = {
      style: FightingStyle.WallOfSteel,
      OE: 8,
      AL: 5,
      killDesire: 4,
      target: 'Any',
      protect: 'Any',
      phases: { opening: { OE: 6, AL: 5, killDesire: 6 } },
    } as FightPlan;
    const split = makeCombatFighter({
      style: FightingStyle.WallOfSteel,
      plan: splitPlan,
      activePlan: splitPlan,
    });
    const flat = fighterOf(FightingStyle.WallOfSteel, 8, 4);
    const har = prepareExchange(
      makeResolutionContext({ phase: 'OPENING' }),
      split,
      striker(),
      events()
    ).passA.parBonus;
    const dis = prepareExchange(
      makeResolutionContext({ phase: 'OPENING' }),
      flat,
      striker(),
      events()
    ).passA.parBonus;
    expect(har - dis).toBe(WS_HARMONY_PAR);
  });

  it('leaves other styles untouched when OE equals KD', () => {
    const fD = fighterOf(FightingStyle.WallOfSteel, 5, 5);
    const har = prepareExchange(
      makeResolutionContext(),
      fighterOf(FightingStyle.StrikingAttack, 6, 6),
      fD,
      events()
    ).passA.parBonus;
    const dis = prepareExchange(
      makeResolutionContext(),
      fighterOf(FightingStyle.StrikingAttack, 6, 5),
      fD,
      events()
    ).passA.parBonus;
    expect(har - dis).toBe(0);
  });
});
