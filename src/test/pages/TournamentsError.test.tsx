// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, act } from '@testing-library/react';
import '@/test/_setup/setup';

const mockLoadGame = vi.fn();

const baseTournament = {
  id: 't1',
  season: 'Spring',
  completed: false,
  bracket: [],
  participants: [],
  name: 'Test Cup',
  week: 1,
  tierId: 'tier-1',
};

const store = {
  tournaments: [baseTournament],
  season: 'Spring',
  roster: [],
  week: 1,
  year: 1,
  day: 0,
  absoluteWeek: 1,
  isTournamentWeek: true,
  isSimulating: false,
  arenaHistory: [],
  newsletter: [],
  deferredBoutLogs: [],
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
  bookmarks: [],
};

import { useGameStore } from '@/state/useGameStore';

vi.mock('@/engine/runtime/workerProxy', () => ({
  engineProxy: {
    advanceDay: vi.fn(),
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

import Tournaments from '@/pages/Tournaments';
import { engineProxy } from '@/engine/runtime/workerProxy';
import { toast } from 'sonner';
import { audioManager } from '@/lib/AudioManager';

/** The state the canonical day-advance returns for the executed round. */
function resolvedState(over: Record<string, unknown> = {}) {
  return {
    ...store,
    day: 1,
    pendingResolutionData: undefined,
    lastWeekBoutDisplay: undefined,
    ...over,
  } as never;
}

describe('Tournaments page — handleExecuteRound', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedExecute = null;
    // Inject fake state into the real store — vi.mock's importOriginal arg
    // does not exist under bun:test. loadGame must actually apply the state
    // so the hook can read back the resolved tournament.
    mockLoadGame.mockImplementation((_slot: string, s: unknown) =>
      useGameStore.setState(s as never)
    );
    useGameStore.setState(store as never);
  });

  it('routes through the canonical day advance, never resolveTournamentRound', async () => {
    vi.mocked(engineProxy.advanceDay).mockResolvedValue(resolvedState());

    render(<Tournaments />);
    expect(capturedExecute).not.toBeNull();
    await act(async () => {
      await capturedExecute!();
    });

    expect(engineProxy.advanceDay).toHaveBeenCalled();
    expect(engineProxy.resolveTournamentRound).not.toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith('Round resolved.');
    expect(audioManager.play).toHaveBeenCalledWith('clash');
    expect(useGameStore.getState().isSimulating).toBe(false);
  });

  it('posts toast.error when the advance leaves the clock unmoved (worker failure)', async () => {
    vi.mocked(engineProxy.advanceDay).mockRejectedValue(new Error('boom'));
    vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<Tournaments />);
    await act(async () => {
      await capturedExecute!();
    });

    expect(toast.error).toHaveBeenCalledWith('Resolution failed.');
    expect(toast.success).not.toHaveBeenCalled();
    expect(mockLoadGame).not.toHaveBeenCalled();
    expect(useGameStore.getState().isSimulating).toBe(false);
  });

  it('posts "Tournament complete." when the round finishes the bracket', async () => {
    vi.mocked(engineProxy.advanceDay).mockResolvedValue(
      resolvedState({ tournaments: [{ ...baseTournament, completed: true }] })
    );

    render(<Tournaments />);
    await act(async () => {
      await capturedExecute!();
    });

    expect(toast.success).toHaveBeenCalledWith('Tournament complete.');
  });
});
