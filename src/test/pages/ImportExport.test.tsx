// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ImportExport from '@/pages/ImportExport';
import { useGameStore } from '@/state/useGameStore';
import { makeGameState } from '@/test/_fixtures/factories';
import { exportPack } from '@/lib/importExport';

describe('ImportExport page (G2)', () => {
  beforeEach(() => {
    useGameStore.setState({ ...makeGameState() } as never);
  });

  it('renders export buttons and an import control', () => {
    render(<ImportExport />);
    expect(screen.getByRole('button', { name: /export json/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /export yaml/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /choose pack file/i })).toBeInTheDocument();
  });

  it('import loads a validated pack into the store', async () => {
    const loadGame = vi.fn();
    useGameStore.setState({ loadGame } as never);
    const state = makeGameState({ week: 42 });
    const packText = exportPack(state, 'json');

    render(<ImportExport />);
    const input = screen.getByLabelText(/choose save pack file/i);
    const file = new File([packText], 'pack.json', { type: 'application/json' });
    fireEvent.change(input, { target: { files: [file] } });
    await vi.waitFor(() => expect(loadGame).toHaveBeenCalled());
    expect(loadGame.mock.calls[0]?.[1].week).toBe(42);
  });
});
