import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useGameStore, useWorldState } from '@/state/useGameStore';
import { generatePairings } from '@/engine/bout/core/pairings';
import type { RivalStableData } from '@/types/game';
import { useWeekExecution } from '@/hooks/useWeekExecution';
import { calculateGlobalFameLeaderboard } from '@/engine/core/leaderboards';
import { filterActive } from '@/utils/roster';
import { AutosimConsole } from '@/components/run-round/AutosimConsole';
import { MatchCard } from '@/components/run-round/MatchCard';
import { calculateStableStats } from '@/engine/stats/stableStats';
import {
  MOOD_DESCRIPTIONS,
  MOOD_ICONS,
  getMoodModifiers,
  type CrowdMood,
} from '@/engine/crowdMood';
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
import {
  Trophy,
  Swords,
  Star,
  Skull,
  Eye,
  TrendingUp,
  Activity,
  Shield,
  BarChart3,
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Surface } from '@/components/ui/Surface';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageFrame } from '@/components/ui/PageFrame';
import { SectionDivider } from '@/components/ui/SectionDivider';
import { ImperialRing } from '@/components/ui/ImperialRing';

// Unified Widgets
import { MedicalAuditWidget } from '@/components/dashboard/MedicalAuditWidget';
import { IntelligenceHubWidget } from '@/components/dashboard/IntelligenceHubWidget';
import { NextBoutWidget } from '@/components/widgets/NextBoutWidget';
import { MetaDriftWidget } from '@/components/widgets/MetaDriftWidget';
import { WeatherWidget } from '@/components/widgets/WeatherWidget';

// ─── Crowd Mood Meter ──────────────────────────────────────────────────────

