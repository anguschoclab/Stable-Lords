import { describe, it, expect } from 'vitest';
import { WEAPONS } from '@/data/equipment/weapons';
import { FightingStyle as S } from '@/types/shared.types';

/**
 * Characterization test — locks the EXACT current preferredStyles / restrictedStyles
 * arrays for every weapon in WEAPONS, including element order. Captured from the
 * pre-refactor weapons.ts so any drift during the dedup refactor fails immediately.
 *
 * Set membership is additionally guarded by weaponSuitability.test.ts; this file
 * adds the order guarantee that the cross-check (which uses Set equality) does not.
 */

const EXPECTED_PREFERRED: Record<string, S[]> = {
  fist: [S.AimedBlow, S.BashingAttack, S.ParryStrike, S.StrikingAttack],
  dagger: [S.AimedBlow, S.ParryStrike, S.StrikingAttack, S.TotalParry],
  epee: [
    S.AimedBlow,
    S.LungingAttack,
    S.ParryLunge,
    S.ParryRiposte,
    S.ParryStrike,
    S.SlashingAttack,
    S.StrikingAttack,
    S.TotalParry,
  ],
  hatchet: [
    S.ParryRiposte,
    S.ParryStrike,
    S.SlashingAttack,
    S.StrikingAttack,
    S.TotalParry,
  ],
  short_sword: [
    S.AimedBlow,
    S.LungingAttack,
    S.ParryLunge,
    S.ParryRiposte,
    S.ParryStrike,
    S.SlashingAttack,
    S.StrikingAttack,
    S.TotalParry,
  ],
  scimitar: [
    S.AimedBlow,
    S.ParryLunge,
    S.ParryRiposte,
    S.ParryStrike,
    S.SlashingAttack,
    S.StrikingAttack,
    S.TotalParry,
    S.WallOfSteel,
  ],
  short_spear: [
    S.AimedBlow,
    S.LungingAttack,
    S.ParryLunge,
    S.ParryRiposte,
    S.ParryStrike,
    S.StrikingAttack,
  ],
  broadsword: [
    S.ParryStrike,
    S.SlashingAttack,
    S.StrikingAttack,
    S.TotalParry,
    S.WallOfSteel,
  ],
  longsword: [
    S.AimedBlow,
    S.LungingAttack,
    S.ParryLunge,
    S.ParryRiposte,
    S.ParryStrike,
    S.SlashingAttack,
    S.StrikingAttack,
    S.TotalParry,
  ],
  long_spear: [
    S.AimedBlow,
    S.LungingAttack,
    S.ParryLunge,
    S.ParryRiposte,
    S.ParryStrike,
    S.StrikingAttack,
    S.TotalParry,
  ],
  mace: [S.BashingAttack, S.StrikingAttack],
  morning_star: [S.BashingAttack, S.StrikingAttack, S.WallOfSteel],
  war_flail: [S.BashingAttack, S.StrikingAttack, S.WallOfSteel],
  war_hammer: [S.BashingAttack, S.ParryStrike, S.StrikingAttack, S.TotalParry],
  small_shield: [S.ParryRiposte, S.ParryLunge, S.ParryStrike],
  medium_shield: [S.TotalParry, S.ParryStrike, S.WallOfSteel],
  large_shield: [S.TotalParry],
  quarterstaff: [
    S.AimedBlow,
    S.BashingAttack,
    S.ParryStrike,
    S.StrikingAttack,
    S.TotalParry,
    S.WallOfSteel,
  ],
  great_axe: [S.BashingAttack, S.SlashingAttack, S.StrikingAttack, S.WallOfSteel],
  greatsword: [
    S.BashingAttack,
    S.ParryStrike,
    S.StrikingAttack,
    S.TotalParry,
    S.WallOfSteel,
  ],
  battle_axe: [
    S.ParryStrike,
    S.SlashingAttack,
    S.StrikingAttack,
    S.TotalParry,
    S.WallOfSteel,
  ],
  halberd: [S.BashingAttack, S.StrikingAttack],
  maul: [S.BashingAttack, S.StrikingAttack],
};

