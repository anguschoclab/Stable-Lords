import { useMemo } from 'react';
import { useGameStore, reconstructGameState } from '@/state/useGameStore';
import { generatePairings } from '@/engine/bout/core/pairings';
import { isFightReady } from '@/engine/warriorStatus';
import type { RivalStableData } from '@/types/game';
import { useCombatExecution } from '@/hooks/useCombatExecution';
import { calculateGlobalFameLeaderboard } from '@/engine/core/leaderboards';
import { filterActive } from '@/utils/roster';
import { CombatExecutionPanel } from '@/components/arena/CombatExecutionPanel';
import { useShallow } from 'zustand/react/shallow';
import { calculateStableStats } from '@/engine/stats/stableStats';
import type { Warrior } from '@/types/warrior.types';
import {
  MOOD_DESCRIPTIONS,
  MOOD_ICONS,
  getMoodModifiers,
  type CrowdMood,
} from '@/engine/crowdMood';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  Zap,
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
  const { crowdMood } = useGameStore();
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
  const { roster, rivals, player } = useGameStore();

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
  const store = useGameStore();
  const { roster, player } = store;
  const { week, isTournamentWeek } = useGameStore(
    useShallow((s) => ({ week: s.week, isTournamentWeek: s.isTournamentWeek }))
  );
  // const navigate = useNavigate();
  const gameState = useMemo(() => reconstructGameState(store), [store]);

  const fightReady = useMemo(
    () => gameState.roster.filter((w: Warrior) => isFightReady(w)),
    [gameState.roster]
  );
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

  const combat = useCombatExecution({
    gameState,
    matchCardLength: matchCard.length,
    fightReadyLength: fightReady.length,
  });

  const lifetimeKills = useMemo(
    () => roster.reduce((s, w) => s + (w.career?.kills || 0), 0),
    [roster]
  );
  const stableStats = useMemo(() => calculateStableStats(roster), [roster]);

  return (
    <PageFrame maxWidth="xl" className="pb-32">
      <PageHeader
        icon={Swords}
        eyebrow="Operational Command"
        title="Arena Hub"
        subtitle="SPECTACLE ENGINE · WORLD STATE MONITOR"
        actions={
          <div className="flex gap-3">
            <Badge
              variant="outline"
              className="bg-primary/5 text-primary border-primary/20 font-black uppercase tracking-widest text-[9px] px-3 py-1 rounded-none"
            >
              {filterActive(roster).length} UNITS ACTIVE
            </Badge>
          </div>
        }
      />

      {/* Band 2 — Crowd Mood full-width strip */}
      <CrowdMoodWidget />

      {/* Execute Week CTA */}
      <Surface
        variant="glass"
        className="flex flex-row items-center gap-6 p-6 border-l-4 border-l-primary shadow-2xl"
      >
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
              Fight Week
            </span>
            <div className="h-px w-8 bg-primary/30" />
          </div>
          <h2 className="font-display font-black text-2xl uppercase tracking-tight text-foreground">
            {isTournamentWeek ? `Empire Day ${gameState.day + 1}` : `Week ${week}`}
          </h2>
          <p className="text-[10px] text-muted-foreground/60 uppercase tracking-widest mt-1">
            Send your warriors to the arena and resolve all bouts
          </p>
        </div>
        <Button
          onClick={() => {
            combat.setShowCombat(true);
            combat.setResults([]);
            combat.setAutosimResult(null);
          }}
          disabled={combat.showCombat}
          className="h-12 px-8 bg-primary text-primary-foreground font-black uppercase tracking-[0.2em] text-[11px] hover:shadow-[0_0_20px_rgba(135,34,40,0.3)] transition-all duration-300 rounded-none shrink-0"
        >
          <Zap className="h-4 w-4 mr-3 fill-current" />
          {isTournamentWeek ? 'EXECUTE DAY' : 'EXECUTE WEEK'}
        </Button>
      </Surface>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-4">
        {/* Left Column: Command & Pairings */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          <SectionDivider label="Arena Chronicle" variant="gold" />
          <IntelligenceHubWidget />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex flex-col gap-4">
              <SectionDivider label="Next Engagement" />
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

          <SectionDivider label="Style Meta State" />
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
                  Performance Feed
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
                Data stream synchronized with central registry.
              </p>
            </div>
          </Surface>
        </div>
      </div>

      <SectionDivider label="Global Arena Rankings" variant="primary" />

      {/* Global Rankings Channel */}
      <ArenaLeaderboard />

      {/* Operational Protocol Strip */}
      <div className="py-12 flex flex-wrap items-center justify-center gap-x-16 gap-y-6 opacity-20 px-6 border-t border-white/5 mt-12 grayscale hover:grayscale-0 transition-all duration-700">
        <div className="flex items-center gap-3 text-[9px] font-black uppercase tracking-[0.4em] whitespace-nowrap">
          <Skull className="h-3.5 w-3.5 text-destructive" /> Protocols: V1.4
        </div>
        <div className="flex items-center gap-3 text-[9px] font-black uppercase tracking-[0.4em] whitespace-nowrap">
          <TrendingUp className="h-3.5 w-3.5 text-primary" /> Drift: Sync
        </div>
        <div className="flex items-center gap-3 text-[9px] font-black uppercase tracking-[0.4em] whitespace-nowrap">
          <Star className="h-3.5 w-3.5 text-arena-gold" /> Fame: Active
        </div>
        <div className="flex items-center gap-3 text-[9px] font-black uppercase tracking-[0.4em] whitespace-nowrap">
          <Shield className="h-3.5 w-3.5 text-accent" /> Hash: Verified
        </div>
      </div>

      {/* ── Inline Combat Execution Panel ── */}
      <CombatExecutionPanel
        combat={combat}
        fightReadyCount={fightReady.length}
        matchCard={matchCard}
        crowdMood={gameState.crowdMood}
      />
    </PageFrame>
  );
}
