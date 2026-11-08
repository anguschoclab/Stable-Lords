/**
 * V24 canon — per-weapon armor/performance overrides (Arena 93):
 *  - Jalopy: the dagger is "poor or ineffective at ASM or higher armor".
 *  - Assur: DA is "surprisingly good against APA/APM" — reconciled: DA is
 *    penalised vs mid armor (ASM/ACM) but NOT vs the plate tiers.
 *  - Lunging weapons have the best knock-down; 2H weapons pay a parry-side
 *    endurance surcharge; WH/HA/QS/SS are the fast blades.
 */
import { describe, it, expect } from 'vitest';
import { applyArmorTypeMod } from '@/engine/combat/mechanics/weaponArmor';
import {
  getWeaponInitiativeMod,
  lungingKnockdownBonus,
  twoHandedParryEnduranceMult,
} from '@/engine/combat/mechanics/weaponStats';
import { LUNGE_KNOCKDOWN_BONUS, TWOHANDED_PARRY_ENDURANCE_SURCHARGE } from '@/constants/combat';

describe('dagger vs armor tiers (Jalopy + Assur, reconciled)', () => {
  it('DA is penalised vs mid armor — worse than the pierce baseline', () => {
    // pierce baseline vs scale_mail is 1.15 today; canon says DA should be
    // poor there — the override must land below the dtype baseline.
    for (const armor of ['scale_mail', 'chain_mail']) {
      expect(applyArmorTypeMod(100, 'dagger', armor)).toBeLessThan(115);
    }
  });

  it('DA holds up vs the plate tiers (Assur: surprisingly good vs APA/APM)', () => {
    for (const armor of ['plate_mail', 'plate_armor']) {
      expect(applyArmorTypeMod(100, 'dagger', armor)).toBeGreaterThanOrEqual(80);
    }
  });
});

describe('lunging weapons knock down best (Assur)', () => {
  it('thrusting/lunging blades get the knockdown bonus', () => {
    expect(lungingKnockdownBonus('long_spear')).toBe(LUNGE_KNOCKDOWN_BONUS);
    expect(lungingKnockdownBonus('short_spear')).toBe(LUNGE_KNOCKDOWN_BONUS);
    expect(lungingKnockdownBonus('maul')).toBe(0);
  });
});

describe('two-handed weapons tire when parrying (Assur)', () => {
  it('2H weapons pay an endurance surcharge on the parry side', () => {
    expect(twoHandedParryEnduranceMult('greatsword')).toBe(
      TWOHANDED_PARRY_ENDURANCE_SURCHARGE
    );
    expect(twoHandedParryEnduranceMult('halberd')).toBe(
      TWOHANDED_PARRY_ENDURANCE_SURCHARGE
    );
    expect(twoHandedParryEnduranceMult('scimitar')).toBe(1);
  });
});

describe('fast weapons (Assur: HA, QS, WH, SS)', () => {
  it('the canon fast four get an initiative edge beyond the weight formula', () => {
    // war_hammer is weight 5 — heavier than a scimitar — yet canon calls it
    // one of the fastest. Its ini mod must beat the heavier 'maul' (wt 8)
    // by more than the raw weight delta alone.
    const wh = getWeaponInitiativeMod('war_hammer');
    const maul = getWeaponInitiativeMod('maul');
    const weightDelta = (8 - 5) * 0.5; // what pure weight formula predicts
    expect(wh - maul).toBeGreaterThan(weightDelta);
    for (const id of ['hatchet', 'quarterstaff', 'short_sword']) {
      expect(getWeaponInitiativeMod(id)).toBeGreaterThan(-1);
    }
  });
});
