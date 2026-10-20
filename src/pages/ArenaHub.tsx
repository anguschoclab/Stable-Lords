import { ArenaStatusStrip, FightCardPreview } from './arenaHub/sections';
import { CrowdMoodWidget } from './arenaHub/crowdMoodWidget';
import { ArenaLeaderboard } from './arenaHub/leaderboard';
import { CommandColumn, ConditionsColumn } from './arenaHub/columns';
import { HubHeader } from './arenaHub/HubHeader';
import { useArenaHubData } from './arenaHub/useArenaHubData';
import { AutosimConsole } from '@/components/run-round/AutosimConsole';
import { PreAdvanceChecklist } from '@/components/widgets/PreAdvanceChecklist';
import { PageFrame } from '@/components/ui/PageFrame';
import { SectionDivider } from '@/components/ui/SectionDivider';
import { useRegisterCtaAction } from '@/components/layout/useRegisterCtaAction';

// ─── Main Hub Page ────────────────────────────────────────────────────────────

/**
 * Arena hub.
 */
export default function ArenaHub() {
  const { roster, player, gameState, matchCard, lifetimeKills, stableStats, autosim } =
    useArenaHubData();

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
        isSimulating={autosim.autosimming}
        progress={autosim.autosimProgress}
        result={autosim.autosimResult}
        handlers={{
          onStart: autosim.handleStartAutosim,
          onStop: autosim.stopAutosim,
          onReset: () => autosim.setAutosimResult(null),
        }}
      />
    </PageFrame>
  );
}
