import { useCallback, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useGameStore } from '@/state/useGameStore';
import type { Owner } from '@/types/state.types';
import { toast } from 'sonner';
import {
  exportSessionState,
  importSaveFile,
  regenerateRivals,
  skipToSeasonEnd,
} from './adminActions';

/**
 *
 */
export type AdminCategory = 'SYSTEM' | 'ECONOMY' | 'WORLD' | 'TELEMETRY' | 'PREFERENCES';

/** State-mutating admin actions: FTUE bypass, rival regen, favorite mastery. */
function useAdminActions(setState: ReturnType<typeof useGameStore.getState>['setState']) {
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
    regenerateRivals(setState);
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

  return { skipFTUE, resetRivals, forceMastery };
}

/**
 *
 */
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
  } = useGameStore(
    useShallow((s) => ({
      setState: s.setState,
      doReset: s.doReset,
      doAdvanceWeek: s.doAdvanceWeek,
      loadGame: s.loadGame,
      treasury: s.treasury,
      fame: s.fame,
      week: s.week,
      season: s.season,
      roster: s.roster,
      player: s.player,
      ftueComplete: s.ftueComplete,
    }))
  );

  const [activeCategory, setActiveCategory] = useState<AdminCategory>('SYSTEM');

  const handleExport = useCallback(() => exportSessionState(week), [week]);

  const handleImport = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => importSaveFile(e, loadGame),
    [loadGame]
  );

  const skipWeek = useCallback(async () => {
    await doAdvanceWeek();
    toast.success(`Advanced 1 Week`);
  }, [doAdvanceWeek]);

  const skipSeason = useCallback(async () => {
    await skipToSeasonEnd();
  }, []);

  const { skipFTUE, resetRivals, forceMastery } = useAdminActions(setState);

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
