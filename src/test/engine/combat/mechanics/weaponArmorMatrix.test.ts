/**
 * V24-F2 — weapon × armor interaction matrix (full adjudication).
 *
 * Canon basis for every explicit cell + dtype baseline (documented in
 * src/constants/combat/combat/weaponArmorMatrix.ts):
 *  - reality.com armor texts: ALE "reduces rather than stops"; APL cushions
 *    smashing blows but is readily chopped/punctured; ARM absorbs crushing
 *    blows, disadvantaged vs long thin blades; ASM deflects slashes but has
 *    chinks that smash/pierce; ACM = heavier well-designed ringmail (same
 *    strengths/weaknesses, greater degree); APM weak-spot attackers fare
 *    slightly worse, one weapon (DA) fares well; APA — lighter weapons and
 *    the Mordant longspear bounce, but shells get smashed.
 *  - Assur "Which Weapons vs Which Armors?": bash sweet spot vs ASM, not as
 *    good vs APM/APA; DA surprisingly good vs APA/APM; LO among weapons that
 *    struggle vs APA/APM; slash > bash/lunge overall.
 *  - Jalopy: DA "poor or ineffective at ASM or higher" — reconciled with
 *    Assur as a mid-armor penalty, plate parity.
 *
 * The ARM row was canon-inverted pre-F2 ({slash:0.9, pierce:0.9, bash:1.1}) —
 * crushing (bash) is what ringmail ABSORBS and thin blades (pierce) are its
 * disadvantage. These tests pin the corrected direction.
 */
import { describe, it, expect } from 'vitest';
import { applyArmorTypeMod } from '@/engine/combat/mechanics/weaponArmor';
import { WEAPON_ARMOR_MATRIX } from '@/constants/combat';

describe('WEAPON_ARMOR_MATRIX structure', () => {
  it('is keyed by weapon id → canon armor id → number | "dtype-inherit"', () => {
    for (const [weaponId, row] of Object.entries(WEAPON_ARMOR_MATRIX)) {
      expect(typeof weaponId).toBe('string');
      for (const [armorId, cell] of Object.entries(row)) {
        expect(armorId).toMatch(/^(none_armor|ALE|APL|ARM|ASM|ACM|APM|APA)$/);
        expect(typeof cell === 'number' ? cell > 0 : cell === 'dtype-inherit').toBe(true);
      }
    }
  });

  it('every canon armor id appearing in the matrix is a real armor row', async () => {
    const { ARMORS } = await import('@/data/equipment/armor');
    const valid = new Set(ARMORS.map((a) => a.id));
    for (const row of Object.values(WEAPON_ARMOR_MATRIX)) {
      for (const armorId of Object.keys(row)) {
        expect(valid.has(armorId), `matrix armor id ${armorId}`).toBe(true);
      }
    }
  });
});

describe('explicit canon cells (cell factor × armor dtype baseline)', () => {
  it.each([
    // Jalopy mid-armor penalty, reconciled with Assur's plate exception
    ['dagger', 'ASM', 81], // 0.70 × ASM pierce 1.15
    ['dagger', 'ACM', 81], // 0.70 × ACM pierce 1.15
    ['dagger', 'APM', 85], // 1.0 × APM pierce 0.85 — plate parity IS the exception
    ['dagger', 'APA', 80], // 1.0 × APA pierce 0.80
    // reality.com: lighter weapons bounce off the APA shell
    ['epee', 'APA', 68], // 0.85 × APA pierce 0.80
    ['hatchet', 'APA', 68], // 0.85 × APA slash 0.80
    ['short_sword', 'APA', 68], // 0.85 × APA slash 0.80
    ['fist', 'APA', 60], // 0.70 × APA bash 0.85 → round(59.5)=60
    // reality.com: the Mordant longspear bounces off plate armor
    ['long_spear', 'APA', 56], // 0.70 × APA pierce 0.80
    // Assur: LO included among weapons that struggle vs APM/APA
    ['longsword', 'APM', 77], // 0.90 × APM slash 0.85 → round(76.5)=77
    ['longsword', 'APA', 68], // 0.85 × APA slash 0.80
  ])('%s vs %s → %d', (weapon, armor, expected) => {
    expect(applyArmorTypeMod(100, weapon, armor)).toBe(expected);
  });
});

describe('dtype-inherit fallthrough', () => {
  it('weapons without a matrix row use ARMOR_TYPE_MULT by dtype', () => {
    // scimitar=slash has no matrix row → ASM slash 0.8
    expect(applyArmorTypeMod(100, 'scimitar', 'ASM')).toBe(80);
    // battle_axe=slash no row → APM slash 0.85
    expect(applyArmorTypeMod(100, 'battle_axe', 'APM')).toBe(85);
  });

  it('a "dtype-inherit" cell resolves to the dtype baseline, not identity', () => {
    // epee=pierce has an APA cell but inherits elsewhere — e.g. ARM pierce 1.1
    expect(applyArmorTypeMod(100, 'epee', 'ARM')).toBe(110);
  });
});

describe('ARM row — canon-corrected (F2 core fix)', () => {
  it('ringmail absorbs crushing (bash) damage: bash mult < 1', () => {
    // mace=bash → ARM bash 0.85 (was inverted 1.1)
    expect(applyArmorTypeMod(100, 'mace', 'ARM')).toBe(85);
    expect(applyArmorTypeMod(100, 'maul', 'ARM')).toBeLessThan(100);
  });

  it('ringmail is disadvantaged vs long thin blades: pierce mult > 1', () => {
    // dagger=pierce → ARM pierce 1.1 (was inverted 0.9)
    expect(applyArmorTypeMod(100, 'dagger', 'ARM')).toBe(110);
    expect(applyArmorTypeMod(100, 'epee', 'ARM')).toBe(110);
    expect(applyArmorTypeMod(100, 'short_spear', 'ARM')).toBe(110);
  });
});

describe('identity / edge cases', () => {
  it('no weapon or no armor → unchanged', () => {
    expect(applyArmorTypeMod(100, undefined, 'ARM')).toBe(100);
    expect(applyArmorTypeMod(100, 'longsword', undefined)).toBe(100);
    expect(applyArmorTypeMod(100, 'longsword', 'none_armor')).toBe(100);
  });

  it('shield weapons ("none" dtype) skip the armor lookup entirely', () => {
    for (const shield of ['small_shield', 'medium_shield', 'large_shield']) {
      expect(applyArmorTypeMod(50, shield, 'APA')).toBe(50);
    }
  });

  it('unknown weapon id → unchanged', () => {
    expect(applyArmorTypeMod(100, 'magic_sword', 'APA')).toBe(100);
  });

  it('unknown armor id → dtype table miss → unchanged', () => {
    expect(applyArmorTypeMod(100, 'longsword', 'mythril')).toBe(100);
  });
});
