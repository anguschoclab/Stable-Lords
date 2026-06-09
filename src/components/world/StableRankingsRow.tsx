import { Link } from '@tanstack/react-router';
import { TableCell, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Skull } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StatBattery } from '@/components/ui/StatBattery';
import type { StableRow } from '@/types/leaderboard';

const TIER_ACCENTS: Record<string, string> = {
  Legendary: 'bg-arena-gold text-primary-foreground border-arena-gold/30',
  Major: 'bg-primary/20 text-primary border-primary/30',
  Established: 'bg-muted-foreground/10 text-muted-foreground border-muted-foreground/20',
  Minor: 'bg-neutral-900/40 text-muted-foreground border-white/5',
  Player: 'bg-primary text-primary-foreground border-primary',
};

interface StableRankingsRowProps {
  row: StableRow;
  index: number;
}

function RankCell({ index }: { index: number }) {
  return (
    <TableCell className="text-center">
      <span
        className={cn(
          'font-mono text-xs font-black',
          index === 0
            ? 'text-arena-gold'
            : index === 1
              ? 'text-muted-foreground'
              : 'text-muted-foreground/30'
        )}
      >
        {index + 1}
      </span>
    </TableCell>
  );
}

function NameCell({ row }: { row: StableRow }) {
  return (
    <TableCell>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              {row.isPlayer ? (
                <Link to="/ops/overview">{row.name}</Link>
              ) : (
                <Link
                  to="/world/stable/$id"
                  params={{ id: row.id }}
                  className="font-display font-black uppercase text-xs tracking-tight transition-all text-foreground hover:text-primary"
                >
                  {row.name}
                </Link>
              )}
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[9px] font-black text-muted-foreground uppercase opacity-40 leading-none">
                  Commanded by {row.ownerName}
                </span>
                {row.isPlayer && (
                  <Badge
                    variant="outline"
                    className="text-[8px] font-black border-primary/20 bg-primary/10 text-primary py-0 px-1 leading-none h-3"
                  >
                    ACTIVE PLAYER
                  </Badge>
                )}
              </div>
            </div>
          </TooltipTrigger>
          {row.motto && (
            <TooltipContent
              side="right"
              className="text-[10px] font-black uppercase tracking-widest bg-neutral-950 border-white/10 p-3 shadow-xl"
            >
              <div className="text-primary mb-1">Motto:</div>
              <div className="italic opacity-80">&quot;{row.motto}&quot;</div>
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
    </TableCell>
  );
}

function TierCell({ row }: { row: StableRow }) {
  return (
    <TableCell className="hidden md:table-cell">
      <Badge
        variant="outline"
        className={cn(
          'text-[8px] font-black py-0.5 px-2 rounded-none',
          TIER_ACCENTS[row.tier] || TIER_ACCENTS.Minor
        )}
      >
        {row.tier}
      </Badge>
    </TableCell>
  );
}

function PrestigeCell({ row }: { row: StableRow }) {
  return (
    <TableCell className="text-right">
      <div className="flex flex-col items-end">
        <span className="font-mono font-black text-xs text-arena-gold">
          {row.fame.toLocaleString()}
        </span>
        <span className="text-[8px] font-black text-muted-foreground uppercase opacity-30 tracking-widest">
          Prestige
        </span>
      </div>
    </TableCell>
  );
}

function WinsCell({ row }: { row: StableRow }) {
  return (
    <TableCell className="text-right font-mono font-black text-xs text-primary">
      {row.wins}
    </TableCell>
  );
}

function LossesCell({ row }: { row: StableRow }) {
  return (
    <TableCell className="text-right font-mono font-black text-xs text-muted-foreground/40">
      {row.losses}
    </TableCell>
  );
}

function WinRateCell({ row }: { row: StableRow }) {
  return (
    <TableCell className="text-right hidden sm:table-cell">
      <div className="flex flex-col items-end w-20 ml-auto">
        <StatBattery
          label="WR"
          value={row.winRate}
          max={100}
          labelValue={`${row.winRate}%`}
          colorClass="bg-primary"
        />
      </div>
    </TableCell>
  );
}

function KillsCell({ row }: { row: StableRow }) {
  return (
    <TableCell className="text-right">
      <div className="flex items-center justify-end gap-1.5">
        <span
          className={cn(
            'font-mono font-black text-xs',
            row.kills > 0 ? 'text-destructive' : 'text-muted-foreground/30'
          )}
        >
          {row.kills}
        </span>
        <Skull
          className={cn(
            'h-3 w-3',
            row.kills > 0 ? 'text-destructive/40' : 'text-muted-foreground/10'
          )}
        />
      </div>
    </TableCell>
  );
}

/**
 *
 */
export function StableRankingsRow({ row, index }: StableRankingsRowProps) {
  return (
    <TableRow
      className={cn(
        'border-white/5 transition-colors group',
        row.isPlayer ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-white/5'
      )}
    >
      <RankCell index={index} />
      <NameCell row={row} />
      <TierCell row={row} />
      <PrestigeCell row={row} />
      <WinsCell row={row} />
      <LossesCell row={row} />
      <WinRateCell row={row} />
      <KillsCell row={row} />
    </TableRow>
  );
}
