import { useMemo } from 'react';
import { Link } from '@tanstack/react-router';
import { useShallow } from 'zustand/react/shallow';
import { useGameStore, useWorldState } from '@/state/useGameStore';
import { buildMatchCard } from '@/components/run-round/buildMatchCard';
import { ArenaAnalyticsSurface, ArenaStatusStrip, FightCardPreview } from './arenaHub/sections';
import { useWeekExecution } from '@/hooks/useWeekExecution';
import { calculateGlobalFameLeaderboard } from '@/engine/core/leaderboards';
import { championsHeldByStable } from '@/engine/championship/arenaChampionship';
import { AutosimConsole } from '@/components/run-round/AutosimConsole';
import { PreAdvanceChecklist } from '@/components/widgets/PreAdvanceChecklist';
import { calculateStableStats } from '@/engine/stats/stableStats';
import {
  MOOD_DESCRIPTIONS,
  MOOD_ICONS,
  getMoodModifiers,
  type CrowdMood,
} from '@/engine/bout/crowdMood';
import { Badge } from '@/components/ui/badge';
import { WarriorNameTag } from '@/components/ui/WarriorBadges';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Trophy, Swords, Eye, Activity } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Surface } from '@/components/ui/Surface';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageFrame } from '@/components/ui/PageFrame';
import { SectionDivider } from '@/components/ui/SectionDivider';
import { useRegisterCtaAction } from '@/components/layout/useRegisterCtaAction';

// Unified Widgets
import { MedicalAuditWidget } from '@/components/dashboard/MedicalAuditWidget';
import { IntelligenceHubWidget } from '@/components/dashboard/IntelligenceHubWidget';
import { NextBoutWidget } from '@/components/widgets/NextBoutWidget';
import { MetaDriftWidget } from '@/components/widgets/MetaDriftWidget';
import { WeatherWidget } from '@/components/widgets/WeatherWidget';
import { isActive } from '@/engine/warrior/warriorStatus';

// ─── Crowd Mood Meter ──────────────────────────────────────────────────────

function CrowdMoodWidget() {
  const crowdMood = useGameStore((s) => s.crowdMood);
  const mood = crowdMood as CrowdMood;
  const mods = getMoodModifiers(mood);

  return (
    <Surface
      variant="glass"
      className="flex items-center gap-8 p-5 border-l-4 border-l-accent/50 animate-in fade-in zoom-in-95 duration-500 motion-reduce:animate-none"
    >
      <div className="flex items-center gap-4 shrink-0">
        <span className="text-4xl drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
          {MOOD_ICONS[mood]}
        </span>
        <div>
          <div className="flex items-center gap-2">
            <Eye className="h-3 w-3 text-accent" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/80">
              Crowd Temperament
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground italic leading-tight max-w-[200px] mt-1">
            {MOOD_DESCRIPTIONS[mood]}
          </p>
        </div>
      </div>

      <div className="h-10 w-px bg-white/5 shrink-0" />

      <div className="flex items-center gap-6 overflow-x-auto thin-scrollbar">
        <MoodStat
          label="Fame Mult"
          value={`×${mods.fameMultiplier.toFixed(1)}`}
          highlight={mods.fameMultiplier > 1 ? 'text-primary' : 'text-muted-foreground'}
          tooltip="Multiplies all fame gains from this week's bouts."
        />
        <MoodStat
          label="Lethality"
          value={`${mods.killChanceBonus > 0 ? '+' : ''}${(mods.killChanceBonus * 100).toFixed(0)}%`}
          highlight={mods.killChanceBonus > 0 ? 'text-destructive' : 'text-muted-foreground'}
          tooltip="Probability bonus added to all fatal blow checks."
        />
      </div>

      <Badge
        variant="outline"
        className="ml-auto border-accent/40 bg-accent/5 text-accent text-[9px] font-black tracking-widest shrink-0"
      >
        {mood.toUpperCase()}
      </Badge>
    </Surface>
  );
}

