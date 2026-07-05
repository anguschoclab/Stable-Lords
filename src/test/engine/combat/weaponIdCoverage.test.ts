import { describe, it, expect } from 'vitest';
import { WEAPONS, SHIELD_ITEM_IDS, SHIELD_COVERAGE } from '@/data/equipment/weapons';
import {
  STYLE_CLASSIC_WEAPONS,
  getClassicWeaponBonus,
  getItemById,
} from '@/data/equipment/equipment.utils';
import { getWeaponType, getWeaponDisplayName } from '@/engine/narrative/narrativeUtils';
import { WEAPON_DAMAGE_TYPE } from '@/engine/combat/mechanics/weaponArmor';
import { FightingStyle } from '@/types/shared.types';

const SHIELD_IDS = new Set<string>(SHIELD_ITEM_IDS);
const ALL_STYLES = Object.values(FightingStyle);

// ─── 1. getWeaponType() full coverage ─────────────────────────────────────────
// Every weapon in WEAPONS must return a valid WeaponType from getWeaponType().
// Non-fist weapons must NOT silently fall through to the 'fist' default —
// that would mean wrong narration verbs with no error.

describe('getWeaponType full coverage', () => {
  it('every weapon returns a valid WeaponType', () => {
    for (const w of WEAPONS) {
      const type = getWeaponType(w.id);
      expect(['slashing', 'bashing', 'piercing', 'fist']).toContain(type);
    }
  });

  it('non-fist weapons do not fall through to fist default', () => {
    for (const w of WEAPONS) {
      if (w.id === 'fist') continue;
      const type = getWeaponType(w.id);
      expect(type, `${w.id} silently fell through to 'fist' default`).not.toBe('fist');
    }
  });

  it('fist weapon returns fist type', () => {
    expect(getWeaponType('fist')).toBe('fist');
  });

  it('shields return bashing type (for narration verb selection)', () => {
    for (const id of SHIELD_ITEM_IDS) {
      expect(getWeaponType(id)).toBe('bashing');
    }
  });
});

// ─── 2. getWeaponType() hybrid weapons ────────────────────────────────────────
// Hybrid weapons (halberd, short_sword, longsword) should return different
// types depending on fighting style. This indirectly guards HYBRID_WEAPONS.

describe('getWeaponType hybrid weapons', () => {
  it('halberd is slashing for SlashingAttack, piercing for LungingAttack', () => {
    expect(getWeaponType('halberd', FightingStyle.SlashingAttack)).toBe('slashing');
    expect(getWeaponType('halberd', FightingStyle.LungingAttack)).toBe('piercing');
  });

  it('short_sword is slashing for SlashingAttack, piercing for LungingAttack', () => {
    expect(getWeaponType('short_sword', FightingStyle.SlashingAttack)).toBe('slashing');
    expect(getWeaponType('short_sword', FightingStyle.LungingAttack)).toBe('piercing');
  });

  it('longsword is slashing for StrikingAttack, piercing for ParryLunge', () => {
    expect(getWeaponType('longsword', FightingStyle.StrikingAttack)).toBe('slashing');
    expect(getWeaponType('longsword', FightingStyle.ParryLunge)).toBe('piercing');
  });

  it('hybrid weapon without style falls back to first type (not fist)', () => {
    expect(getWeaponType('halberd')).not.toBe('fist');
    expect(getWeaponType('short_sword')).not.toBe('fist');
    expect(getWeaponType('longsword')).not.toBe('fist');
  });
});

// ─── 3. STYLE_CLASSIC_WEAPONS covers every FightingStyle ──────────────────────
// If a new style is added but forgotten in STYLE_CLASSIC_WEAPONS,
// getStyleDefaultLoadout silently falls back to 'broadsword'.

describe('STYLE_CLASSIC_WEAPONS completeness', () => {
  it('every FightingStyle has a classic weapon entry', () => {
    for (const style of ALL_STYLES) {
      expect(
        STYLE_CLASSIC_WEAPONS[style],
        `${style}: missing from STYLE_CLASSIC_WEAPONS (would silently default to broadsword)`
      ).toBeDefined();
    }
  });

  it('every classic weapon value exists in canonical WEAPONS', () => {
    const weaponIds = new Set(WEAPONS.map((w) => w.id));
    for (const [style, weaponId] of Object.entries(STYLE_CLASSIC_WEAPONS)) {
      expect(weaponIds.has(weaponId), `${style}: classic weapon ${weaponId} not in WEAPONS`).toBe(
        true
      );
    }
  });
});

// ─── 4. SHIELD_COVERAGE keys match SHIELD_ITEM_IDS ────────────────────────────
// These two lists must stay in sync. If a shield is added to one but not the
// other, shield zone mitigation silently breaks.

describe('SHIELD_COVERAGE syncs with SHIELD_ITEM_IDS', () => {
  it('every SHIELD_ITEM_ID has a SHIELD_COVERAGE entry', () => {
    for (const id of SHIELD_ITEM_IDS) {
      expect(SHIELD_COVERAGE[id], `${id}: missing from SHIELD_COVERAGE`).toBeDefined();
    }
  });

  it('no extra keys in SHIELD_COVERAGE beyond SHIELD_ITEM_IDS', () => {
    const coverageKeys = Object.keys(SHIELD_COVERAGE);
    for (const key of coverageKeys) {
      expect(SHIELD_IDS.has(key), `${key}: in SHIELD_COVERAGE but not in SHIELD_ITEM_IDS`).toBe(
        true
      );
    }
  });
});

