import { useShallow } from 'zustand/react/shallow';
import { useNavigate } from '@tanstack/react-router';
import { useGameStore } from '@/state/useGameStore';
import { filterActive } from '@/utils/roster';
import { BASE_ROSTER_CAP } from '@/constants/economy/roster';
import { REFRESH_COST } from '@/engine/recruitment/recruitment';
import { canTransact } from '@/engine/economy/utils';
import { useRecruitFilters } from './useRecruitFilters';
import { useRecruitActions } from './useRecruitActions';

/**
 *
 */
export function useRecruit() {
  const { roster, treasury, rosterBonus, recruitPool, freeAgents, setState, deductFunds, week } =
    useGameStore(
      useShallow((s) => ({
        roster: s.roster,
        treasury: s.treasury,
        rosterBonus: s.rosterBonus,
        recruitPool: s.recruitPool,
        freeAgents: s.freeAgents,
        setState: s.setState,
        deductFunds: s.deductFunds,
        week: s.week,
      }))
    );
  const navigate = useNavigate();
  const MAX_ROSTER = BASE_ROSTER_CAP + (rosterBonus ?? 0);
  // Capacity counts active warriors only — the signWarrior funnel and the
  // roster-cap-exceeded invariant both ignore dead/retired roster entries.
  const activeRosterSize = filterActive(roster).length;
  const rosterFull = activeRosterSize >= MAX_ROSTER;
  const canRefresh = canTransact(treasury, REFRESH_COST);

  // One market: free-agent veterans and orphanage recruits share the list.
  const combinedPool = [...(freeAgents ?? []), ...(recruitPool ?? [])].filter(
    (w, i, all) => all.findIndex((x) => x.id === w.id) === i
  );

  const filters = useRecruitFilters(combinedPool, week);
  const actions = useRecruitActions({
    rosterFull,
    setState,
    deductFunds,
    week,
    navigate,
  });

  return {
    roster,
    activeRosterSize,
    treasury,
    MAX_ROSTER,
    rosterFull,
    canRefresh,
    recruitPool: combinedPool,
    ...filters,
    ...actions,
  };
}