/** One mood-modifier stat tile with explanatory tooltip. */
function MoodStat({
  label,
  value,
  highlight,
  tooltip,
}: {
  label: string;
  value: string;
  highlight: string;
  tooltip: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-3 px-4 py-2 bg-white/[0.02] border border-white/5 transition-all hover:bg-white/[0.05] motion-reduce:transition-none">
          <div className="text-right">
            <div className="text-[8px] text-muted-foreground uppercase font-black tracking-widest leading-none mb-1">
              {label}
            </div>
            <div className={cn('text-lg font-display font-black tracking-tighter leading-none', highlight)}>
              {value}
            </div>
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent className="text-[10px] uppercase font-black tracking-widest">
        {tooltip}
      </TooltipContent>
    </Tooltip>
  );
}

// ─── Arena Leaderboard ────────────────────────────────────────────────────

/** Rankings table header. */
function LeaderboardHead() {
  return (
    <TableHeader className="bg-white/[0.03]">
      <TableRow className="h-10 hover:bg-transparent border-white/5">
        <TableHead className="w-12 pl-6 text-[9px] font-black uppercase tracking-widest">
          RANK
        </TableHead>
        <TableHead className="text-[9px] font-black uppercase tracking-widest">
          WARRIOR
        </TableHead>
        <TableHead className="text-[9px] font-black uppercase tracking-widest">
          STABLE
        </TableHead>
        <TableHead className="text-center text-[9px] font-black uppercase tracking-widest">
          W / L / K
        </TableHead>
        <TableHead className="pr-6 text-right text-[9px] font-black uppercase tracking-widest">
          FAME
        </TableHead>
      </TableRow>
    </TableHeader>
  );
}

/** One leaderboard row. */
function LeaderboardRow({
  entry,
  rank,
  championIds,
}: {
  entry: { warrior: { id: string; name: string; epithet?: string; career: { wins: number; losses: number; kills: number }; fame: number }; isPlayer: boolean; stableName: string };
  rank: number;
  championIds: Set<string>;
}) {
  const w = entry.warrior;
  return (
    <TableRow
      className={cn(
        'h-12 border-white/5 transition-colors motion-reduce:transition-none',
        entry.isPlayer
          ? 'bg-primary/[0.03] border-l-2 border-l-primary'
          : 'hover:bg-white/[0.02]'
      )}
    >
      <TableCell className="pl-6 font-mono text-[10px] font-black text-muted-foreground">
        {String(rank).padStart(2, '0')}
      </TableCell>
      <TableCell>
        <WarriorNameTag
          id={w.id}
          name={w.name}
          epithet={w.epithet}
          isChampion={championIds.has(w.id)}
        />
      </TableCell>
      <TableCell className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 italic">
        {entry.stableName}
      </TableCell>
      <TableCell className="text-center font-mono text-[10px]">
        <span className="text-primary font-bold">{w.career.wins}</span>
        <span className="mx-1 opacity-20">/</span>
        <span className="text-destructive font-bold">{w.career.losses}</span>
        <span className="mx-1 opacity-20">/</span>
        <span className="text-arena-blood font-black">{w.career.kills}</span>
      </TableCell>
      <TableCell className="pr-6 text-right">
        <span className="font-display font-black text-arena-fame text-lg tracking-tighter">
          {w.fame}
        </span>
      </TableCell>
    </TableRow>
  );
}

function ArenaLeaderboard() {
  const { roster, rivals, player, arenaChampions } = useGameStore(
    useShallow((s) => ({
      roster: s.roster,
      rivals: s.rivals,
      player: s.player,
      arenaChampions: s.arenaChampions,
    }))
  );

  const allWarriors = useMemo(
    () => calculateGlobalFameLeaderboard(roster, rivals, player.stableName),
    [roster, rivals, player.stableName]
  );

  // Crowns derive from arenaChampions — a live reign marks the row, whatever
  // flag the warrior record happens to carry.
  const championIds = useMemo(
    () =>
      new Set(
        Object.values(arenaChampions ?? {})
          .map((t) => t.champion?.warriorId)
          .filter((id): id is NonNullable<typeof id> => id != null)
      ),
    [arenaChampions]
  );

  return (
    <Surface
      variant="glass"
      className="overflow-hidden p-0 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200 motion-reduce:animate-none"
    >
      <div className="p-5 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-arena-gold" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/80">
            Global Power Rankings
          </span>
        </div>
        <div className="text-[10px] font-mono text-muted-foreground flex items-center gap-2">
          <Activity className="h-3 w-3 text-primary" /> LIVE ARENA FEED
        </div>
      </div>
      <Table>
        <LeaderboardHead />
        <TableBody>
          {allWarriors.map((entry, i) => (
            <LeaderboardRow
              key={entry.warrior.id}
              entry={entry}
              rank={i + 1}
              championIds={championIds}
            />
          ))}
        </TableBody>
      </Table>
    </Surface>
  );
}

