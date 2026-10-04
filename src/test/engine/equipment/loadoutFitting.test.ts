import { describe, it, expect } from 'vitest';
import { FightingStyle, type Attributes } from '@/types/shared.types';
import { checkWeaponRequirements, getStyleDefaultLoadout, SHIELD_ITEM_IDS } from '@/data/equipment';
import { getWeaponSuitability } from '@/engine/equipment/weaponSuitability';
import {
  fitWeapon,
  getFittedLoadout,
  refitWeapon,
  weaponFitScore,
} from '@/engine/equipment/loadoutFitting';
import { makeWarrior } from '@/engine/factories/warriorFactory';
import { refitRosterWeapons } from '@/engine/ai/workers/rosterWorkerEquipment';

const ALL_STYLES = Object.values(FightingStyle);
const FLAT_15: Attributes = { ST: 15, CN: 15, SZ: 15, WT: 15, WL: 15, SP: 15, DF: 15 };
// A typical tank-archetype recruit: strong body, low wit and deftness.
const TANK_RECRUIT: Attributes = { ST: 11, CN: 16, SZ: 13, WT: 7, WL: 15, SP: 6, DF: 6 };

describe('fitWeapon', () => {
  it('keeps the classic weapon for every style when the warrior meets its requirements', () => {
    for (const style of ALL_STYLES) {
      expect(fitWeapon(style, FLAT_15), style).toBe(getStyleDefaultLoadout(style).weapon);
    }
  });

  it('swaps a Wall of Steel recruit off a Morning Star they cannot wield', () => {
    // Morning Star needs ST 13 / WT 9 / DF 11 — this recruit is 2+2+5 points short.
    expect(checkWeaponRequirements('morning_star', TANK_RECRUIT).met).toBe(false);
    const weapon = fitWeapon(FightingStyle.WallOfSteel, TANK_RECRUIT);
    expect(weapon).not.toBe('morning_star');
    expect(checkWeaponRequirements(weapon, TANK_RECRUIT).attPenalty).toBeGreaterThan(
      checkWeaponRequirements('morning_star', TANK_RECRUIT).attPenalty
    );
  });

  it('never picks a weapon the style is Unorthodox with', () => {
    for (const style of ALL_STYLES) {
      const weapon = fitWeapon(style, TANK_RECRUIT);
      expect(getWeaponSuitability(weapon, style), `${style} → ${weapon}`).not.toBe('U');
    }
  });

  it('only puts a shield in the weapon hand for Total Parry', () => {
    const shields: readonly string[] = SHIELD_ITEM_IDS;
    for (const style of ALL_STYLES) {
      if (style === FightingStyle.TotalParry) continue;
      expect(shields, style).not.toContain(fitWeapon(style, TANK_RECRUIT));
    }
  });

  it('never scores the chosen weapon below the classic one', () => {
    for (const style of ALL_STYLES) {
      const base = getStyleDefaultLoadout(style);
      const chosen = fitWeapon(style, TANK_RECRUIT);
      expect(weaponFitScore(chosen, style, TANK_RECRUIT, base)).toBeGreaterThanOrEqual(
        weaponFitScore(base.weapon, style, TANK_RECRUIT, base)
      );
    }
  });

  it('skips two-handed weapons while a shield is strapped on', () => {
    const withShield = {
      ...getStyleDefaultLoadout(FightingStyle.AimedBlow),
      shield: 'small_shield',
    };
    // Aimed Blow's classic Quarterstaff is two-handed.
    expect(fitWeapon(FightingStyle.AimedBlow, FLAT_15, withShield)).not.toBe('quarterstaff');
  });

  it('is deterministic', () => {
    expect(fitWeapon(FightingStyle.StrikingAttack, TANK_RECRUIT)).toBe(
      fitWeapon(FightingStyle.StrikingAttack, TANK_RECRUIT)
    );
  });
});

describe('refitWeapon / getFittedLoadout', () => {
  it('returns the same loadout object when the weapon already fits', () => {
    const loadout = getFittedLoadout(FightingStyle.WallOfSteel, TANK_RECRUIT);
    expect(refitWeapon(FightingStyle.WallOfSteel, TANK_RECRUIT, loadout)).toBe(loadout);
  });

  it('only changes the weapon slot', () => {
    const loadout = {
      weapon: 'morning_star',
      armor: 'leather',
      shield: 'none_shield',
      helm: 'leather_cap',
    };
    const next = refitWeapon(FightingStyle.WallOfSteel, TANK_RECRUIT, loadout);
    expect(next.weapon).not.toBe('morning_star');
    expect({ ...next, weapon: loadout.weapon }).toEqual(loadout);
  });

  it('hands the favorite back once the warrior trains into its requirements', () => {
    const fitted = getFittedLoadout(FightingStyle.WallOfSteel, TANK_RECRUIT);
    const trained = { ...TANK_RECRUIT, ST: 13, WT: 9, DF: 11 };
    expect(refitWeapon(FightingStyle.WallOfSteel, trained, fitted).weapon).toBe('morning_star');
  });
});

describe('fitted loadouts at the creation and roster seams', () => {
  it('makeWarrior equips a weapon fitted to the warrior, not the bare style default', () => {
    const w = makeWarrior({ id: undefined, name: 'Recruit', style: FightingStyle.WallOfSteel, attrs: TANK_RECRUIT });
    expect(w.equipment?.weapon).toBe(fitWeapon(FightingStyle.WallOfSteel, TANK_RECRUIT));
  });

  it('makeWarrior still honours an explicit equipment override', () => {
    const equipment = getStyleDefaultLoadout(FightingStyle.WallOfSteel);
    const w = makeWarrior({ id: undefined, name: 'Recruit', style: FightingStyle.WallOfSteel, attrs: TANK_RECRUIT, overrides: {
      equipment,
    } });
    expect(w.equipment).toBe(equipment);
  });

  it('refitRosterWeapons re-arms active warriors and leaves the rest alone', () => {
    const misarmed = makeWarrior({ id: undefined, name: 'A', style: FightingStyle.WallOfSteel, attrs: TANK_RECRUIT, overrides: {
      equipment: getStyleDefaultLoadout(FightingStyle.WallOfSteel),
    } });
    const retired = { ...misarmed, id: 'r' as never, status: 'Retired' as const };
    const roster = [misarmed, retired];
    const next = refitRosterWeapons(roster);
    expect(next[0]!.equipment?.weapon).not.toBe('morning_star');
    expect(next[1]).toBe(retired);
  });

  it('refitRosterWeapons returns the same array when nothing changes', () => {
    const roster = [makeWarrior({ id: undefined, name: 'A', style: FightingStyle.WallOfSteel, attrs: TANK_RECRUIT })];
    expect(refitRosterWeapons(roster)).toBe(roster);
  });
});
