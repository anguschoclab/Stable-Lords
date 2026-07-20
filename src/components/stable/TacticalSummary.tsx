import { Activity, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TacticalSummaryProps {
  injuryCount: number;
}

export function TacticalSummary({ injuryCount }: TacticalSummaryProps) {
  return (
    <div className="w-full md:w-32 shrink-0 flex flex-col justify-center gap-1 border-t md:border-t-0 md:border-l border-white/5 pt-4 md:pt-0 md:pl-8">
      <div className="flex items-center justify-between md:flex-col md:items-start md:gap-4">
        <div>
          <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest opacity-40 block">
            Condition
          </span>
          <div className="flex items-center gap-1.5 mt-1">
            <Activity
              className={cn('h-3 w-3', injuryCount > 0 ? 'text-destructive' : 'text-primary')}
            />
            <span
              className={cn(
                'text-[9px] font-black uppercase tracking-widest',
                injuryCount > 0 ? 'text-destructive' : 'text-primary'
              )}
            >
              {injuryCount > 0 ? 'Compromised' : 'Nominal'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 group/btn px-4 py-1.5 rounded-none bg-white/5 border border-white/5 hover:border-primary/50 transition-all motion-reduce:transition-none motion-reduce:transform-none">
          <span className="text-[9px] font-black uppercase tracking-widest group-hover/btn:text-primary transition-colors">
            Fight Report
          </span>
          <ChevronRight className="h-3 w-3 opacity-20 group-hover/btn:opacity-100 group-hover/btn:translate-x-1 transition-all motion-reduce:transition-none motion-reduce:transform-none" />
        </div>
      </div>
    </div>
  );
}
