/**
 * V23 / D1 — dual wield & the free off-hand shot (Arena 93 canon).
 *
 * Canon: a "weapon in each hand" profile requires Very High Coordination —
 * SP+DF > 31 AND both > 14. The off-hand weapon is actively wielded
 * (equipment.offhand), never combined with a shield, and eases its stat
 * requirements for ambidextrous fighters.
 */
import { describe, it, expect } from 'vitest';
import {
  isVeryHighlyCoordinated,
  tryOffhandAttack,
} from '@/engine/combat/resolution/offhandAttack';
import { checkWeaponRequirements } from '@/data/equipment';
import { DUAL_VHC_SUM_MIN, DUAL_VHC_STAT_MIN } from '@/constants/combat';
import { makeFighterState, makeResolutionContext } from '@/test/_fixtures/factories';
import type { CombatEvent } from '@/types/combat.types';
import type { FighterState } from '@/engine/combat/resolution/types';
import type { Attributes } from '@/types/shared.types';

const dual = (over: Partial<FighterState> = {}): FighterState =>
  makeFighterState({
    label: 'A',
    weaponId: 'broadsword',
    offhandWeaponId: 'dagger',
    attributes: { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 16, DF: 16 },
    ...over,
  });

describe('Very High Coordination gate (canon profile line)', () => {
  it('requires SP+DF ≥ DUAL_VHC_SUM_MIN with BOTH stats ≥ DUAL_VHC_STAT_MIN', () => {
    expect(DUAL_VHC_SUM_MIN).toBe(32);
    expect(DUAL_VHC_STAT_MIN).toBe(15);
    const vhc = dual();
    expect(isVeryHighlyCoordinated(vhc)).toBe(true);
  });

  it('rejects a lopsided build — high sum but one stat below the floor', () => {
    // SP 22 + DF 12 = 34 ≥ 32, but DF 12 < 15 → not VHC for dual wield.
    const lopsided = dual({
      attributes: { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 22, DF: 12 } as Attributes,
    });
    expect(isVeryHighlyCoordinated(lopsided)).toBe(false);
  });

  it('rejects builds just under the sum (all-15s fixture: SP+DF = 30)', () => {
    const all15 = dual({
      attributes: { ST: 15, CN: 15, SZ: 15, WT: 15, WL: 15, SP: 15, DF: 15 } as Attributes,
    });
    expect(isVeryHighlyCoordinated(all15)).toBe(false);
  });
});

describe('free off-hand shot (canon: one free swing per offensive exchange)', () => {
  it('a VHC dual-wielder gets an OFFHAND_ATTACK event', () => {
    const attacker = dual();
    const defender = makeFighterState({ label: 'D' });
    const events: CombatEvent[] = [];
    const ctx = makeResolutionContext({ rng: () => 0.5 });
    const fired = tryOffhandAttack({ ctx, attacker, defender, events });
    expect(fired).toBe(true);
    expect(events.some((e) => e.type === 'OFFHAND_ATTACK' && e.actor === 'A')).toBe(true);
    expect(events.at(-1)?.metadata).toMatchObject({ weaponId: 'dagger' });
  });

  it('no free shot without an off-hand weapon', () => {
    const attacker = dual({ offhandWeaponId: undefined });
    const defender = makeFighterState({ label: 'D' });
    const events: CombatEvent[] = [];
    const ctx = makeResolutionContext({ rng: () => 0.5 });
    expect(tryOffhandAttack({ ctx, attacker, defender, events })).toBe(false);
    expect(events).toHaveLength(0);
  });

  it('no free shot below the VHC gate — even while dual-wielding', () => {
    const attacker = dual({
      attributes: { ST: 15, CN: 15, SZ: 15, WT: 15, WL: 15, SP: 15, DF: 15 } as Attributes,
    });
    const defender = makeFighterState({ label: 'D' });
    const events: CombatEvent[] = [];
    const ctx = makeResolutionContext({ rng: () => 0.5 });
    expect(tryOffhandAttack({ ctx, attacker, defender, events })).toBe(false);
  });
});

describe('dual-wield weapon requirements (canon eased DF for ambis)', () => {
  const attrs: Attributes = { ST: 15, CN: 10, SZ: 10, WT: 15, WL: 10, SP: 10, DF: 18 };

  it('dual wield uses the canonical dual table, not the base reqs', () => {
    const normal = checkWeaponRequirements('epee', attrs, { wield: 'dual' });
    const ambi = checkWeaponRequirements('epee', attrs, {
      wield: 'dual',
      ambidextrous: true,
    });
    expect(normal.met).toBe(false);
    expect(ambi.met).toBe(true);
  });
});
