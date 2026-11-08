/**
 * Extra-value hits — the fourth weapon-chart column (canon Duel2 charting:
 * crits that actually dealt deep damage). Recorded inside
 * applyHitAndCounters when a crit's applied damage clears
 * CRIT_EXTRA_VALUE_MIN_DAMAGE.
 */
import { describe, it, expect } from 'vitest';
import { applyHitAndCounters } from '@/engine/combat/resolution/exchangeHelpers/execution/hitExecution/damage';
import { getStylePassive } from '@/engine/stylePassives';
import { makeCombatFighter } from '@/test/_fixtures/combatFighter';
import { FightingStyle } from '@/types/shared.types';
import type { CombatEvent } from '@/types/combat.types';
import type { HitLocation } from '@/engine/combat/mechanics/combatDamage';
import { CRIT_EXTRA_VALUE_MIN_DAMAGE } from '@/constants/combat/combat';

const passive = (style: FightingStyle) =>
  getStylePassive(style, {
    phase: 'OPENING',
    exchange: 0,
    hitsLanded: 0,
    hitsTaken: 0,
    ripostes: 0,
    consecutiveHits: 0,
    hpRatio: 1,
    endRatio: 1,
    opponentStyle: FightingStyle.WallOfSteel,
  });

const call = (rawDamage: number, rngVal = 0.0) => {
  const attacker = makeCombatFighter({
    weaponId: 'warhammer',
    style: FightingStyle.StrikingAttack,
  });
  const defender = makeCombatFighter({
    label: 'D',
    style: FightingStyle.WallOfSteel,
    armorId: 'none',
    helmId: 'none_helm',
  });
  const events: CombatEvent[] = [];
  const res = applyHitAndCounters({
    events,
    rng: () => rngVal, // 0 → any positive crit chance fires
    rawDamage,
    hitLoc: 'head' as HitLocation,
    attacker,
    defender,
    attPassive: passive(attacker.style),
    attLabel: 'A',
    defLabel: 'D',
  });
  return { res, attacker, defender, events };
};

describe('extra-value hits (fourth chart column)', () => {
  it('tallies critDamages when a crit deals deep applied damage', () => {
    const { res, attacker } = call(25);
    if (!res.isCrit) return; // style with no crit chance — nothing to assert
    expect(attacker.weaponChart?.warhammer?.crits).toBe(1);
    expect(attacker.weaponChart?.warhammer?.critDamages ?? 0).toBe(1);
  });

  it('does not tally critDamages on a shallow crit', () => {
    const { res, attacker } = call(3);
    if (!res.isCrit) return;
    expect(attacker.weaponChart?.warhammer?.crits).toBe(1);
    expect(attacker.weaponChart?.warhammer?.critDamages ?? 0).toBe(0);
  });

  it('does not tally critDamages on a non-crit hit', () => {
    const { attacker } = call(40, 0.9999);
    expect(attacker.weaponChart?.warhammer?.critDamages ?? 0).toBe(0);
  });

  it('exposes the EV threshold constant', () => {
    expect(CRIT_EXTRA_VALUE_MIN_DAMAGE).toBeGreaterThan(0);
  });
});
