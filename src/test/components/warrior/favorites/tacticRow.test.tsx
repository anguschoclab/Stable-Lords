// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FavoritesCharting } from '@/components/warrior/favorites';
import { makeWarrior } from '@/test/_fixtures/factories';
import type { WarriorFavorites } from '@/types/warrior.types';

/**
 * V29-D1 (V26-D1): a discovered favorite tactic is never surfaced.
 *
 * `warrior.favorites.tactic` + `favorites.discovered.tactic` exist in state
 * (V26 wired the discovery channel), but no favorites-section row renders
 * the revealed tactic — the discovery is invisible to the player.
 */
function warriorWithDiscoveredTactic(tactic: string) {
  const favorites: WarriorFavorites = {
    weaponId: 'Broadsword',
    rhythm: { oe: 6, al: 4 },
    tactic,
    discovered: { weapon: true, rhythm: true, weaponHints: 3, rhythmHints: 3, tactic: true },
  };
  return makeWarrior({ status: 'Active', favorites });
}

describe('V29-D1: discovered favorite tactic surfaces in favorites charting', () => {
  it('renders a tactic row once the tactic is discovered', () => {
    render(<FavoritesCharting warriors={[warriorWithDiscoveredTactic('Decisive')]} />);
    expect(screen.getByText(/tactic/i)).toBeInTheDocument();
    expect(screen.getByText(/Decisive/)).toBeInTheDocument();
  });
});
