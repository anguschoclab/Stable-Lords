// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import '@/test/_setup/setup';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import type { GameState } from '@/types/state.types';

// loadGame() calls archiveService.archiveHotState — keep it inert
vi.mock('@/engine/storage/archiveService', () => ({
  archiveService: {
    archiveHotState: vi.fn(),
    retrieveHotState: vi.fn(),
    deleteHotState: vi.fn(),
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/engine/workerProxy', () => ({
  engineProxy: {
    skipToQuarterEnd: vi.fn(),
  },
}));

// resetRivals dynamically imports this module
vi.mock('@/engine/rivals', () => ({
  generateRivalStables: vi.fn(() => [{ id: 'rival-1' }]),
}));

import { useAdminTools } from '@/pages/AdminTools/hooks/useAdminTools';
import { useGameStore } from '@/state/useGameStore';
import { toast } from 'sonner';
import { engineProxy } from '@/engine/workerProxy';
import { generateRivalStables } from '@/engine/rivals';
import { GameStateSchema } from '@/schemas/gameStateSchema';

const seedStore = () => {
  useGameStore
    .getState()
    .loadGame('test-slot', createFreshState('test-seed') as GameState);
  useGameStore.setState({ atTitleScreen: false, isInitialized: true });
};

const mockFileReader = (result: string | null, opts: { error?: boolean } = {}) => {
  window.FileReader = vi.fn().mockImplementation(function () {
    return {
      // `function` (not arrow) so `this` binds to the reader instance the hook
      // assigns onload/onerror to — same pattern as StartGame.test.tsx.
      readAsText: vi.fn().mockImplementation(function (this: any, _file: Blob) {
        if (opts.error) {
          this.onerror?.(new Error('read failed'));
        } else if (this.onload) {
          this.onload({ target: { result } });
        }
      }),
      onload: null,
      onerror: null,
    };
  }) as any;
};

describe('useAdminTools', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Control GameStateSchema.parse for the import paths while keeping every
    // other schema method real — the store does not import this module, so
    // this cannot affect store internals. (spyOn works on both runners;
    // vi.mock's importOriginal arg does not exist under bun:test.)
    vi.spyOn(GameStateSchema, 'parse').mockImplementation((data: unknown) => data as never);
    seedStore();
  });

  it('defaults activeCategory to SYSTEM and updates via setActiveCategory', () => {
    const { result } = renderHook(() => useAdminTools());
    expect(result.current.activeCategory).toBe('SYSTEM');

    act(() => result.current.setActiveCategory('ECONOMY'));
    expect(result.current.activeCategory).toBe('ECONOMY');
  });

  it('skipWeek advances one week and posts a success toast', async () => {
    const doAdvanceWeek = vi.fn().mockResolvedValue(undefined);
    useGameStore.setState({ doAdvanceWeek } as never);

    const { result } = renderHook(() => useAdminTools());
    await act(async () => {
      await result.current.skipWeek();
    });

    expect(doAdvanceWeek).toHaveBeenCalledOnce();
    expect(toast.success).toHaveBeenCalledWith('Advanced 1 Week');
  });

  it('skipSeason loads the transitioned state and posts success', async () => {
    const loadGame = vi.fn();
    useGameStore.setState({ loadGame } as never);
    const nextState = { ...createFreshState('test-seed'), week: 13 } as GameState;
    vi.mocked(engineProxy.skipToQuarterEnd).mockResolvedValue({ state: nextState } as never);

    const { result } = renderHook(() => useAdminTools());
    await act(async () => {
      await result.current.skipSeason();
    });

    expect(engineProxy.skipToQuarterEnd).toHaveBeenCalledOnce();
    // WorldPass already computes the season inside the engine — the caller
    // must NOT post-hoc overwrite it.
    expect(loadGame).toHaveBeenCalledWith(
      'test-slot',
      expect.objectContaining({ week: 13 })
    );
    expect(toast.success).toHaveBeenCalledWith('Seasonal transition forced.');
    expect(useGameStore.getState().isSimulating).toBe(false);
  });

  it('skipSeason is blocked while a simulation is in progress', async () => {
    const loadGame = vi.fn();
    useGameStore.setState({ loadGame, isSimulating: true } as never);

    const { result } = renderHook(() => useAdminTools());
    await act(async () => {
      await result.current.skipSeason();
    });

    expect(engineProxy.skipToQuarterEnd).not.toHaveBeenCalled();
    expect(loadGame).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith('Simulation already in progress.');
    useGameStore.setState({ isSimulating: false } as never);
  });

  it('skipSeason posts an error toast when the engine call fails', async () => {
    const loadGame = vi.fn();
    useGameStore.setState({ loadGame } as never);
    vi.mocked(engineProxy.skipToQuarterEnd).mockRejectedValue(new Error('engine down'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => useAdminTools());
    await act(async () => {
      await result.current.skipSeason();
    });

    expect(loadGame).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith('Seasonal transition failed.');
    expect(consoleSpy).toHaveBeenCalledWith('Skip season failed:', expect.any(Error));
  });

  it('skipFTUE marks the FTUE complete and preserves the seeded player', () => {
    const playerBefore = useGameStore.getState().player;

    const { result } = renderHook(() => useAdminTools());
    act(() => {
      result.current.skipFTUE();
    });

    const state = useGameStore.getState();
    expect(state.ftueComplete).toBe(true);
    expect(state.isFTUE).toBe(false);
    // Existing player fields win over the admin defaults
    expect(state.player.name).toBe(playerBefore.name);
    expect(toast.success).toHaveBeenCalledWith('FTUE constraints bypassed.');
  });

  it('resetRivals regenerates the rival ecosystem', async () => {
    const { result } = renderHook(() => useAdminTools());
    await act(async () => {
      result.current.resetRivals();
      await vi.dynamicImportSettled();
    });

    expect(generateRivalStables).toHaveBeenCalledWith(23, expect.any(Number));
    expect(useGameStore.getState().rivals).toEqual([{ id: 'rival-1' }]);
    expect(toast.success).toHaveBeenCalledWith('Rival ecosystem regenerated.');
  });

  it('forceMastery reveals favorites for warriors that have them', () => {
    useGameStore.setState({
      roster: [{ id: 'w1', favorites: {} }, { id: 'w2' }],
    } as never);

    const { result } = renderHook(() => useAdminTools());
    act(() => {
      result.current.forceMastery();
    });

    const roster = useGameStore.getState().roster as any[];
    expect(roster[0].favorites.discovered).toEqual({
      weapon: true,
      rhythm: true,
      weaponHints: 10,
      rhythmHints: 10,
    });
    expect(roster[1].favorites).toBeUndefined();
    expect(toast.success).toHaveBeenCalledWith('Omniscient mastery achieved.');
  });

  describe('handleExport', () => {
    it('creates a blob URL, triggers a download, and posts success', () => {
      const createObjectURL = vi.fn(() => 'blob:mock');
      const revokeObjectURL = vi.fn();
      (URL as any).createObjectURL = createObjectURL;
      (URL as any).revokeObjectURL = revokeObjectURL;
      let anchor: HTMLAnchorElement | undefined;
      const clickSpy = vi
        .spyOn(HTMLAnchorElement.prototype, 'click')
        .mockImplementation(function (this: HTMLAnchorElement) {
          // bun:test's spy does not populate mock.instances — capture `this`.
          // eslint-disable-next-line @typescript-eslint/no-this-alias
          anchor = this;
        });

      const { result } = renderHook(() => useAdminTools());
      act(() => {
        result.current.handleExport();
      });

      expect(createObjectURL).toHaveBeenCalledOnce();
      expect(clickSpy).toHaveBeenCalledOnce();
      expect(anchor?.download).toBe(`stable-lords-export-w${result.current.week}.json`);
      expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock');
      expect(toast.success).toHaveBeenCalledWith('Current session state exported.');
    });
  });

  describe('handleImport', () => {
    const fireImport = (result: { current: ReturnType<typeof useAdminTools> }) => {
      const file = new File(['x'], 'save.json', { type: 'application/json' });
      act(() => {
        result.current.handleImport({
          target: { files: [file] },
        } as unknown as React.ChangeEvent<HTMLInputElement>);
      });
    };

    it('loads a valid save and posts success', () => {
      const loadGame = vi.fn();
      useGameStore.setState({ loadGame } as never);
      const fresh = createFreshState('test-seed');
      mockFileReader(JSON.stringify({ state: fresh }));

      const { result } = renderHook(() => useAdminTools());
      fireImport(result);

      expect(GameStateSchema.parse).toHaveBeenCalled();
      expect(loadGame).toHaveBeenCalledWith('autosave', fresh);
      expect(toast.success).toHaveBeenCalledWith('Save loaded successfully.');
    });

    it('posts an error toast for malformed JSON', () => {
      mockFileReader('not-json{{{');
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => useAdminTools());
      fireImport(result);

      expect(toast.error).toHaveBeenCalled();
      expect(toast.success).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('posts "Invalid save file." when the payload has no state field', () => {
      mockFileReader(JSON.stringify({ foo: 'bar' }));

      const { result } = renderHook(() => useAdminTools());
      fireImport(result);

      expect(toast.error).toHaveBeenCalledWith('Invalid save file.');
    });

    it('posts the schema-validation message when parse throws ZodError', () => {
      vi.mocked(GameStateSchema.parse).mockImplementation(() => {
        throw Object.assign(new Error('bad state'), { name: 'ZodError' });
      });
      mockFileReader(JSON.stringify({ state: { week: 1 } }));
      vi.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => useAdminTools());
      fireImport(result);

      expect(toast.error).toHaveBeenCalledWith(
        'Invalid save data: schema validation failed'
      );
    });

    it('does nothing when no file is selected', () => {
      const { result } = renderHook(() => useAdminTools());
      act(() => {
        result.current.handleImport({
          target: { files: [] },
        } as unknown as React.ChangeEvent<HTMLInputElement>);
      });

      expect(toast.error).not.toHaveBeenCalled();
      expect(toast.success).not.toHaveBeenCalled();
    });

    // Regression for latent bug: reader.onerror is never assigned in
    // useAdminTools.handleImport, so file-read failures are silent.
    it('posts an error toast when the file read itself fails', () => {
      mockFileReader(null, { error: true });

      const { result } = renderHook(() => useAdminTools());
      fireImport(result);

      expect(toast.error).toHaveBeenCalledWith('Failed to read save file.');
    });
  });
});
