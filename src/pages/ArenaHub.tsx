import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useGameStore, useWorldState } from '@/state/useGameStore';
import { buildMatchCard } from '@/components/run-round/buildMatchCard';
import { ArenaStatusStrip, FightCardPreview } from './arenaHub/sections';
import { CrowdMoodWidget } from './arenaHub/crowdMoodWidget';
import { ArenaLeaderboard } from './arenaHub/leaderboard';
import { CommandColumn, ConditionsColumn } from './arenaHub/columns';
import { useWeekExecution } from '@/hooks/useWeekExecution';
import { AutosimConsole } from '@/components/run-round/AutosimConsole';
import { PreAdvanceChecklist } from '@/components/widgets/PreAdvanceChecklist';
import { calculateStableStats } from '@/engine/stats/stableStats';
import { Badge } from '@/components/ui/badge';
import { Swords } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageFrame } from '@/components/ui/PageFrame';
import { SectionDivider } from '@/components/ui/SectionDivider';
import { useRegisterCtaAction } from '@/components/layout/useRegisterCtaAction';
import { isActive } from '@/engine/warrior/warriorStatus';

// ─── Main Hub Page ────────────────────────────────────────────────────────────

/**
 * Arena hub.
 */
export default function ArenaHub() {
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

  // Top-bar VIEW CARD CTA — scrolls to the fight card; disabled when no card exists.
  useRegisterCtaAction('/stable/arena', {
    enabled: matchCard.length > 0,
    run: () =>
      document.getElementById('fight-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
  });

  return (
    <PageFrame maxWidth="xl" className="pb-32">
      <HubHeader roster={roster} />

      {/* Band 2 — Crowd Mood full-width strip */}
      <CrowdMoodWidget />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-4">
        <CommandColumn />
        <ConditionsColumn
          renown={player.renown}
          lifetimeKills={lifetimeKills}
          winRate={stableStats.winRate}
        />
      </div>

      <SectionDivider label="Global Arena Rankings" variant="primary" />

      {/* Global Rankings Channel */}
      <ArenaLeaderboard />

      {/* Arena Status Strip */}
      <ArenaStatusStrip gameState={gameState} roster={roster} lifetimeKills={lifetimeKills} />

      {/* ── Fight Card Preview ── */}
      <FightCardPreview matchCard={matchCard} crowdMood={gameState.crowdMood} />

      {/* ── Pre-Advance Council Checklist ── */}
      <SectionDivider label="War Council Checklist" />
      <PreAdvanceChecklist />

      {/* ── Auto-Simulate Season ── */}
      <SectionDivider label="Auto-Simulate Season" />
      <AutosimConsole
        isSimulating={autosimming}
        progress={autosimProgress}
        result={autosimResult}
        handlers={{
          onStart: handleStartAutosim,
          onStop: stopAutosim,
          onReset: () => setAutosimResult(null),
        }}
      />
    </PageFrame>
  );
}

/** Hub page header with the active-warrior count badge. */
function HubHeader({ roster }: { roster: ReturnType<typeof useGameStore.getState>['roster'] }) {
  return (
    <PageHeader
      icon={Swords}
      eyebrow="Combat Operations"
      title="Arena"
      subtitle="ARENA · BOUTS · RANKINGS"
      actions={
        <div className="flex gap-3">
          <Badge
            variant="outline"
            className="bg-primary/5 text-primary border-primary/20 font-black uppercase tracking-widest text-[9px] px-3 py-1 rounded-none"
          >
            {roster.filter((w) => isActive(w)).length} WARRIORS ACTIVE
          </Badge>
        </div>
      }
    />
  );
}
