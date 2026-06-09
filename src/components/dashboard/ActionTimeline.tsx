import { History } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActionEvent {
  week: number;
  description: string;
  riskTier: string;
}

interface ActionTimelineProps {
  events: ActionEvent[];
}

/**
 *
 */
export function ActionTimeline({ events }: ActionTimelineProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-muted-foreground/40 px-1">
        <History className="w-3.5 h-3.5" />
        <span className="text-[9px] font-black uppercase tracking-widest">ACTION TIMELINE</span>
      </div>

      <div className="space-y-2 max-h-[120px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/5">
        {events && events.length > 0 ? (
          events.map((event, i) => (
            <div
              key={`${event.description.slice(0, 30)}-${i}`}
              className="flex items-start gap-3 p-2 rounded-none bg-white/5 border border-white/5 hover:bg-white/10 transition-colors"
            >
              <span className="text-[8px] font-mono text-primary mt-0.5">W{event.week}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-medium text-foreground truncate">
                  {event.description}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={cn(
                      'text-[7px] font-black uppercase px-1 rounded-none',
                      event.riskTier === 'High'
                        ? 'bg-destructive/20 text-destructive'
                        : event.riskTier === 'Medium'
                          ? 'bg-arena-gold/20 text-arena-gold'
                          : 'bg-primary/20 text-primary'
                    )}
                  >
                    {event.riskTier}_RISK
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 text-center opacity-20 italic text-[10px] uppercase font-black tracking-widest">
            No recent actions recorded.
          </div>
        )}
      </div>
    </div>
  );
}
