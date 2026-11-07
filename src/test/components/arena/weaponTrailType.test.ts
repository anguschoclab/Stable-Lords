/**
 * weaponTrailTypeFor — maps equipped weapon ids to attack-trail profiles.
 * The table is exhaustive over the WEAPONS catalog; the completeness check
 * fails loudly when a new weapon id lands without a trail expectation.
 */
import { describe, it, expect } from 'vitest';
import { weaponTrailTypeFor } from '@/components/arena/effects/weaponTrailType';
import { WEAPONS } from '@/data/equipment/weapons';

const EXPECTED: Record<string, ReturnType<typeof weaponTrailTypeFor>> = {
  // pierce
  dagger: 'pierce',
  epee: 'pierce',
  short_spear: 'pierce',
  long_spear: 'pierce',
  halberd: 'pierce',
  // bash
  mace: 'bash',
  morning_star: 'bash',
  war_flail: 'bash',
  war_hammer: 'bash',
  quarterstaff: 'bash',
  maul: 'bash',
  // slash
  hatchet: 'slash',
  short_sword: 'slash',
  scimitar: 'slash',
  broadsword: 'slash',
  longsword: 'slash',
  great_axe: 'slash',
  greatsword: 'slash',
  battle_axe: 'slash',
  // default 'fist' trail — bare fists and shields (no attack trail profile)
  fist: 'fist',
  small_shield: 'fist',
  medium_shield: 'fist',
  large_shield: 'fist',
};

describe('weaponTrailTypeFor', () => {
  it.each(Object.entries(EXPECTED))('maps %s to %s', (id, trail) => {
    expect(weaponTrailTypeFor(id)).toBe(trail);
  });

  it('covers every catalog weapon id', () => {
    for (const w of WEAPONS) {
      expect(EXPECTED, `missing trail expectation for weapon id '${w.id}'`).toHaveProperty(w.id);
    }
  });

  it('falls back to fist for unknown or missing ids', () => {
    expect(weaponTrailTypeFor('nonexistent_id')).toBe('fist');
    expect(weaponTrailTypeFor(undefined)).toBe('fist');
    expect(weaponTrailTypeFor('')).toBe('fist');
  });
});
