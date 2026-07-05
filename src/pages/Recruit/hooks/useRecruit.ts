import { useShallow } from 'zustand/react/shallow';
import { useNavigate } from '@tanstack/react-router';
import { useGameStore } from '@/state/useGameStore';
import { BASE_ROSTER_CAP } from '@/constants/economy/roster';
import { REFRESH_COST } from '@/engine/recruitment';
import { canTransact } from '@/engine/economy/utils';
import { useRecruitFilters } from './useRecruitFilters';
import { useRecruitActions } from './useRecruitActions';

export function useRecruit() {
  const { roster, treasury, rosterBonus, recruitPool, setState, deductFunds, week } = useGameStore(
    useShallow((s) => ({
      roster: s.roster,
      treasury: s.treasury,
      rosterBonus: s.rosterBonus,
      recruitPool: s.recruitPool,
      setState: s.setState,
      deductFunds: s.deductFunds,
      week: s.week,
    }))
  );
  const navigate = useNavigate();
  const MAX_ROSTER = BASE_ROSTER_CAP + (rosterBonus ?? 0);
  const rosterFull = roster.length >= MAX_ROSTER;
  const canRefresh = canTransact(treasury, REFRESH_COST);

  const filters = useRecruitFilters(recruitPool);
  const actions = useRecruitActions({
    rosterFull,
    setState,
    deductFunds,
    week,
    navigate,
  });

  return {
    roster,
    treasury,
    MAX_ROSTER,
    rosterFull,
    canRefresh,
    recruitPool,
    ...filters,
    ...actions,
  };
}
