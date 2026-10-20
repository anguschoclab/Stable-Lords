import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useGameStore, useWorldState } from '@/state/useGameStore';
import { buildMatchCard } from '@/components/run-round/buildMatchCard';
import { calculateStableStats } from '@/engine/stats/stableStats';
import { useWeekExecution } from '@/hooks/useWeekExecution';

/** Arena-hub derived state: roster slice, match card, stats, autosim. */
export function useArenaHubData() {
  const { roster, player } = useGameStore(
    useShallow((s) => ({ roster: s.roster, player: s.player }))
  );
  const gameState = useWorldState();

  const matchCard = useMemo(() => buildMatchCard(gameState), [gameState]);

  const {
    handleStartAutosim,
    stopAutosim,
    autosimming,
    autosimProgress,
    autosimResult,
    setAutosimResult,
  } = useWeekExecution();

  const lifetimeKills = useMemo(
    () => roster.reduce((s, w) => s + (w.career?.kills || 0), 0),
    [roster]
  );
  const stableStats = useMemo(() => calculateStableStats(roster), [roster]);

  return {
    roster,
    player,
    gameState,
    matchCard,
    lifetimeKills,
    stableStats,
    autosim: {
      handleStartAutosim,
      stopAutosim,
      autosimming,
      autosimProgress,
      autosimResult,
      setAutosimResult,
    },
  };
}
