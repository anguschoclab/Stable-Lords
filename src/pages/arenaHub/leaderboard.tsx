import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useGameStore } from '@/state/useGameStore';
import { calculateGlobalFameLeaderboard } from '@/engine/core/leaderboards';
import { WarriorNameTag } from '@/components/ui/WarriorBadges';
import { StandingsTable, type StandingsColumn } from '@/components/ui/StandingsTable';
import { Trophy, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Surface } from '@/components/ui/Surface';

type LeaderboardEntry = ReturnType<typeof calculateGlobalFameLeaderboard>[number];

/** Column defs for the global power-rankings board. */
function leaderboardColumns(championIds: Set<string>): StandingsColumn<LeaderboardEntry>[] {
  return [
    {
      header: 'RANK',
      headClassName: 'w-12 pl-6',
      cellClassName: 'pl-6 font-mono text-[10px] font-black text-muted-foreground',
      render: (_entry, i) => String(i + 1).padStart(2, '0'),
    },
    {
      header: 'WARRIOR',
      render: (entry) => (
        <WarriorNameTag
          id={entry.warrior.id}
          name={entry.warrior.name}
          epithet={entry.warrior.epithet}
          isChampion={championIds.has(entry.warrior.id)}
        />
      ),
    },
    {
      header: 'STABLE',
      cellClassName:
        'text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 italic',
      render: (entry) => entry.stableName,
    },
    {
      header: 'W / L / K',
      headClassName: 'text-center',
      cellClassName: 'text-center font-mono text-[10px]',
      render: (entry) => (
        <>
          <span className="text-primary font-bold">{entry.warrior.career.wins}</span>
          <span className="mx-1 opacity-20">/</span>
          <span className="text-destructive font-bold">{entry.warrior.career.losses}</span>
          <span className="mx-1 opacity-20">/</span>
          <span className="text-arena-blood font-black">{entry.warrior.career.kills}</span>
        </>
      ),
    },
    {
      header: 'FAME',
      headClassName: 'pr-6 text-right',
      cellClassName: 'pr-6 text-right',
      render: (entry) => (
        <span className="font-display font-black text-arena-fame text-lg tracking-tighter">
          {entry.warrior.fame}
        </span>
      ),
    },
  ];
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

  const columns = leaderboardColumns(championIds);

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
      <StandingsTable
        columns={columns}
        rows={allWarriors}
        rowKey={(entry) => entry.warrior.id}
        classes={{
          head: 'bg-white/[0.03]',
          headRow: 'h-10',
          headCell: 'text-[9px] font-black uppercase tracking-widest',
          row: (entry) =>
            cn(
              'h-12 border-white/5 transition-colors motion-reduce:transition-none',
              entry.isPlayer
                ? 'bg-primary/[0.03] border-l-2 border-l-primary'
                : 'hover:bg-white/[0.02]'
            ),
        }}
      />
    </Surface>
  );
}
