// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WeaponAffinitySection } from '@/components/warrior/favorites/WeaponAffinitySection';
import { FightingStyle } from '@/types/shared.types';
import type { Warrior } from '@/types/game';

const baseWarrior = {
  id: 'w1',
  name: 'Test Warrior',
  style: FightingStyle.AimedBlow,
  equipment: {},
  favorites: {
    weaponId: 'epee',
    discovered: { weapon: true, rhythm: false, weaponHints: 0, rhythmHints: 0 },
  },
} as unknown as Warrior;

const baseActions = {
  handleInsight: vi.fn(),
  handleEquipFavoriteWeapon: vi.fn(),
  favDisplay: { weapon: 'Epee', weaponHint: '', rhythm: '', rhythmHint: '' },
  isWeaponDiscovered: true,
  weaponHints: 0,
  weaponProgress: 100,
} as never;

describe('WeaponAffinitySection', () => {
  it('shows the real weapon-style suitability label, not a fabricated bonus', () => {
    render(<WeaponAffinitySection warrior={baseWarrior} actions={baseActions} />);

    // epee suitability for AimedBlow resolves via getWeaponSuitability — the
    // label must come from WEAPON_SUITABILITY_LABELS, and the hardcoded
    // "+2 ACC / +1 DMG" chrome must be gone.
    expect(screen.queryByText(/\+2 ACC/)).not.toBeInTheDocument();
    expect(
      screen.getByText(/Can't Go Wrong|Well Suited|Marginal|Unorthodox/)
    ).toBeInTheDocument();
  });
});
