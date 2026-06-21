import { AlertTriangle, UserCheck } from 'lucide-react';

interface ContractPortfolioHeaderProps {
  activeCount: number;
  totalWeeklyExpense: number;
  expiringSoonCount: number;
}

/**
 *
 */
export function ContractPortfolioHeader({
  activeCount,
  totalWeeklyExpense,
  expiringSoonCount,
}: ContractPortfolioHeaderProps) {
  return (
    <div className="p-8 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-neutral-900/40 backdrop-blur-md">
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-none bg-primary/10 border border-primary/20 shadow-[0_0_15px_rgba(var(--primary-rgb),0.1)]">
          <UserCheck className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h3 className="font-display text-base font-black uppercase tracking-tight">
            Contract Ledger
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[9px] text-muted-foreground font-black uppercase tracking-[0.2em] opacity-60">
              Active Contracts: {activeCount}
            </span>
            <div className="h-1 w-1 rounded-full bg-primary animate-pulse" />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-8">
        <div className="flex flex-col items-end">
          <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-40">
            Weekly Payroll
          </span>
          <span className="font-mono font-black text-destructive text-lg">
            -{totalWeeklyExpense.toLocaleString()}G
          </span>
        </div>
        {expiringSoonCount > 0 && (
          <div className="flex flex-col items-end px-6 border-l border-white/5">
            <span className="text-[9px] font-black uppercase tracking-widest text-destructive opacity-40">
              Expiring Soon
            </span>
            <div className="flex items-center gap-2 font-mono font-black text-destructive text-lg">
              <AlertTriangle className="h-4 w-4 animate-bounce" />
              {expiringSoonCount}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
