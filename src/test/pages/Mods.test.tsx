// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Mods from '@/pages/Mods';
import { useGameStore } from '@/state/useGameStore';
import { makeGameState } from '@/test/_fixtures/factories';

describe('Mods page (G1/G7)', () => {
  beforeEach(() => {
    useGameStore.setState({ ...makeGameState() } as never);
  });

  it('renders canonical defaults without a warning banner', () => {
    render(<Mods />);
    expect(screen.getByRole('button', { name: /canonical \(full rate\)/i })).toBeInTheDocument();
    expect(screen.queryByText(/house rules active/i)).not.toBeInTheDocument();
  });

  it('labels the game as non-canonical once a rule is weakened', () => {
    render(<Mods />);
    fireEvent.click(screen.getByRole('button', { name: /no-death exhibitions/i }));
    expect(useGameStore.getState().houseRules?.deathRateMult).toBe(0);
    expect(screen.getByText(/house rules active/i)).toBeInTheDocument();
  });

  it('toggles severe-injury-instead-of-death', () => {
    render(<Mods />);
    fireEvent.click(screen.getByRole('button', { name: /^disabled$/i }));
    expect(useGameStore.getState().houseRules?.severeInjuryInsteadOfDeath).toBe(true);
  });

  it('installs a valid content pack and lists it', async () => {
    const setSpy = vi.spyOn(useGameStore.getState(), 'setState');
    render(<Mods />);
    const input = screen.getByLabelText(/choose content pack file/i);
    const pack = JSON.stringify({
      id: 'p1',
      name: 'Lore Pack',
      arenaLore: [
        {
          id: 'x',
          arenaId: 'a',
          type: 'hazard',
          title: 'T',
          narrative: 'N',
        },
      ],
    });
    fireEvent.change(input, {
      target: { files: [new File([pack], 'p.json', { type: 'application/json' })] },
    });
    await vi.waitFor(() => expect(setSpy).toHaveBeenCalled());
    expect(useGameStore.getState().contentPacks?.[0]?.name).toBe('Lore Pack');
  });
});
