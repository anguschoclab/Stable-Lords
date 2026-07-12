/**
 * Warrior names — verifies new chaotic names are present and no duplicates.
 *
 * Pre-merge test: will FAIL on main because new names don't exist yet.
 */
import { describe, it, expect } from 'vitest';
import { WARRIOR_NAMES } from '@/data/names/warriorNames';

describe('warrior names', () => {
  const NEW_CHAOTIC_NAMES = [
    'VOIDBRINGER',
    'STARFALL',
    'CHAOSSPARK',
    'DOOMHAMMER',
    'NIGHTWEAVER',
    'ECLIPSEKNIGHT',
    'BLOODSTAR',
    'SHADOWFLARE',
    'ASTRALFIEND',
    'NEONBLADE',
  ];

  it('all 10 new chaotic names are present', () => {
    for (const name of NEW_CHAOTIC_NAMES) {
      expect(WARRIOR_NAMES, `missing name: ${name}`).toContain(name);
    }
  });

  it('WARRIOR_NAMES has no duplicate entries', () => {
    const unique = new Set(WARRIOR_NAMES);
    expect(unique.size, `${WARRIOR_NAMES.length - unique.size} duplicate names`).toBe(
      WARRIOR_NAMES.length
    );
  });
});
