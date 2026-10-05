import { computeWeeklyBreakdown } from '@/engine/economy';
import { Surface } from '@/components/ui/Surface';
import { Badge } from '@/components/ui/badge';
import { BarChart3, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FiscalTrajectoryMonitorProps {
  breakdown: ReturnType<typeof computeWeeklyBreakdown>;
  week: number;
}

/**
 * Fiscal trajectory monitor.
 */
export function FiscalTrajectoryMonitor({ breakdown, week }: FiscalTrajectoryMonitorProps) {
  return (
    <Surface
      variant="glass"
      className="lg:col-span-4 border-primary/10 relative overflow-hidden flex flex-col"
    >
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/40 via-primary/10 to-transparent" />

      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-none bg-primary/10 border border-primary/20 shadow-[0_0_15px_rgba(var(--primary-rgb),0.1)]">
            <BarChart3 className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="font-display text-sm font-black uppercase tracking-tight">
              Fiscal Trajectory
            </h3>
            <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest opacity-40">
              Operating Liquidity · WK {week.toString().padStart(2, '0')}
            </p>
          </div>
        </div>
        {breakdown.net >= 0 ? (
          <Badge className="bg-arena-pop/20 text-arena-pop border-arena-pop/30 font-black text-[9px] tracking-widest uppercase">
            Solvent
          </Badge>
        ) : (
          <Badge className="bg-destructive/20 text-destructive border-destructive/30 font-black text-[9px] tracking-widest uppercase">
            Impaired
          </Badge>
        )}
      </div>

      <div className="space-y-8 flex-1">
        <LedgerStream
          icon={<ArrowUpRight className="h-3 w-3 text-arena-pop" />}
          title="Revenue Streams"
          items={breakdown.income}
          emptyLabel="No active revenue"
          amountClass="text-arena-pop"
          amountPrefix="+"
        />
        <LedgerStream
          icon={<ArrowDownRight className="h-3 w-3 text-destructive" />}
          title="Expenses"
          items={breakdown.expenses}
          emptyLabel="No active debits"
          amountClass="text-destructive"
          amountPrefix="-"
        />
      </div>

      <NetFluxFooter net={breakdown.net} />
    </Surface>
  );
}

interface LedgerStreamItem {
  label: string;
  amount: number;
}

/** Titled list of income/expense line items with an empty state. */
function LedgerStream(props: {
  icon: React.ReactNode;
  title: string;
  items: LedgerStreamItem[];
  emptyLabel: string;
  amountClass: string;
  amountPrefix: string;
}) {
  const { icon, title, items, emptyLabel, amountClass } = props;
  const { amountPrefix } = props;
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
          {title}
        </span>
        <div className="h-px flex-1 bg-white/5" />
      </div>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div
            key={`${item.label}-${i}`}
            className="flex justify-between items-center group/item hover:bg-white/2 p-1.5 rounded-none transition-colors motion-reduce:transition-none"
          >
            <span className="text-[11px] font-medium text-foreground/70 group-hover/item:text-foreground">
              {item.label}
            </span>
            <span className={cn('font-mono font-black text-xs', amountClass)}>
              {amountPrefix}
              {item.amount}G
            </span>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-[10px] text-muted-foreground/30 italic uppercase tracking-widest py-2 text-center">
            {emptyLabel}
          </p>
        )}
      </div>
    </div>
  );
}

/** Projected weekly net footer. */
function NetFluxFooter({ net }: { net: number }) {
  return (
    <div className="mt-8 pt-6 border-t border-white/5">
      <Surface
        variant="paper"
        padding="sm"
        className="bg-black/40 border border-white/5 flex justify-between items-center group hover:border-primary/30 transition-all motion-reduce:transition-none motion-reduce:transform-none"
      >
        <div className="flex flex-col">
          <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-[0.3em] opacity-40">
            Weekly Net Flux
          </span>
          <span className="text-xs font-black uppercase tracking-widest text-foreground group-hover:text-primary transition-colors motion-reduce:transition-none">
            Projected Net
          </span>
        </div>
        <div
          className={cn(
            'text-2xl font-mono font-black drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]',
            net >= 0 ? 'text-arena-pop' : 'text-destructive'
          )}
        >
          {net >= 0 ? '+' : ''}
          {net}G
        </div>
      </Surface>
    </div>
  );
}
