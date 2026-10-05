import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useGameStore } from '@/state/useGameStore';
import { calculateGlobalFameLeaderboard } from '@/engine/core/leaderboards';
import { WarriorNameTag } from '@/components/ui/WarriorBadges';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Trophy, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Surface } from '@/components/ui/Surface';

/** Rankings table header. */
function LeaderboardHead() {
  return (
    <TableHeader className="bg-white/[0.03]">
      <TableRow className="h-10 hover:bg-transparent border-white/5">
        <TableHead className="w-12 pl-6 text-[9px] font-black uppercase tracking-widest">
          RANK
        </TableHead>
        <TableHead className="text-[9px] font-black uppercase tracking-widest">WARRIOR</TableHead>
        <TableHead className="text-[9px] font-black uppercase tracking-widest">STABLE</TableHead>
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
  entry: {
    warrior: {
      id: string;
      name: string;
      epithet?: string;
      career: { wins: number; losses: number; kills: number };
      fame: number;
    };
    isPlayer: boolean;
    stableName: string;
  };
  rank: number;
  championIds: Set<string>;
}) {
  const w = entry.warrior;
  return (
    <TableRow
      className={cn(
        'h-12 border-white/5 transition-colors motion-reduce:transition-none',
        entry.isPlayer ? 'bg-primary/[0.03] border-l-2 border-l-primary' : 'hover:bg-white/[0.02]'
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

/**
 * Arena leaderboard.
 */
export function ArenaLeaderboard() {
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