const EXPECTED_RESTRICTED: Record<string, S[]> = {
  fist: [
    S.LungingAttack,
    S.ParryLunge,
    S.ParryRiposte,
    S.SlashingAttack,
    S.TotalParry,
    S.WallOfSteel,
  ],
  dagger: [S.BashingAttack, S.ParryLunge, S.ParryRiposte, S.WallOfSteel],
  epee: [S.BashingAttack, S.WallOfSteel],
  hatchet: [S.BashingAttack, S.LungingAttack, S.ParryLunge, S.WallOfSteel],
  short_sword: [S.BashingAttack, S.WallOfSteel],
  scimitar: [S.BashingAttack],
  short_spear: [S.BashingAttack, S.SlashingAttack, S.WallOfSteel],
  broadsword: [S.LungingAttack, S.ParryRiposte],
  longsword: [S.BashingAttack, S.WallOfSteel],
  long_spear: [S.BashingAttack, S.SlashingAttack, S.WallOfSteel],
  mace: [
    S.AimedBlow,
    S.LungingAttack,
    S.ParryLunge,
    S.ParryRiposte,
    S.SlashingAttack,
    S.WallOfSteel,
  ],
  morning_star: [
    S.AimedBlow,
    S.LungingAttack,
    S.ParryLunge,
    S.ParryRiposte,
    S.SlashingAttack,
    S.TotalParry,
  ],
  war_flail: [
    S.AimedBlow,
    S.LungingAttack,
    S.ParryLunge,
    S.ParryRiposte,
    S.SlashingAttack,
    S.TotalParry,
  ],
  war_hammer: [
    S.AimedBlow,
    S.LungingAttack,
    S.ParryLunge,
    S.ParryRiposte,
    S.SlashingAttack,
    S.WallOfSteel,
  ],
  medium_shield: [S.AimedBlow],
  large_shield: [S.LungingAttack, S.SlashingAttack, S.AimedBlow],
  quarterstaff: [S.LungingAttack, S.ParryLunge, S.ParryRiposte, S.SlashingAttack],
  great_axe: [
    S.AimedBlow,
    S.LungingAttack,
    S.ParryLunge,
    S.ParryRiposte,
    S.ParryStrike,
    S.TotalParry,
  ],
  greatsword: [S.AimedBlow, S.LungingAttack, S.ParryLunge, S.ParryRiposte],
  battle_axe: [S.AimedBlow, S.LungingAttack, S.ParryLunge, S.ParryRiposte],
  halberd: [
    S.AimedBlow,
    S.ParryLunge,
    S.ParryRiposte,
    S.ParryStrike,
    S.SlashingAttack,
    S.TotalParry,
    S.WallOfSteel,
  ],
  maul: [
    S.AimedBlow,
    S.LungingAttack,
    S.ParryLunge,
    S.ParryRiposte,
    S.ParryStrike,
    S.SlashingAttack,
    S.TotalParry,
    S.WallOfSteel,
  ],
};

describe('weapons.ts style arrays (characterization — locks current behavior incl. order)', () => {
  for (const w of WEAPONS) {
    it(`${w.id} preferredStyles matches snapshot`, () => {
      expect(w.preferredStyles ?? []).toEqual(EXPECTED_PREFERRED[w.id] ?? []);
    });
    it(`${w.id} restrictedStyles matches snapshot`, () => {
      expect(w.restrictedStyles ?? []).toEqual(EXPECTED_RESTRICTED[w.id] ?? []);
    });
  }

  it('every weapon with preferredStyles has an expected snapshot entry', () => {
    for (const w of WEAPONS) {
      if (w.preferredStyles) {
        expect(EXPECTED_PREFERRED[w.id], `${w.id}: missing from EXPECTED_PREFERRED`).toBeDefined();
      }
    }
  });

  it('every weapon with restrictedStyles has an expected snapshot entry', () => {
    for (const w of WEAPONS) {
      if (w.restrictedStyles) {
        expect(EXPECTED_RESTRICTED[w.id], `${w.id}: missing from EXPECTED_RESTRICTED`).toBeDefined();
      }
    }
  });
});