// ─── Circuit Crowns ─────────────────────────────────────────────────────────

function CircuitCrownsWidget() {
  const { arenaChampions, roster, rivals, player } = useGameStore(
    useShallow((s) => ({
      arenaChampions: s.arenaChampions,
      roster: s.roster,
      rivals: s.rivals,
      player: s.player,
    }))
  );
  const state = { arenaChampions, roster, rivals, player } as never;

  const held = championsHeldByStable(state, player.id);
  const total = Object.keys(arenaChampions ?? {}).length;

  return (
    <Link to="/world/arenas" className="group block">
      <Surface
        variant="glass"
        className="p-5 transition-colors group-hover:border-arena-gold/30 motion-reduce:transition-none"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Trophy className="h-3.5 w-3.5 text-arena-gold" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/80">
              Circuit Crowns
            </span>
          </div>
          <span className="font-display font-black text-xl text-arena-gold tracking-tighter">
            {held.length}
            <span className="text-[10px] text-muted-foreground/40 font-mono"> / {total}</span>
          </span>
        </div>
        <p className="text-[9px] text-muted-foreground/50 uppercase tracking-widest font-black mt-3">
          {held.length === 0
            ? 'No crowns held — visit the circuit to scout venues'
            : `Crowned at ${held.length} arena${held.length === 1 ? '' : 's'} — open the circuit`}
        </p>
      </Surface>
    </Link>
  );
}

/** Left column: chronicle, next bout, medical audit. */
function CommandColumn() {
  return (
    <div className="lg:col-span-8 flex flex-col gap-8">
      <SectionDivider label="Arena Chronicle" variant="gold" />
      <IntelligenceHubWidget />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="flex flex-col gap-4">
          <SectionDivider label="Next Bout" />
          <NextBoutWidget />
        </div>
        <div className="flex flex-col gap-4">
          <SectionDivider label="Medical Audit" />
          <MedicalAuditWidget />
        </div>
      </div>
    </div>
  );
}

/** Right column: conditions, style meta, crowns, analytics. */
function ConditionsColumn({
  renown,
  lifetimeKills,
  winRate,
}: {
  renown: number;
  lifetimeKills: number;
  winRate: number;
}) {
  return (
    <div className="lg:col-span-4 flex flex-col gap-8">
      <SectionDivider label="Arena Conditions" />
      <WeatherWidget />

      <SectionDivider label="Style Meta" />
      <MetaDriftWidget />

      <SectionDivider label="Arena Crowns" />
      <CircuitCrownsWidget />

      <SectionDivider label="Arena Analytics" />
      <ArenaAnalyticsSurface
        renown={renown}
        lifetimeKills={lifetimeKills}
        winRate={winRate}
      />
    </div>
  );
}

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

  const { handleStartAutosim, autosimming, autosimProgress, autosimResult, setAutosimResult } =
    useWeekExecution();

  const lifetimeKills = useMemo(
    () => roster.reduce((s, w) => s + (w.career?.kills || 0), 0),
    [roster]
  );
  const stableStats = useMemo(() => calculateStableStats(roster), [roster]);

  // Top-bar VIEW CARD CTA — scrolls to the fight card; disabled when no card exists.
  useRegisterCtaAction('/stable/arena', {
    enabled: matchCard.length > 0,
    run: () =>
      document
        .getElementById('fight-card')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
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
      <ArenaStatusStrip
        gameState={gameState}
        roster={roster}
        lifetimeKills={lifetimeKills}
      />

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
        onStart={handleStartAutosim}
        onReset={() => setAutosimResult(null)}
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
