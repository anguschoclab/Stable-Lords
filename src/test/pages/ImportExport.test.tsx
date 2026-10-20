// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ImportExport from '@/pages/ImportExport';
import { useGameStore } from '@/state/useGameStore';
import { makeGameState } from '@/test/_fixtures/factories';
import { exportPack } from '@/lib/importExport';
import { toast } from 'sonner';

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

describe('ImportExport page (G2)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useGameStore.setState({ ...makeGameState() } as never);
  });

  it('renders export buttons and an import control', () => {
    render(<ImportExport />);
    expect(screen.getByRole('button', { name: /export json/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /export yaml/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /choose pack file/i })).toBeInTheDocument();
  });

  it('previews a validated pack and loads it only after confirmation', async () => {
    const loadGame = vi.fn();
    useGameStore.setState({ loadGame } as never);
    const state = makeGameState({ week: 42 });
    const packText = exportPack(state, 'json');

    render(<ImportExport />);
    const input = screen.getByLabelText(/choose save pack file/i);
    const file = new File([packText], 'pack.json', { type: 'application/json' });
    fireEvent.change(input, { target: { files: [file] } });

    expect(await screen.findByText(/Import preview/i)).toBeInTheDocument();
    expect(screen.getByText(/Week 42/i)).toBeInTheDocument();
    expect(loadGame).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /confirm import/i }));
    expect(loadGame).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ week: 42 })
    );
  });

  it('cancel discards the pending import without replacing the session', async () => {
    const loadGame = vi.fn();
    useGameStore.setState({ loadGame } as never);
    const state = makeGameState({ week: 42 });
    const packText = exportPack(state, 'json');

    render(<ImportExport />);
    fireEvent.change(screen.getByLabelText(/choose save pack file/i), {
      target: { files: [new File([packText], 'pack.json', { type: 'application/json' })] },
    });

    fireEvent.click(await screen.findByRole('button', { name: /cancel import/i }));
    expect(screen.queryByText(/Import preview/i)).not.toBeInTheDocument();
    expect(loadGame).not.toHaveBeenCalled();
  });

  it('surfaces malformed packs and never reaches the preview state', async () => {
    const loadGame = vi.fn();
    useGameStore.setState({ loadGame } as never);

    render(<ImportExport />);
    fireEvent.change(screen.getByLabelText(/choose save pack file/i), {
      target: { files: [new File(['not a pack'], 'bad.json', { type: 'application/json' })] },
    });

    await vi.waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(screen.queryByText(/Import preview/i)).not.toBeInTheDocument();
    expect(loadGame).not.toHaveBeenCalled();
  });
});
