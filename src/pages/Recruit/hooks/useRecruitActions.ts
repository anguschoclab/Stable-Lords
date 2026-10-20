import { useState, useCallback } from 'react';
import { type GameStore } from '@/state/useGameStore';
import {
  type PoolWarrior,
} from '@/engine/recruitment/recruitment';
import {
  revealRecruitPotential,
  type PotentialScoutReport,
} from '@/engine/recruitment/recruitScouting';
import type { FightingStyle, Attributes } from '@/types/game';
import type { LedgerEntry } from '@/types/state.types';
import { toast } from 'sonner';
import {
  recruitFromPool,
} from './recruitActions/recruitSigning';
import {
  customCreate,
  refreshPool,
} from './recruitActions/recruitPoolOps';

const SCOUT_COST = 25;

interface UseRecruitActionsParams {
  rosterFull: boolean;
  setState: (fn: (draft: GameStore) => void) => void;
  deductFunds: (amount: number, label: string, category: LedgerEntry['category']) => boolean;
  week: number;
  navigate: (opts: { to: string }) => void;
}

/** Charge `amount` through deductFunds, toasting `failMsg` when declined. */
function chargeOrToast(
  deductFunds: UseRecruitActionsParams['deductFunds'],
  amount: number,
  label: string,
  category: LedgerEntry['category'],
  failMsg: string
): boolean {
  if (deductFunds(amount, label, category)) return true;
  toast.error(failMsg);
  return false;
}

/**
 *
 */
export function useRecruitActions({
  rosterFull,
  setState,
  deductFunds,
  week,
  navigate,
}: UseRecruitActionsParams) {
  const [scoutedIds, setScoutedIds] = useState<Set<string>>(new Set());
  const [scoutReports, setScoutReports] = useState<Record<string, PotentialScoutReport>>({});

  const handleRecruit = useCallback(
    (w: PoolWarrior, bonus: boolean = false) =>
      recruitFromPool({ rosterFull, setState, deductFunds }, w, bonus),
    [rosterFull, setState, deductFunds]
  );

  const handleScout = useCallback(
    (w: PoolWarrior) => {
      if (
        !chargeOrToast(
          deductFunds,
          SCOUT_COST,
          `Scout Potential: ${w.name}`,
          'other',
          'Not enough gold to scout potential (need 25g).'
        )
      )
        return;
      setScoutedIds((s) => new Set(s).add(w.id));
      const report = revealRecruitPotential(w.id, week, w.potential);
      setScoutReports((prev) => ({ ...prev, [w.id]: report }));
      toast.success(`Scouted potential for ${w.name}! (-25g)`);
    },
    [deductFunds, week]
  );

  const handleRefresh = useCallback(
    () => refreshPool({ setState, deductFunds }),
    [deductFunds, setState]
  );

  const handleCustomCreate = useCallback(
    (data: { name: string; style: FightingStyle; attributes: Attributes; avatarSeed?: number }) =>
      customCreate({ rosterFull, setState, deductFunds, navigate }, data),
    [setState, navigate, rosterFull, deductFunds]
  );

  return {
    scoutedIds,
    scoutReports,
    handleRecruit,
    handleScout,
    handleRefresh,
    handleCustomCreate,
  };
}
