/**
 * V24 canon — Assur's off-hand requirement rules (Arena 93):
 *  - Off-hand items have NO wit and NO size requirement, same ST requirement.
 *  - Wielding two items takes deftness from the MH-req × OH-req grid.
 *  - Battle Axe needs SZ 9 only when carrying an off-hand item.
 *  - Off-hand attacks come from the coordinated OR the ambidextrous (Smithy).
 */
import { describe, it, expect } from 'vitest';
import { checkLoadoutWieldability } from '@/data/equipment';
import { offhandDualDfReq } from '@/data/equipment/offhandGrid';
import { tryOffhandAttack } from '@/engine/combat/resolution/offhandAttack';
import { makeFighterState, makeResolutionContext } from '@/test/_fixtures/factories';
import type { CombatEvent } from '@/types/combat.types';

const loadout = (weapon: string, offhand?: string, shield?: string) =>
  ({ weapon, offhand, shield }) as never;

describe('off-hand requirement relax (canon: no WT, no SZ, same ST)', () => {
  it('an epee in the off hand needs no wit and no size', () => {
    // EP WT req is 15 — a WT-3, SZ-3 warrior can still carry it off-hand.
    // (DF grid still applies: DA(7)×EP(15) → 18.)
    const res = checkLoadoutWieldability(
      loadout('dagger', 'epee'),
      { ST: 9, SZ: 3, WT: 3, DF: 18 }
    );
    expect(res.failures.filter((f) => f.stat === 'WT')).toEqual([]);
    expect(res.failures.filter((f) => f.stat === 'SZ')).toEqual([]);
    expect(res.met).toBe(true);
  });

  it('strength requirement still applies to the off-hand item', () => {
    // OH war_hammer needs ST 13 — ST 9 fails even though WT/SZ are ignored.
    const res = checkLoadoutWieldability(
      loadout('dagger', 'war_hammer'),
      { ST: 9, SZ: 18, WT: 3, DF: 18 }
    );
    expect(res.met).toBe(false);
    expect(res.failures.some((f) => f.stat === 'ST')).toBe(true);
  });
});

describe('MH×OH deftness grid (canon anchors)', () => {
  it('grid values match Assur chart', () => {
    expect(offhandDualDfReq(5, 7)).toBe(9); // article worked example ME×LG
    expect(offhandDualDfReq(3, 3)).toBe(4);
    expect(offhandDualDfReq(15, 15)).toBe(22);
    expect(offhandDualDfReq(11, 15)).toBe(20);
  });

  it('the pair check uses the grid: ME(5)×LG(7) needs DF 9', () => {
    const attrs = { ST: 18, SZ: 18, WT: 18, DF: 8 };
    expect(
      checkLoadoutWieldability(loadout('short_sword', 'medium_shield'), attrs).met
    ).toBe(false);
    expect(
      checkLoadoutWieldability(loadout('short_sword', 'medium_shield'), { ...attrs, DF: 9 })
        .met
    ).toBe(true);
  });
});

describe('Battle Axe offhand carry', () => {
  it('BA alone needs only SZ 3; BA + offhand item needs SZ 9', () => {
    const solo = checkLoadoutWieldability(loadout('battle_axe'), {
      ST: 15,
      SZ: 5,
      WT: 9,
      DF: 11,
    });
    expect(solo.met).toBe(true);
    const dual = checkLoadoutWieldability(loadout('battle_axe', 'dagger'), {
      ST: 15,
      SZ: 5,
      WT: 9,
      DF: 11,
    });
    expect(dual.met).toBe(false);
    expect(
      checkLoadoutWieldability(loadout('battle_axe', 'dagger'), {
        ST: 15,
        SZ: 9,
        WT: 9,
        DF: 11,
      }).met
    ).toBe(true);
  });
});

describe('off-hand attack gate (Smithy: coordinated OR ambidextrous)', () => {
  const base = {
    hp: 50,
    knockedDown: false,
    offhandWeaponId: 'dagger',
    attributes: { ST: 10, SZ: 10, WT: 10, WL: 10, SP: 3, DF: 3, CN: 10 },
    derived: { damage: 5 },
    skills: { ATT: 5, PAR: 5, DEF: 5, INI: 5, RIP: 5, DEC: 5 },
  };

  it('an ambidextrous fighter swings the off hand without the VHC profile', () => {
    const ctx = makeResolutionContext({ rng: () => 0.5 });
    const attacker = makeFighterState({ ...base, handedness: 'ambidextrous' } as never);
    const defender = makeFighterState({ label: 'D' } as never);
    const events: CombatEvent[] = [];
    expect(tryOffhandAttack({ ctx, attacker, defender, events })).toBe(true);
  });

  it('a non-ambi, non-VHC fighter still cannot swing the off hand', () => {
    const ctx = makeResolutionContext({ rng: () => 0.5 });
    const attacker = makeFighterState({ ...base, handedness: 'right' } as never);
    const defender = makeFighterState({ label: 'D' } as never);
    expect(tryOffhandAttack({ ctx, attacker, defender, events: [] })).toBe(false);
  });
});
