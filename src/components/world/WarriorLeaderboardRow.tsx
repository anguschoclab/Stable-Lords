import { Link } from '@tanstack/react-router';
import { TableCell, TableRow } from '@/components/ui/table';
import { Crown, Skull } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WarriorRow } from '@/types/leaderboard';

interface WarriorLeaderboardRowProps {
  row: WarriorRow;
  index: number;
  isFiltered: boolean;
}

function RankCell({ row, index, isFiltered }: WarriorLeaderboardRowProps) {
  return (
    <TableCell className="text-center">
      <div className="flex flex-col items-center gap-0.5">
        <div
          className={cn(
            'font-mono text-xs font-black p-1 rounded-none border inline-block min-w-6',
            row.officialRank <= 64
              ? 'bg-arena-gold/10 text-arena-gold border-arena-gold/20'
              : row.officialRank <= 128
                ? 'bg-arena-steel/10 text-arena-steel border-arena-steel/20'
                : 'bg-neutral-800 text-muted-foreground border-border/10'
          )}
        >
          {isFiltered ? `#${index + 1}` : `#${row.officialRank}`}
        </div>
        {isFiltered && (
          <span className="text-[8px] font-mono text-muted-foreground/30">#{row.officialRank}</span>
        )}
      </div>
    </TableCell>
  );
}

function NameCell({ row }: { row: WarriorRow }) {
  return (
    <TableCell>
      <div className="flex flex-col">
        {row.isPlayer ? (
          <Link
            to="/warrior/$id"
            params={{ id: row.id }}
            className="font-display font-black uppercase text-xs tracking-tight text-primary hover:text-foreground transition-all flex items-center gap-2"
          >
            {row.name}
            {row.officialRank === 1 && <Crown className="h-3 w-3 text-arena-gold" />}
          </Link>
        ) : (
          <div className="font-display font-black uppercase text-xs tracking-tight text-foreground flex items-center gap-2">
            {row.name}
            {row.officialRank === 1 && <Crown className="h-3 w-3 text-arena-gold" />}
          </div>
        )}
        <span className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest leading-none mt-0.5">
          STATUS // ACTIVE DUTY
        </span>
      </div>
    </TableCell>
  );
}

function StableCell({ row }: { row: WarriorRow }) {
  return (
    <TableCell className="hidden md:table-cell">
      {row.isPlayer ? (
        <Link
          to="/command/roster"
          className="text-xs font-bold text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
        >
          <span className="text-[10px] opacity-20">PATRON:</span> {row.stableName}
        </Link>
      ) : (
        <Link
          to="/world/stable/$id"
          params={{ id: row.stableId }}
          className="text-xs font-bold text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
        >
          <span className="text-[10px] opacity-20">PATRON:</span> {row.stableName}
        </Link>
      )}
    </TableCell>
  );
}

function StyleCell({ row }: { row: WarriorRow }) {
  return (
    <TableCell className="hidden lg:table-cell text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
      {row.style}
    </TableCell>
  );
}

function StatCells({ row }: { row: WarriorRow }) {
  return (
    <>
      <TableCell className="text-center font-mono font-black text-xs text-primary">
        {Math.round(row.compositeScore)}
      </TableCell>
      <TableCell className="text-center font-mono font-black text-xs text-arena-gold">
        {row.fame.toLocaleString()}
      </TableCell>
      <TableCell className="text-center font-mono font-black text-xs text-foreground/70">
        {row.wins}
      </TableCell>
      <TableCell className="text-center hidden sm:table-cell">
        <span className="font-mono font-black text-xs">{row.winRate}%</span>
      </TableCell>
    </>
  );
}

function KillsCell({ row }: { row: WarriorRow }) {
  return (
    <TableCell className="text-center">
      <div className="flex items-center justify-center gap-2">
        <span
          className={cn(
            'font-mono font-black text-xs',
            row.kills > 0 ? 'text-destructive' : 'text-muted-foreground/20'
          )}
        >
          {row.kills}
        </span>
        <Skull
          className={cn(
            'h-3 w-3',
            row.kills > 0 ? 'text-destructive/40' : 'text-muted-foreground/5'
          )}
        />
      </div>
    </TableCell>
  );
}

/**
 *
 */
export function WarriorLeaderboardRow({ row, index, isFiltered }: WarriorLeaderboardRowProps) {
  return (
    <TableRow
      className={cn(
        'border-white/5 transition-colors group',
        row.isPlayer ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-white/5'
      )}
    >
      <RankCell row={row} index={index} isFiltered={isFiltered} />
      <NameCell row={row} />
      <StableCell row={row} />
      <StyleCell row={row} />
      <StatCells row={row} />
      <KillsCell row={row} />
    </TableRow>
  );
}
