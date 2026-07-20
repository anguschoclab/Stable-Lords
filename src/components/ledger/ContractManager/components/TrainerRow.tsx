import { TableRow, TableCell } from '@/components/ui/table';
import { Coins } from 'lucide-react';
import type { Trainer } from '@/types/game';
import { TrainerTierBadge } from './TrainerTierBadge';
import { TrainerTenureCell } from './TrainerTenureCell';
import { getSalary } from '../hooks/useContractData';

/**
 *
 */
export function TrainerRow({ trainer: t }: { trainer: Trainer }) {
  return (
    <TableRow key={t.id} className="border-white/5 group hover:bg-white/2 transition-colors">
      <TableCell className="pl-8 py-5">
        <div className="flex flex-col">
          <span className="font-display font-black text-sm uppercase tracking-tight group-hover:text-primary transition-colors">
            {t.name}
          </span>
          {t.retiredFromWarrior && (
            <span className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest mt-0.5">
              VETERAN_ID: {t.retiredFromWarrior}
            </span>
          )}
        </div>
      </TableCell>
      <TableCell className="py-5">
        <TrainerTierBadge tier={t.tier} />
      </TableCell>
      <TableCell className="py-5">
        <div className="flex items-center gap-2.5">
          <div className="h-1.5 w-1.5 rounded-full bg-primary/40 group-hover:bg-primary transition-colors" />
          <span className="text-xs font-black uppercase tracking-widest text-foreground/80 group-hover:text-foreground transition-all motion-reduce:transition-none motion-reduce:transform-none">
            {t.focus}
          </span>
        </div>
      </TableCell>
      <TableCell className="py-5">
        <TrainerTenureCell weeksLeft={t.contractWeeksLeft} />
      </TableCell>
      <TableCell className="text-right pr-8 py-5">
        <div className="flex flex-col items-end">
          <div className="flex items-center justify-end gap-2 text-sm font-mono font-black text-destructive/80 group-hover:text-destructive group-hover:drop-shadow-[0_0_5px_rgba(255,0,0,0.2)] transition-all motion-reduce:transition-none motion-reduce:transform-none">
            <span>{getSalary(t.tier)}</span>
            <Coins className="h-4 w-4 text-arena-gold opacity-60" />
          </div>
          <span className="text-[8px] font-black text-muted-foreground/30 uppercase tracking-widest mt-0.5">
            Recurring_Debit
          </span>
        </div>
      </TableCell>
    </TableRow>
  );
}
