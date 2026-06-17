import { useCallback, useState } from 'react';
import { useGameStore, reconstructGameState } from '@/state/useGameStore';
import { cryptoRandomInt } from '@/utils/cryptoRandom';
import { computeNextSeason } from '@/engine/pipeline/passes/WorldPass';
import type { GameState, RivalStableData, Owner } from '@/types/state.types';
import { GameStateSchema } from '@/schemas/gameStateSchema';
import { toast } from 'sonner';
import { engineProxy } from '@/engine/workerProxy';

export type AdminCategory = 'SYSTEM' | 'ECONOMY' | 'WORLD' | 'TELEMETRY' | 'PREFERENCES';

export function useAdminTools() {
  const {
    setState,
    doReset,
    doAdvanceWeek,
    loadGame,
    treasury,
    fame,
    week,
    season,
    roster,
    player,
    ftueComplete,
  } = useGameStore();

  const [activeCategory, setActiveCategory] = useState<AdminCategory>('SYSTEM');

  const handleExport = useCallback(() => {
    const currentState = useGameStore.getState();
    const data = JSON.stringify({ state: currentState }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stable-lords-export-w${week}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Current session state exported.');
  }, [week]);

  const handleImport = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result;
          if (typeof content !== 'string') throw new Error('Invalid file content');
          const data = JSON.parse(content);
          if (data && data.state) {
            const validatedState = GameStateSchema.parse(data.state) as GameState;
            loadGame('autosave', validatedState);
            toast.success('Temporal state synchronization restored.');
          } else {
            toast.error('Invalid save signature detected.');
          }
        } catch (err) {
          if (err instanceof Error && err.name === 'ZodError') {
            toast.error('Invalid save data: schema validation failed');
            console.error('Zod validation error:', err);
          } else {
            toast.error(err instanceof Error ? err.message : 'Telemetry reconstruction failed.');
          }
        }
      };
      reader.readAsText(file);
    },
    [loadGame]
  );

  const skipWeek = useCallback(async () => {
    await doAdvanceWeek();
    toast.success(`Advanced 1 Week`);
  }, [doAdvanceWeek]);

  const skipSeason = useCallback(async () => {
    const store = useGameStore.getState();
    const currentState = reconstructGameState(store);
    try {
      const result = await engineProxy.skipToQuarterEnd(currentState);
      result.state.season = computeNextSeason(result.state.week);
      store.loadGame(store.activeSlotId || 'autosave', result.state);
      toast.success('Seasonal transition forced.');
    } catch (err) {
      console.error('Skip season failed:', err);
      toast.error('Seasonal transition failed.');
    }
  }, []);

  const skipFTUE = useCallback(() => {
    setState((draft) => {
      const defaultPlayer = {
        id: 'admin-0',
        name: 'Master Admin',
        stableName: 'The Admin Lords',
        fame: 0,
        renown: 0,
        titles: 0,
      };
      draft.ftueComplete = true;
      draft.isFTUE = false;
      draft.player = { ...defaultPlayer, ...(draft.player || {}) } as Owner;
    });
    toast.success('FTUE constraints bypassed.');
  }, [setState]);

  const resetRivals = useCallback(() => {
    import('@/engine/rivals').then(({ generateRivalStables }) => {
      const newRivals = generateRivalStables(
        23,
        cryptoRandomInt(0, 2147483647)
      ) as RivalStableData[];
      setState((draft) => {
        draft.rivals = newRivals;
      });
      toast.success('Rival ecosystem regenerated.');
    });
  }, [setState]);

  const forceMastery = useCallback(() => {
    setState((draft) => {
      draft.roster.forEach((w) => {
        if (w.favorites) {
          w.favorites.discovered = {
            weapon: true,
            rhythm: true,
            weaponHints: 10,
            rhythmHints: 10,
          };
        }
      });
    });
    toast.success('Omniscient mastery achieved.');
  }, [setState]);

  return {
    activeCategory,
    setActiveCategory,
    ftueComplete,
    handleExport,
    handleImport,
    skipWeek,
    skipSeason,
    skipFTUE,
    resetRivals,
    forceMastery,
    doReset,
    week,
    season,
    treasury,
    fame,
    roster,
    player,
  };
}
