import { useMemo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useGameStore } from '@/state/useGameStore';
import { getAllArenas } from '@/data/arenas';
import {
  calculatePerArenaLeaderboards,
  type ArenaLeaderboardData,
} from '@/utils/arenaLeaderboards';
import { ARENA_SIZE_PROFILES } from '@/engine/combat/mechanics/distanceResolution';
import { Surface } from '@/components/ui/Surface';
import { PageFrame } from '@/components/ui/PageFrame';
import { PageHeader } from '@/components/ui/PageHeader';
import { WarriorNameTag } from '@/components/ui/WarriorBadges';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { Swords, Trophy, Skull, MapPin } from 'lucide-react';

const SIZE_LABELS: Record<string, string> = {
  cramped: 'CRAMPED',
  standard: 'STANDARD',
  open: 'OPEN',
};

const SIZE_COLORS: Record<string, string> = {
  cramped: 'text-destructive/70',
  standard: 'text-muted-foreground/60',
  open: 'text-primary/70',
};

function ArenaTable({
  title,
  icon,
  entries,
  showKills,
}: {
  title: string;
  icon: React.ReactNode;
  entries: ArenaLeaderboardData['topWarriors'];
  showKills: boolean;
}) {
  if (entries.length === 0) {
    return (
      <Surface variant="glass" className="p-5 overflow-hidden">
        <div className="flex items-center gap-2 mb-4">
          {icon}
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/80">
            {title}
          </span>
        </div>
        <p className="text-[10px] text-muted-foreground/40 uppercase tracking-widest font-black py-4 text-center">
          No records yet
        </p>
      </Surface>
    );
  }

  return (
    <Surface variant="glass" className="overflow-hidden p-0">
      <div className="p-5 border-b border-white/5 bg-white/[0.02] flex items-center gap-2">
        {icon}
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/80">
          {title}
        </span>
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
              {showKills ? 'K / W / L' : 'W / L / K'}
            </TableHead>
            <TableHead className="pr-6 text-right text-[9px] font-black uppercase tracking-widest">
              {showKills ? 'KILLS' : 'WIN %'}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry, i) => (
            <TableRow
              key={entry.warriorId}
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
                <WarriorNameTag id={entry.warriorId} name={entry.name} />
              </TableCell>
              <TableCell className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 italic">
                {entry.stableName}
              </TableCell>
              <TableCell className="text-center font-mono text-[10px]">
                {showKills ? (
                  <>
                    <span className="text-arena-blood font-black">{entry.kills}</span>
                    <span className="mx-1 opacity-20">/</span>
                    <span className="text-primary font-bold">{entry.wins}</span>
                    <span className="mx-1 opacity-20">/</span>
                    <span className="text-destructive font-bold">{entry.losses}</span>
                  </>
                ) : (
                  <>
                    <span className="text-primary font-bold">{entry.wins}</span>
                    <span className="mx-1 opacity-20">/</span>
                    <span className="text-destructive font-bold">{entry.losses}</span>
                    <span className="mx-1 opacity-20">/</span>
                    <span className="text-arena-blood font-black">{entry.kills}</span>
                  </>
                )}
              </TableCell>
              <TableCell className="pr-6 text-right font-mono font-black text-[11px]">
                {showKills ? (
                  <span className="text-arena-blood">{entry.kills}</span>
                ) : (
                  <span className="text-arena-gold">{(entry.winRate * 100).toFixed(0)}%</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Surface>
  );
}

export default function ArenaLeaderboards() {
  const arenas = useMemo(() => getAllArenas(), []);
  const [selectedArenaId, setSelectedArenaId] = useState<string>(arenas[0]?.id ?? '');

  const { roster, rivals, player, arenaHistory } = useGameStore(
    useShallow((s) => ({
      roster: s.roster,
      rivals: s.rivals,
      player: s.player,
      arenaHistory: s.arenaHistory,
    }))
  );

  const allLeaderboards = useMemo(
    () => calculatePerArenaLeaderboards(roster, player.stableName, rivals, arenaHistory),
    [roster, rivals, player.stableName, arenaHistory]
  );

  const currentLB = allLeaderboards.find((lb) => lb.arenaId === selectedArenaId);
  const currentArena = arenas.find((a) => a.id === selectedArenaId);
  const sizeProfile = currentArena ? ARENA_SIZE_PROFILES[currentArena.size] : null;

  return (
    <PageFrame>
      <PageHeader
        title="Arena Leaderboards"
        subtitle="Per-venue rankings — top warriors and executioners across every active arena"
      />

      {/* Arena selector */}
      <div className="flex flex-wrap gap-2 mb-6">
        {arenas.map((arena) => (
          <button
            key={arena.id}
            onClick={() => setSelectedArenaId(arena.id)}
            className={cn(
              'px-4 py-2 text-[9px] font-black uppercase tracking-[0.2em] border transition-all duration-200',
              selectedArenaId === arena.id
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-white/10 bg-white/[0.02] text-muted-foreground/60 hover:border-white/20 hover:text-foreground/60'
            )}
          >
            {arena.name}
          </button>
        ))}
      </div>

      {/* Arena info strip */}
      {currentArena && (
        <Surface
          variant="glass"
          className="mb-6 p-5 flex flex-wrap items-start justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <MapPin className="h-4 w-4 text-muted-foreground/40" />
            <div>
              <div className="text-sm font-display font-black uppercase text-foreground">
                {currentArena.name}
              </div>
              <div className="text-[9px] text-muted-foreground/60 mt-0.5 max-w-md">
                {currentArena.description}
              </div>
            </div>
          </div>
          <div className="flex gap-6 text-right">
            <div>
              <div
                className={cn(
                  'text-[9px] font-black uppercase tracking-widest',
                  SIZE_COLORS[currentArena.size]
                )}
              >
                {SIZE_LABELS[currentArena.size]}
              </div>
              <div className="text-[8px] text-muted-foreground/40 mt-0.5 uppercase tracking-widest">
                Arena Size
              </div>
            </div>
            {sizeProfile && (
              <div>
                <div className="text-[9px] font-black uppercase tracking-widest text-foreground/60">
                  {sizeProfile.startRange} → {sizeProfile.maxRange}
                </div>
                <div className="text-[8px] text-muted-foreground/40 mt-0.5 uppercase tracking-widest">
                  Range Ladder
                </div>
              </div>
            )}
            {currentArena.surfaceMod.riposteMod !== 0 && (
              <div>
                <div
                  className={cn(
                    'text-[9px] font-black uppercase tracking-widest',
                    currentArena.surfaceMod.riposteMod > 0
                      ? 'text-primary/70'
                      : 'text-destructive/70'
                  )}
                >
                  {currentArena.surfaceMod.riposteMod > 0 ? '+' : ''}
                  {currentArena.surfaceMod.riposteMod} RIP
                </div>
                <div className="text-[8px] text-muted-foreground/40 mt-0.5 uppercase tracking-widest">
                  Riposte Mod
                </div>
              </div>
            )}
            {currentArena.surfaceMod.enduranceMult !== 1.0 && (
              <div>
                <div
                  className={cn(
                    'text-[9px] font-black uppercase tracking-widest',
                    currentArena.surfaceMod.enduranceMult > 1.0
                      ? 'text-destructive/70'
                      : 'text-primary/70'
                  )}
                >
                  ×{currentArena.surfaceMod.enduranceMult.toFixed(2)} END
                </div>
                <div className="text-[8px] text-muted-foreground/40 mt-0.5 uppercase tracking-widest">
                  Endurance
                </div>
              </div>
            )}
            <div>
              <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">
                {currentArena.tags.join(' · ')}
              </div>
              <div className="text-[8px] text-muted-foreground/40 mt-0.5 uppercase tracking-widest">
                Tags
              </div>
            </div>
          </div>
        </Surface>
      )}

      {/* Leaderboard tables */}
      {currentLB ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ArenaTable
            title="Top Warriors"
            icon={<Trophy className="h-4 w-4 text-arena-gold" />}
            entries={currentLB.topWarriors}
            showKills={false}
          />
          <ArenaTable
            title="Top Executioners"
            icon={<Skull className="h-4 w-4 text-arena-blood" />}
            entries={currentLB.topKillers}
            showKills={true}
          />
        </div>
      ) : (
        <Surface variant="glass" className="p-10 text-center">
          <Swords className="h-8 w-8 mx-auto mb-3 text-muted-foreground/20" />
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">
            No arena data yet
          </p>
          <p className="text-[9px] text-muted-foreground/30 mt-1 uppercase tracking-widest">
            Fight records will appear once bouts are held here
          </p>
        </Surface>
      )}
    </PageFrame>
  );
}
