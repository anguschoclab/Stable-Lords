import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';
import { ATTRIBUTE_LABELS } from '@/types/shared.types';
import type { BurnWarning } from '@/engine/training/burnAnalysis';

interface BurnWarningsProps {
  burns: BurnWarning[];
}

export function BurnWarnings({ burns }: BurnWarningsProps) {
  const visibleBurns = burns.filter((b) => b.severity !== 'low');
  if (visibleBurns.length === 0) return null;

  return (
    <div className="mt-8 pt-8 border-t border-white/5 space-y-3">
      <div className="flex items-center gap-3">
        <AlertTriangle className="h-4 w-4 text-primary" />
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
          Warnings
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {visibleBurns.map((b, i) => (
          <div
            key={i}
            className={cn(
              'p-4 border bg-white/[0.01] flex items-center justify-between',
              b.severity === 'high' ? 'border-primary/20' : 'border-white/5'
            )}
          >
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">
                {ATTRIBUTE_LABELS[b.attribute]}
              </span>
              <span className="text-[10px] text-foreground font-display font-black italic">
                &quot;{b.reason}&quot;
              </span>
            </div>
            <Badge
              className={cn(
                'rounded-none text-[8px] font-black uppercase tracking-widest',
                b.severity === 'high'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-white/10 text-muted-foreground'
              )}
            >
              {b.severity} Risk
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}
