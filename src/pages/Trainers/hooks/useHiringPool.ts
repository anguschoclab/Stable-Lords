import { useMemo, useCallback, useEffect } from 'react';
import { cryptoRandomInt } from '@/utils/cryptoRandom';
import { generateHiringPool } from '@/engine/trainers/trainers';
import { toast } from 'sonner';
import type { GameStore } from '@/state/store.types';
import type { Trainer } from '@/types/shared.types';

type SetState = GameStore['setState'];

/**
 * Hiring-pool lifecycle: seeds a fresh pool when empty (first visit each
 * week) and exposes a manual refresh.
 */
export function useHiringPool(hiringPool: Trainer[] | undefined, week: number, setState: SetState) {
  const currentHiringPool = useMemo(() => hiringPool ?? [], [hiringPool]);

  useEffect(() => {
    if (currentHiringPool.length === 0) {
      const pool = generateHiringPool(4, week * 1000 + cryptoRandomInt(0, 2147483647));
      setState((draft) => {
        draft.hiringPool = pool;
      });
    }
  }, [currentHiringPool.length, week, setState]);

  const refreshPool = useCallback(() => {
    const pool = generateHiringPool(4, week * 1000 + cryptoRandomInt(0, 2147483647));
    setState((draft) => {
      draft.hiringPool = pool;
    });
    toast.success('New trainers available.');
  }, [week, setState]);

  return { currentHiringPool, refreshPool };
}
