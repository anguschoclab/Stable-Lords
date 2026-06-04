import { describe, it, expect } from 'vitest';
import { checkWeaponRequirements, getItemById } from '@/data/equipment';

// A warrior strong enough for most things except where noted.
const BIG = { ST: 18, SZ: 18, WT: 18, DF: 18 };

describe('weapon wield-mode requirements (canonical special cases)', () => {
  it('Battle Axe needs only SZ 3 when used two-handed (default for two-handed weapons)', () => {
    // base canon BA is 15/7/7/9; a SZ-5 warrior would fail SZ 7 normally,
    // but BA is two-handed so the SZ requirement eases to 3.
    const attrs = { ST: 15, SZ: 5, WT: 7, DF: 9 };
    const res = checkWeaponRequirements('battle_axe', attrs);
    expect(res.met).toBe(true);
    expect(res.failures.find((f) => f.stat === 'SZ')).toBeUndefined();
  });

  it('dual-wielding two Epées requires DF 22 (17 if ambidextrous)', () => {
    const df18 = { ST: 18, SZ: 18, WT: 18, DF: 18 };
    // single epee only needs DF 15 → fine
    expect(checkWeaponRequirements('epee', df18).met).toBe(true);
    // dual epee needs DF 22 → DF 18 fails
    expect(checkWeaponRequirements('epee', df18, { wield: 'dual' }).met).toBe(false);
    // …but ambidextrous only needs DF 17 → DF 18 passes
    expect(
      checkWeaponRequirements('epee', df18, { wield: 'dual', ambidextrous: true }).met
    ).toBe(true);
  });

  it('dual Long Sword / Scimitar require DF 17 (15 ambidextrous)', () => {
    const df16 = { ST: 18, SZ: 18, WT: 18, DF: 16 };
    for (const id of ['longsword', 'scimitar']) {
      expect(checkWeaponRequirements(id, df16, { wield: 'dual' }).met).toBe(false); // needs 17
      expect(checkWeaponRequirements(id, df16, { wield: 'dual', ambidextrous: true }).met).toBe(
        true
      ); // needs 15
    }
  });

  it('dual Shortswords require ST 7', () => {
    const weak = { ST: 5, SZ: 18, WT: 18, DF: 18 };
    expect(checkWeaponRequirements('short_sword', weak).met).toBe(true); // single: ST 5 ok
    expect(checkWeaponRequirements('short_sword', weak, { wield: 'dual' }).met).toBe(false); // needs ST 7
  });

  it('Large Shield needs only WT 3 in the off-hand', () => {
    expect(getItemById('large_shield')?.offHandReq).toMatchObject({ WT: 3 });
    const lowWit = { ST: 18, SZ: 18, WT: 3, DF: 18 };
    expect(checkWeaponRequirements('large_shield', lowWit, { wield: 'off_hand' }).met).toBe(true);
  });

  it('scaled penalty still applies when a wield-mode requirement is unmet', () => {
    const res = checkWeaponRequirements('epee', { ...BIG, DF: 19 }, { wield: 'dual' }); // needs 22
    expect(res.met).toBe(false);
    expect(res.attPenalty).toBe((22 - 19) * -2); // -6
  });
});

describe('Fist (unarmed)', () => {
  it('exists with no stat requirements', () => {
    const fist = getItemById('fist');
    expect(fist).toBeDefined();
    expect(fist?.code).toBe('FI');
    const res = checkWeaponRequirements('fist', { ST: 1, SZ: 1, WT: 1, DF: 1 });
    expect(res.met).toBe(true);
    expect(res.failures).toHaveLength(0);
  });
});
