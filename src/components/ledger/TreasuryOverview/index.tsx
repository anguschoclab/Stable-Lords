import { useMemo } from 'react';
import { useGameStore } from '@/state/useGameStore';
import { useShallow } from 'zustand/react/shallow';
import { computeWeeklyBreakdown } from '@/engine/economy';
import { TreasurySparkline } from '@/components/charts/TreasurySparkline';
import { isActive } from '@/engine/warrior/warriorStatus';
import { GlobalTreasuryMatrix } from './matrix';
import { FiscalTrajectoryMonitor } from './trajectory';
import { LedgerRegistry } from './registry';

/**
 * Treasury overview.
 */
export function TreasuryOverview() {
  const state = useGameStore(
    useShallow((s) => ({
      week: s.week,
      roster: s.roster,
      fame: s.fame,
      weather: s.weather,
      arenaHistory: s.arenaHistory,
      trainers: s.trainers,
      trainingAssignments: s.trainingAssignments,
      treasury: s.treasury,
      ledger: s.ledger,
    }))
  );
  const breakdown = useMemo(() => computeWeeklyBreakdown({ ...state, isPlayer: true }), [state]);
  const gold = state.treasury ?? 0;

  // ⚡ Bolt: Use a single O(N) pass inside useMemo to avoid recomputing on every render
  const { activeWarriorsCount, totalWins, totalKills } = useMemo(() => {
    let wins = 0;
    let kills = 0;
    let active = 0;
    const roster = state.roster ?? [];
    for (let i = 0; i < roster.length; i++) {
      const w = roster[i];
      if (w) {
        wins += w.career.wins ?? 0;
        kills += w.career.kills ?? 0;
        if (isActive(w)) active++;
      }
    }
    return { activeWarriorsCount: active, totalWins: wins, totalKills: kills };
  }, [state.roster]);

  const recentLedger = (state.ledger ?? []).slice(-15).reverse();
  const totalLedgerEntries = state.ledger?.length ?? 0;

  return (
    <div className="space-y-8 animate-in motion-reduce:animate-none fade-in slide-in-from-bottom-4 duration-500">
      {/* ─── Treasury Trend Sparkline ─── */}
      <TreasurySparkline height={52} />

      {/* ─── Global Treasury Matrix ─── */}
      <GlobalTreasuryMatrix
        gold={gold}
        activeWarriorsCount={activeWarriorsCount}
        totalWins={totalWins}
        totalKills={totalKills}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* ─── Fiscal Trajectory Monitor ─── */}
        <FiscalTrajectoryMonitor breakdown={breakdown} week={state.week} />

        {/* ─── High-Fidelity Ledger Chronicle ─── */}
        <LedgerRegistry recentLedger={recentLedger} totalLedgerEntries={totalLedgerEntries} />
      </div>
    </div>
  );
}