function CrowdMoodWidget() {
  const crowdMood = useGameStore((s) => s.crowdMood);
  const mood = crowdMood as CrowdMood;
  const mods = getMoodModifiers(mood);

  return (
    <Surface
      variant="glass"
      className="flex items-center gap-8 p-5 border-l-4 border-l-accent/50 animate-in fade-in zoom-in-95 duration-500"
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
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-3 px-4 py-2 bg-white/[0.02] border border-white/5 transition-all hover:bg-white/[0.05]">
              <div className="text-right">
                <div className="text-[8px] text-muted-foreground uppercase font-black tracking-widest leading-none mb-1">
                  FAME MULT
                </div>
                <div
                  className={cn(
                    'text-lg font-display font-black tracking-tighter leading-none',
                    mods.fameMultiplier > 1 ? 'text-primary' : 'text-muted-foreground'
                  )}
                >
                  ×{mods.fameMultiplier.toFixed(1)}
                </div>
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent className="text-[10px] uppercase font-black tracking-widest">
            Multiplies all fame gains from this week's bouts.
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-3 px-4 py-2 bg-white/[0.02] border border-white/5 transition-all hover:bg-white/[0.05]">
              <div className="text-right">
                <div className="text-[8px] text-muted-foreground uppercase font-black tracking-widest leading-none mb-1">
                  LETHALITY
                </div>
                <div
                  className={cn(
                    'text-lg font-display font-black tracking-tighter leading-none',
                    mods.killChanceBonus > 0 ? 'text-destructive' : 'text-muted-foreground'
                  )}
                >
                  {mods.killChanceBonus > 0 ? '+' : ''}
                  {(mods.killChanceBonus * 100).toFixed(0)}%
                </div>
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent className="text-[10px] uppercase font-black tracking-widest">
            Probability bonus added to all fatal blow checks.
          </TooltipContent>
        </Tooltip>
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

// ─── Arena Leaderboard ────────────────────────────────────────────────────

function ArenaLeaderboard() {
  const { roster, rivals, player } = useGameStore(
    useShallow((s) => ({ roster: s.roster, rivals: s.rivals, player: s.player }))
  );

  const allWarriors = useMemo(
    () => calculateGlobalFameLeaderboard(roster, rivals, player.stableName),
    [roster, rivals, player.stableName]
  );

  return (
    <Surface
      variant="glass"
      className="overflow-hidden p-0 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200"
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
        <TableBody>
          {allWarriors.map((entry, i) => {
            const w = entry.warrior;
            return (
              <TableRow
                key={w.id}
                className={cn(
                  'h-12 border-white/5 transition-colors',
                  entry.isPlayer
                    ? 'bg-primary/[0.03] border-l-2 border-l-primary'
                    : 'hover:bg-white/[0.02]'
                )}
              >
                <TableCell className="pl-6 font-mono text-[10px] font-black text-muted-foreground">
                  {String(i + 1).padStart(2, '0')}
                </TableCell>
                <TableCell>
                  <WarriorNameTag id={w.id} name={w.name} isChampion={w.champion} />
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
          })}
        </TableBody>
      </Table>
    </Surface>
  );
} /**
 * Arena hub.
 */

// ─── Main Hub Page ────────────────────────────────────────────────────────────

/**
 * Arena hub.
 */
export default function ArenaHub() {
  const { roster, player } = useGameStore(
    useShallow((s) => ({ roster: s.roster, player: s.player }))
  );
  const gameState = useWorldState();

  const matchCard = useMemo(
    () =>
      generatePairings(gameState).map((p) => ({
        playerWarrior: p.a,
        rivalWarrior: p.d,
        rivalStable:
          gameState.rivals.find((r: RivalStableData) => r.owner.id === p.rivalStableId) ||
          ({ owner: { id: p.rivalStableId, stableName: p.rivalStable } } as RivalStableData),
        isRivalryBout: p.isRivalry,
      })),
    [gameState]
  );

  const { handleStartAutosim, autosimming, autosimProgress, autosimResult, setAutosimResult } =
    useWeekExecution();

  const lifetimeKills = useMemo(
    () => roster.reduce((s, w) => s + (w.career?.kills || 0), 0),
    [roster]
  );
  const stableStats = useMemo(() => calculateStableStats(roster), [roster]);

  return (
    <PageFrame maxWidth="xl" className="pb-32">
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
              {filterActive(roster).length} WARRIORS ACTIVE
            </Badge>
          </div>
        }
      />

      {/* Band 2 — Crowd Mood full-width strip */}
      <CrowdMoodWidget />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-4">
        {/* Left Column: Command & Pairings */}
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

        {/* Right Column: Environmental & Tactical Feed */}
        <div className="lg:col-span-4 flex flex-col gap-8">
          <SectionDivider label="Arena Conditions" />
          <WeatherWidget />

          <SectionDivider label="Style Meta" />
          <MetaDriftWidget />

          <SectionDivider label="Arena Analytics" />
          <Surface
            variant="glass"
            className="p-6 space-y-6 bg-gradient-to-br from-white/[0.01] to-white/[0.03]"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ImperialRing size="sm" variant="blood">
                  <BarChart3 className="h-3.5 w-3.5 text-primary" />
                </ImperialRing>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/80">
                  Stable Stats
                </span>
              </div>
              <Activity className="h-3.5 w-3.5 text-primary animate-pulse" />
            </div>

            <div className="space-y-4 pt-2">
              <div className="flex justify-between items-center group">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 group-hover:text-foreground/80 transition-colors">
                  Stable Renown
                </span>
                <span className="font-display font-black text-xl text-arena-fame tracking-tighter">
                  {player.renown}
                </span>
              </div>
              <div className="flex justify-between items-center group">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 group-hover:text-foreground/80 transition-colors">
                  Lifetime Kills
                </span>
                <span className="font-display font-black text-xl text-destructive tracking-tighter">
                  {lifetimeKills}
                </span>
              </div>
              <div className="flex justify-between items-center group">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 group-hover:text-foreground/80 transition-colors">
                  Win Velocity
                </span>
                <span className="font-display font-black text-xl text-primary tracking-tighter">
                  {Math.round(stableStats.winRate * 100)}%
                </span>
              </div>
            </div>

            <div className="pt-6 border-t border-white/5">
              <p className="text-[9px] text-muted-foreground/30 leading-relaxed uppercase tracking-[0.2em] font-black italic">
                Season record updated after each bout.
              </p>
            </div>
          </Surface>
        </div>
      </div>

      <SectionDivider label="Global Arena Rankings" variant="primary" />

      {/* Global Rankings Channel */}
      <ArenaLeaderboard />

      {/* Arena Status Strip */}
      <div className="py-12 flex flex-wrap items-center justify-center gap-x-16 gap-y-6 opacity-20 px-6 border-t border-white/5 mt-12 grayscale hover:grayscale-0 transition-all duration-700">
        <div className="flex items-center gap-3 text-[9px] font-black uppercase tracking-[0.4em] whitespace-nowrap">
          <Skull className="h-3.5 w-3.5 text-destructive" /> Codex: V1.4
        </div>
        <div className="flex items-center gap-3 text-[9px] font-black uppercase tracking-[0.4em] whitespace-nowrap">
          <TrendingUp className="h-3.5 w-3.5 text-primary" /> Meta: Live
        </div>
        <div className="flex items-center gap-3 text-[9px] font-black uppercase tracking-[0.4em] whitespace-nowrap">
          <Star className="h-3.5 w-3.5 text-arena-gold" /> Fame: Active
        </div>
        <div className="flex items-center gap-3 text-[9px] font-black uppercase tracking-[0.4em] whitespace-nowrap">
          <Shield className="h-3.5 w-3.5 text-accent" /> Roster: Sealed
        </div>
      </div>

      {/* ── Fight Card Preview ── */}
      {matchCard.length > 0 && (
        <>
          <SectionDivider label="This Week's Fight Card" variant="primary" />
          <Surface variant="glass" className="p-6 space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {matchCard.map((p, i) => (
                <MatchCard
                  key={i}
                  pairing={{
                    a: p.playerWarrior,
                    d: p.rivalWarrior,
                    rivalStable: p.rivalStable?.owner?.stableName || 'Rival Stable',
                    isRivalry: p.isRivalryBout,
                  }}
                  crowdMood={gameState.crowdMood}
                />
              ))}
            </div>
          </Surface>
        </>
      )}

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
