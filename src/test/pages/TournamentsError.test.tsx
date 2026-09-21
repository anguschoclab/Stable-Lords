// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, act } from '@testing-library/react';
import '@/test/_setup/setup';

const mockLoadGame = vi.fn();
const mockSetSimulating = vi.fn();

const store = {
  tournaments: [
    {
      id: 't1',
      season: 'Spring',
      completed: false,
      bracket: [],
      participants: [],
      name: 'Test Cup',
      week: 1,
      tierId: 'tier-1',
    },
  ],
  season: 'Spring',
  roster: [],
  week: 1,
  year: 1,
  arenaHistory: [],
  player: {
    id: 'p1',
    name: 'Player',
    stableName: "Dragon's Hearth",
    fame: 0,
    renown: 0,
    titles: 0,
  },
  activeSlotId: 'slot-1',
  loadGame: mockLoadGame,
  setSimulating: mockSetSimulating,
  bookmarks: [],
};

import { useGameStore, reconstructGameState } from '@/state/useGameStore';

vi.mock('@/engine/workerProxy', () => ({
  engineProxy: {
    resolveTournamentRound: vi.fn(),
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/lib/AudioManager', () => ({
  audioManager: { play: vi.fn() },
  AudioManager: { getInstance: vi.fn(), resetForTesting: vi.fn() },
}));

let capturedExecute: (() => void) | null = null;

vi.mock('@/components/tournaments', () => ({
  ActiveTournamentManifest: ({ onExecuteRound }: { onExecuteRound: () => void }) => {
    capturedExecute = onExecuteRound;
    return null;
  },
  TournamentHistory: () => null,
  TournamentPrepDialog: () => null,
  WarriorReadinessBanner: () => null,
}));

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
}));

vi.mock('@/utils/cryptoRandom', () => ({
  cryptoRandomInt: vi.fn().mockReturnValue(42),
}));

import Tournaments from '@/pages/Tournaments';
import { engineProxy } from '@/engine/workerProxy';
import { toast } from 'sonner';
import { audioManager } from '@/lib/AudioManager';

describe('Tournaments page — handleExecuteRound', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedExecute = null;
    // Inject fake state into the real store — vi.mock's importOriginal arg
    // does not exist under bun:test.
    useGameStore.setState(store as never);
  });

  it('posts toast.error and resets simulating when resolveTournamentRound rejects', async () => {
    vi.mocked(engineProxy.resolveTournamentRound).mockRejectedValue(new Error('boom'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<Tournaments />);
    expect(capturedExecute).not.toBeNull();

    await act(async () => {
      await capturedExecute!();
    });

    expect(toast.error).toHaveBeenCalledWith('Resolution failed.');
    expect(toast.success).not.toHaveBeenCalled();
    expect(mockLoadGame).not.toHaveBeenCalled();
    // setSimulating(true) on entry, setSimulating(false) in finally
    expect(mockSetSimulating.mock.calls).toEqual([[true], [false]]);
    expect(consoleSpy).toHaveBeenCalledWith(
      'Tournament resolution failed:',
      expect.any(Error)
    );
  });

  it('loads updated state and posts success toast on resolution', async () => {
    const updatedState = { week: 5 } as never;
    vi.mocked(engineProxy.resolveTournamentRound).mockResolvedValue({
      updatedState,
      roundResults: [{}],
    } as never);

    render(<Tournaments />);
    await act(async () => {
      await capturedExecute!();
    });

    expect(engineProxy.resolveTournamentRound).toHaveBeenCalledWith(
      reconstructGameState(useGameStore.getState()),
      't1',
      42
    );
    expect(mockLoadGame).toHaveBeenCalledWith('slot-1', updatedState);
    expect(audioManager.play).toHaveBeenCalledWith('clash');
    expect(toast.success).toHaveBeenCalledWith('Round resolved.');
    expect(mockSetSimulating.mock.calls).toEqual([[true], [false]]);
  });

  it('posts "Tournament complete." when no bouts remain', async () => {
    vi.mocked(engineProxy.resolveTournamentRound).mockResolvedValue({
      updatedState: { week: 5 },
      roundResults: [],
    } as never);

    render(<Tournaments />);
    await act(async () => {
      await capturedExecute!();
    });

    expect(toast.success).toHaveBeenCalledWith('Tournament complete.');
  });
});
