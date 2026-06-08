import { ChevronDown, ChevronUp } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import BoutViewer from '@/components/BoutViewer';
import { Badge } from '@/components/ui/badge';
import type { BoutResult } from '@/engine/boutProcessor';
import { cn } from '@/lib/utils';
import { Surface } from '@/components/ui/Surface';
import { OutcomeIcon } from './OutcomeIcon';

interface BoutRowProps {
  res: BoutResult;
  id: string;
  isExpanded: boolean;
  onToggleExpand: (id: string | null) => void;
}

export function BoutRow({ res, id, isExpanded, onToggleExpand }: BoutRowProps) {
  const isWinnerA = res.outcome.winner === 'A';
  const isWinnerD = res.outcome.winner === 'D';

  return (
    <Collapsible open={isExpanded} onOpenChange={() => onToggleExpand(isExpanded ? null : id)}>
      <Surface
        variant="glass"
        padding="none"
        className={cn(
          'border-white/5 transition-all overflow-hidden',
          isExpanded
            ? 'border-primary/40 shadow-[0_0_20px_rgba(var(--primary-rgb),0.1)]'
            : 'hover:border-white/20'
        )}
      >
        <CollapsibleTrigger asChild>
          <div className="p-4 cursor-pointer flex items-center justify-between group">
            <div className="flex items-center gap-6 flex-1">
              <div className="flex items-center gap-3 min-w-36">
                <div
                  className={cn(
                    'w-1.5 h-6 rounded-none',
                    isWinnerA
                      ? 'bg-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]'
                      : 'bg-white/5'
                  )}
                />
                <span
                  className={cn(
                    'font-display font-black uppercase text-xs tracking-tight',
                    isWinnerA ? 'text-primary' : 'text-muted-foreground/40'
                  )}
                >
                  {res.a.name}
                </span>
              </div>

              <div className="flex flex-col items-center gap-1.5 px-4">
                <span className="text-[8px] font-black text-muted-foreground/20 uppercase tracking-[0.3em]">
                  VS
                </span>
                <Badge
                  variant="outline"
                  className="text-[8px] font-black uppercase tracking-widest h-4 bg-white/[0.02] border-white/5 px-2"
                >
                  {res.outcome.by}
                </Badge>
              </div>

              <div className="flex items-center gap-3 min-w-36 justify-end text-right">
                <span
                  className={cn(
                    'font-display font-black uppercase text-xs tracking-tight',
                    isWinnerD ? 'text-primary' : 'text-muted-foreground/40'
                  )}
                >
                  {res.d.name}
                </span>
                <div
                  className={cn(
                    'w-1.5 h-6 rounded-none',
                    isWinnerD
                      ? 'bg-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]'
                      : 'bg-white/5'
                  )}
                />
              </div>
            </div>

            <div className="flex items-center gap-4 ml-6">
              <div className="flex items-center gap-2">
                <OutcomeIcon by={res.outcome.by} />
              </div>
              <div
                className={cn(
                  'h-8 w-8 flex items-center justify-center border border-white/5 transition-colors',
                  isExpanded
                    ? 'bg-primary/20 text-primary border-primary/40'
                    : 'bg-white/[0.02] text-muted-foreground/40 group-hover:bg-primary/10 group-hover:text-primary group-hover:border-primary/20'
                )}
              >
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </div>
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-4 pb-4 border-t border-white/5 bg-black/20 pt-4">
            <BoutViewer
              nameA={res.a.name}
              nameD={res.d.name}
              styleA={res.a.style}
              styleD={res.d.style}
              log={res.outcome.log}
              winner={res.outcome.winner}
              by={res.outcome.by}
              isRivalry={res.isRivalry}
            />
          </div>
        </CollapsibleContent>
      </Surface>
    </Collapsible>
  );
}
