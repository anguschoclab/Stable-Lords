import { Surface } from '@/components/ui/Surface';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Wallet, ArrowDownRight, History } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LedgerEntry } from '@/types/state.types';

/**
 * Ledger registry props.
 */
export interface LedgerRegistryProps {
  recentLedger: LedgerEntry[];
  totalLedgerEntries: number;
}

/** Registry panel header with the entry count. */
function RegistryHeader({ totalLedgerEntries }: { totalLedgerEntries: number }) {
  return (
    <div className="p-8 border-b border-white/5 bg-neutral-900/40 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="p-2.5 rounded-none bg-secondary/20 border border-white/5">
          <History className="h-4 w-4 text-muted-foreground" />
        </div>
        <div>
          <h3 className="font-display text-base font-black uppercase tracking-tight">
            Transaction Log
          </h3>
          <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest opacity-40">
            Audited Transaction History · {totalLedgerEntries} entries
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="h-1 w-1 rounded-full bg-arena-gold animate-pulse motion-reduce:animate-none" />
        <span className="text-[8px] font-black uppercase tracking-widest text-arena-gold opacity-60">
          Verified by Scribes
        </span>
      </div>
    </div>
  );
}

/** Transaction table (or the empty placeholder when the ledger is bare). */
function LedgerTable({ recentLedger }: { recentLedger: LedgerEntry[] }) {
  if (recentLedger.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-12 text-center opacity-20 group">
        <Wallet className="h-16 w-16 mb-4 group-hover:scale-110 transition-transform duration-500 motion-reduce:transition-none motion-reduce:transform-none" />
        <p className="text-sm font-display font-black uppercase tracking-[0.3em]">No Entries</p>
        <p className="text-[10px] lowercase italic opacity-80 mt-2 font-medium">
          Fight a bout to see transactions here...
        </p>
      </div>
    );
  }
  return (
    <Table>
      <TableHeader className="bg-black/20 sticky top-0 z-10 backdrop-blur-md border-b border-white/5">
        <TableRow className="hover:bg-transparent border-white/5">
          <TableHead className="w-24 font-black uppercase text-[10px] tracking-widest pl-8">
            INDEX
          </TableHead>
          <TableHead className="font-black uppercase text-[10px] tracking-widest text-muted-foreground/60">
            DESCRIPTION
          </TableHead>
          <TableHead className="text-right font-black uppercase text-[10px] tracking-widest pr-8">
            DISBURSEMENT
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {recentLedger.map((entry) => (
          <TableRow
            key={entry.id}
            className="border-white/5 group hover:bg-white/2 transition-colors motion-reduce:transition-none"
          >
            <TableCell className="pl-8 py-4">
              <div className="flex items-center gap-3">
                <span className="text-[9px] font-mono font-black text-muted-foreground opacity-40 group-hover:opacity-100 group-hover:text-primary transition-all motion-reduce:transition-none motion-reduce:transform-none">
                  WK {entry.week.toString().padStart(2, '0')}
                </span>
                <div className="h-1 w-1 rounded-full bg-white/5 group-hover:bg-primary transition-colors motion-reduce:transition-none" />
              </div>
            </TableCell>
            <TableCell className="py-4">
              <span className="text-xs font-black uppercase tracking-widest text-foreground/80 group-hover:text-foreground transition-all motion-reduce:transition-none motion-reduce:transform-none">
                {entry.label}
              </span>
            </TableCell>
            <TableCell className="text-right pr-8 py-4">
              <div
                className={cn(
                  'font-mono text-sm font-black tracking-tighter drop-shadow-[0_0_5px_rgba(0,0,0,0.5)]',
                  entry.amount >= 0 ? 'text-arena-pop' : 'text-destructive'
                )}
              >
                {entry.amount >= 0 ? '+' : ''}
                {entry.amount.toLocaleString()}G
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

/**
 * Ledger registry.
 */
export function LedgerRegistry({ recentLedger, totalLedgerEntries }: LedgerRegistryProps) {
  return (
    <Surface
      variant="glass"
      padding="none"
      className="lg:col-span-8 border-border/10 flex flex-col relative overflow-hidden h-[500px]"
    >
      <RegistryHeader totalLedgerEntries={totalLedgerEntries} />

      <div className="flex-1 overflow-auto custom-scrollbar">
        <LedgerTable recentLedger={recentLedger} />
      </div>

      <div className="p-4 border-t border-white/5 bg-black/40 flex justify-center">
        <button
          aria-label="Access Full Archive"
          className="text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground hover:text-primary transition-colors opacity-40 hover:opacity-100 flex items-center gap-2 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded-none motion-reduce:transition-none"
        >
          Access Full Archive{' '}
          <ArrowDownRight className="h-3 w-3 group-hover:translate-y-0.5 transition-transform motion-reduce:transition-none motion-reduce:transform-none" />
        </button>
      </div>
    </Surface>
  );
}