// ─── 5. getClassicWeaponBonus recognizes all shields for TotalParry ───────────
// getClassicWeaponBonus uses a private SHIELD_IDS set that duplicates
// SHIELD_ITEM_IDS. If they drift, a shield could miss the +1 classic bonus.

describe('getClassicWeaponBonus shield coverage', () => {
  it('returns 1 for every shield when style is TotalParry', () => {
    for (const id of SHIELD_ITEM_IDS) {
      expect(
        getClassicWeaponBonus(FightingStyle.TotalParry, id),
        `${id}: should give +1 classic bonus for TotalParry`
      ).toBe(1);
    }
  });

  it('returns 0 for a non-shield when style is TotalParry', () => {
    expect(getClassicWeaponBonus(FightingStyle.TotalParry, 'broadsword')).toBe(0);
  });

  it('returns 1 for each style classic weapon', () => {
    for (const style of ALL_STYLES) {
      const classicWeapon = STYLE_CLASSIC_WEAPONS[style];
      if (!classicWeapon) continue;
      expect(
        getClassicWeaponBonus(style, classicWeapon),
        `${style}: classic weapon ${classicWeapon} should give +1`
      ).toBe(1);
    }
  });
});

// ─── 6. getWeaponDisplayName returns non-default for every weapon ─────────────
// If a weapon falls through to 'WEAPON', the UI/narration shows a generic name.

describe('getWeaponDisplayName full coverage', () => {
  it('every weapon returns its canonical name, not the WEAPON fallback', () => {
    for (const w of WEAPONS) {
      const displayName = getWeaponDisplayName(w.id);
      expect(displayName, `${w.id}: fell through to WEAPON fallback`).not.toBe('WEAPON');
      expect(displayName).toBe(w.name.toUpperCase());
    }
  });

  it('fists and none return OPEN HAND', () => {
    expect(getWeaponDisplayName('fists')).toBe('OPEN HAND');
    expect(getWeaponDisplayName('none')).toBe('OPEN HAND');
    expect(getWeaponDisplayName(undefined)).toBe('OPEN HAND');
  });
});

// ─── 7. Cross-system: getWeaponType vs WEAPON_DAMAGE_TYPE ─────────────────────
// For non-hybrid, non-fist, non-shield weapons, the narration type should
// align with the damage type. A mismatch means correct damage but wrong verbs.

describe('getWeaponType vs WEAPON_DAMAGE_TYPE alignment', () => {
  const HYBRID_WEAPON_IDS = new Set(['halberd', 'short_sword', 'longsword']);

  it('slashing narration weapons have slash damage type', () => {
    for (const w of WEAPONS) {
      if (SHIELD_IDS.has(w.id) || w.id === 'fist' || HYBRID_WEAPON_IDS.has(w.id)) continue;
      const narrationType = getWeaponType(w.id);
      const damageType = WEAPON_DAMAGE_TYPE[w.id];
      if (narrationType === 'slashing') {
        expect(damageType, `${w.id}: slashing narration but non-slash damage`).toBe('slash');
      }
    }
  });

  it('bashing narration weapons have bash damage type', () => {
    for (const w of WEAPONS) {
      if (SHIELD_IDS.has(w.id) || w.id === 'fist' || HYBRID_WEAPON_IDS.has(w.id)) continue;
      const narrationType = getWeaponType(w.id);
      const damageType = WEAPON_DAMAGE_TYPE[w.id];
      if (narrationType === 'bashing') {
        expect(damageType, `${w.id}: bashing narration but non-bash damage`).toBe('bash');
      }
    }
  });

  it('piercing narration weapons have pierce damage type', () => {
    for (const w of WEAPONS) {
      if (SHIELD_IDS.has(w.id) || w.id === 'fist' || HYBRID_WEAPON_IDS.has(w.id)) continue;
      const narrationType = getWeaponType(w.id);
      const damageType = WEAPON_DAMAGE_TYPE[w.id];
      if (narrationType === 'piercing') {
        expect(damageType, `${w.id}: piercing narration but non-pierce damage`).toBe('pierce');
      }
    }
  });

  it('shields have none damage type (no armor mitigation from shields)', () => {
    for (const id of SHIELD_ITEM_IDS) {
      expect(WEAPON_DAMAGE_TYPE[id]).toBe('none');
    }
  });

  it('fist has bash damage type (but fist narration type — by design)', () => {
    expect(WEAPON_DAMAGE_TYPE['fist']).toBe('bash');
    expect(getWeaponType('fist')).toBe('fist');
  });
});

// ─── 8. getItemById finds every weapon ────────────────────────────────────────
// Guards against id typos in the WEAPONS array itself.

describe('getItemById finds every weapon', () => {
  it('every weapon in WEAPONS is found by getItemById', () => {
    for (const w of WEAPONS) {
      const found = getItemById(w.id);
      expect(found, `${w.id}: not found by getItemById`).toBeDefined();
      expect(found?.id).toBe(w.id);
    }
  });
});
