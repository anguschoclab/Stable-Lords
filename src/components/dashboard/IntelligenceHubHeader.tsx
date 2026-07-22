import { Newspaper } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface IntelligenceHubHeaderProps {
  totalCommCount: number;
}

/**
 *
 */
export function IntelligenceHubHeader({ totalCommCount }: IntelligenceHubHeaderProps) {
  return (
    <div className="p-6 border-b border-white/5 bg-neutral-900/40 relative z-10 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="p-2.5 rounded-none bg-primary/10 border border-primary/20 shadow-[0_0_15px_rgba(var(--primary-rgb),0.1)]">
          <Newspaper className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-display text-base font-black uppercase tracking-tight">
            Arena Chronicle
          </h3>
          <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest opacity-40">
            News & Reports
          </p>
        </div>
      </div>
      <Badge
        variant="outline"
        className="text-[9px] font-mono font-black border-white/10 bg-white/5 text-muted-foreground/60 h-7 px-3 tracking-widest uppercase"
      >
        {totalCommCount.toString().padStart(2, '0')} ENTRIES
      </Badge>
    </div>
  );
}
