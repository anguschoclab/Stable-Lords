import { Trophy, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { TableRow, TableCell } from '@/components/ui/table';
import { resolveStableName } from '@/engine/core/historyResolver';
import type { NameResolutionState } from '@/engine/core/historyResolver';
import type { FightSummary } from '@/types/game';

interface BoutTableRowProps {
  bout: FightSummary;
  playerStableId: string;
  state: NameResolutionState;
}

/**
 *
 */
export function BoutTableRow({ bout, playerStableId, state }: BoutTableRowProps) {
  const isPlayerA = bout.stableIdA === playerStableId;
  const playerWon = (isPlayerA && bout.winner === 'A') || (!isPlayerA && bout.winner === 'D');

  return (
    <TableRow key={bout.id} className="border-white/5 group/row hover:bg-white/2 transition-colors">
      <TableCell className="pl-6 py-4">
        <span className="text-[10px] font-mono font-black text-foreground/20 group-hover/row:text-primary transition-colors">
          WK {bout.week.toString().padStart(2, '0')}
        </span>
      </TableCell>
      <TableCell className="py-4">
        <div className="flex flex-col">
          <span className="text-xs font-black uppercase tracking-tight text-foreground/80 group-hover/row:text-foreground">
            {resolveStableName(state, isPlayerA ? bout.stableIdA : bout.stableIdD, 'Unknown')}
          </span>
          <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40 mt-0.5">
            VS // {resolveStableName(state, isPlayerA ? bout.stableIdD : bout.stableIdA, 'Unknown')}
          </span>
        </div>
      </TableCell>
      <TableCell className="text-center py-4">
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(
                'inline-flex items-center gap-2 px-3 py-1 rounded-none border font-black text-[9px] tracking-[0.2em] uppercase transition-all',
                playerWon
                  ? 'bg-arena-pop/10 border-arena-pop/20 text-arena-pop'
                  : 'bg-destructive/10 border-destructive/20 text-destructive'
              )}
            >
              {playerWon ? <Trophy className="h-2.5 w-2.5" /> : <Shield className="h-2.5 w-2.5" />}
              {playerWon ? 'VICTORY' : 'DEFEAT'}
            </div>
          </TooltipTrigger>
          <TooltipContent className="bg-neutral-950 border-white/10 text-[9px] font-black tracking-widest">
            {playerWon ? 'Combat objectives achieved.' : 'Strategic failure detected.'}
          </TooltipContent>
        </Tooltip>
      </TableCell>
      <TableCell className="text-right pr-6 py-4">
        <div className="flex flex-col items-end">
          <span className="text-[10px] font-mono font-black text-muted-foreground/60 uppercase">
            {bout.by || 'JUDICIAL_DECREE'}
          </span>
          <div className="h-0.5 w-8 bg-white/5 rounded-full mt-1 group-hover/row:bg-primary/40 transition-colors" />
        </div>
      </TableCell>
    </TableRow>
  );
}
