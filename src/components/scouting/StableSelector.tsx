import { Shield, Hexagon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { RivalStableData } from '@/types/game';

interface StableSelectorProps {
  rivals: RivalStableData[];
  idA: string | null;
  setIdA: (id: string | null) => void;
  idB: string | null;
  setIdB: (id: string | null) => void;
}

export function StableSelector({ rivals, idA, setIdA, idB, setIdB }: StableSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-8">
      <div className="space-y-4">
        <div className="flex items-center gap-3 px-2">
          <div className="p-1 px-2 rounded-none bg-primary/10 border border-primary/20">
            <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em]">
              Asset Alpha
            </span>
          </div>
          <div className="h-px flex-1 bg-gradient-to-r from-primary/20 via-border/20 to-transparent" />
        </div>
        <div className="grid grid-cols-1 gap-1.5 max-h-80 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          {rivals.map((r) => (
            <Tooltip key={r.owner.id}>
              <TooltipTrigger asChild>
                <button
                  aria-label={`Select ${r.owner.stableName} as Asset Alpha`}
                  onClick={() => setIdA(r.owner.id === idA ? null : r.owner.id)}
                  disabled={r.owner.id === idB}
                  className={cn(
                    'w-full text-left p-3 rounded-none border transition-all relative group/alpha outline-none',
                    idA === r.owner.id
                      ? 'border-primary bg-primary/10 shadow-[0_0_15px_rgba(var(--primary-rgb),0.2)]'
                      : r.owner.id === idB
                        ? 'border-white/5 opacity-10 cursor-not-allowed grayscale'
                        : 'border-white/5 bg-neutral-900/60 hover:border-white/20 hover:bg-white/5'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'h-8 w-8 flex items-center justify-center rounded-none border transition-all',
                          idA === r.owner.id
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-neutral-800 text-muted-foreground border-white/5'
                        )}
                      >
                        <Shield className="h-4 w-4" />
                      </div>
                      <span
                        className={cn(
                          'font-display font-black text-xs uppercase tracking-tight transition-colors',
                          idA === r.owner.id ? 'text-primary' : 'text-muted-foreground'
                        )}
                      >
                        {r.owner.stableName}
                      </span>
                    </div>
                    {idA === r.owner.id && (
                      <Hexagon className="h-3 w-3 text-primary animate-pulse" />
                    )}
                  </div>
                </button>
              </TooltipTrigger>
              <TooltipContent
                side="left"
                className="bg-neutral-950 border-white/10 text-[9px] font-black uppercase tracking-widest"
              >
                ASSIGN ALPHA
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-3 px-2 text-right">
          <div className="h-px flex-1 bg-gradient-to-l from-accent/20 via-border/20 to-transparent" />
          <div className="p-1 px-2 rounded-none bg-accent/10 border border-accent/20">
            <span className="text-[9px] font-black text-accent uppercase tracking-[0.2em]">
              Asset Beta
            </span>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-1.5 max-h-80 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          {rivals.map((r) => (
            <Tooltip key={r.owner.id}>
              <TooltipTrigger asChild>
                <button
                  aria-label={`Select ${r.owner.stableName} as Asset Beta`}
                  onClick={() => setIdB(r.owner.id === idB ? null : r.owner.id)}
                  disabled={r.owner.id === idA}
                  className={cn(
                    'w-full text-left p-3 rounded-none border transition-all relative group/beta outline-none',
                    idB === r.owner.id
                      ? 'border-accent bg-accent/10 shadow-[0_0_15px_rgba(var(--accent-rgb),0.2)]'
                      : r.owner.id === idA
                        ? 'border-white/5 opacity-10 cursor-not-allowed grayscale'
                        : 'border-white/5 bg-neutral-900/60 hover:border-white/20 hover:bg-white/5'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'h-8 w-8 flex items-center justify-center rounded-none border transition-all',
                          idB === r.owner.id
                            ? 'bg-accent text-primary-foreground border-accent'
                            : 'bg-neutral-800 text-muted-foreground border-white/5'
                        )}
                      >
                        <Shield className="h-4 w-4" />
                      </div>
                      <span
                        className={cn(
                          'font-display font-black text-xs uppercase tracking-tight transition-colors',
                          idB === r.owner.id ? 'text-accent' : 'text-muted-foreground'
                        )}
                      >
                        {r.owner.stableName}
                      </span>
                    </div>
                    {idB === r.owner.id && (
                      <Hexagon className="h-3 w-3 text-accent animate-pulse" />
                    )}
                  </div>
                </button>
              </TooltipTrigger>
              <TooltipContent
                side="right"
                className="bg-neutral-950 border-white/10 text-[9px] font-black uppercase tracking-widest"
              >
                ASSIGN BETA
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </div>
    </div>
  );
}
