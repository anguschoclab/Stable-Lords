/**
 * getWeaponCategory — classifies weapon display names into animation buckets.
 * The table exercises every keyword branch, the slash default, branch
 * ordering, and case-insensitivity — outcome pins only, not internals.
 */
import { describe, it, expect } from 'vitest';
import { getWeaponCategory } from '@/components/arena/ArenaFighter/utils/weaponCategory';

const CASES: [name: string, expected: ReturnType<typeof getWeaponCategory>][] = [
  // shield — the 'shield' substring already covers the size variants
  ['shield', 'shield'],
  ['small shield', 'shield'],
  ['medium shield', 'shield'],
  ['large shield', 'shield'],
  ['Tower Shield', 'shield'],
  // slash
  ['sword', 'slash'],
  ['scimitar', 'slash'],
  ['axe', 'slash'],
  ['blade', 'slash'],
  ['scythe', 'slash'],
  ['halberd', 'slash'],
  ['Broadsword', 'slash'],
  ['Great Axe', 'slash'],
  // bash
  ['mace', 'bash'],
  ['hammer', 'bash'],
  ['flail', 'bash'],
  ['maul', 'bash'],
  ['morning star', 'bash'],
  ['morningstar', 'bash'],
  ['War Hammer', 'bash'],
  // pierce
  ['spear', 'pierce'],
  ['épée', 'pierce'],
  ['epee', 'pierce'],
  ['dagger', 'pierce'],
  ['pike', 'pierce'],
  ['lance', 'pierce'],
  ['Short Spear', 'pierce'],
  // fist — the 'staff' substring catches quarterstaff
  ['staff', 'fist'],
  ['fist', 'fist'],
  ['gauntlet', 'fist'],
  ['quarterstaff', 'fist'],
  // unknown names fall through to the slash default
  ['rock', 'slash'],
  ['unknown weapon', 'slash'],
  ['', 'slash'],
];

describe('getWeaponCategory', () => {
  it.each(CASES)('classifies %j as %s', (name, expected) => {
    expect(getWeaponCategory(name)).toBe(expected);
  });

  it('is case-insensitive', () => {
    expect(getWeaponCategory('BROADSWORD')).toBe('slash');
    expect(getWeaponCategory('MACE')).toBe('bash');
  });

  it('resolves multi-keyword names to the earliest checked branch', () => {
    // Branch order: shield → slash → bash → pierce → fist.
    expect(getWeaponCategory('spear staff')).toBe('pierce');
  });
});
