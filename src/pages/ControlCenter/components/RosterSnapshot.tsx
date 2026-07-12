import { useMemo } from 'react';
import { Link } from '@tanstack/react-router';
import { useGameStore } from '@/state/useGameStore';
import { useShallow } from 'zustand/react/shallow';
import { cn } from '@/lib/utils';
import { Surface } from '@/components/ui/Surface';
import { FormSparkline } from '@/components/charts/FormSparkline';
import { STYLE_ABBREV } from '@/types/shared.types';
import { isExhausted, isFatigued } from '@/engine/core/fatigueUtils';
import { Swords, ChevronRight } from 'lucide-react';

/**
 *
 */
export function RosterSnapshot() {
  const { roster } = useGameStore(useShallow((s) => ({ roster: s.roster })));
  const active = useMemo(() => roster.filter((w) => w.status === 'Active'), [roster]);

  return (
    <div className="flex flex-col gap-3">
      {active.length === 0 && (
        <div className="text-center py-12 text-muted-foreground/40 text-sm font-black uppercase tracking-widest">
          No Active Warriors
        </div>
      )}
      {active.map((w) => {
        return (
          <Link key={w.id} to="/stable/roster" className="block group">
            <Surface variant="glass" className="p-4 hover:border-primary/20 transition-colors">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-none bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                    <Swords className="h-3.5 w-3.5 text-muted-foreground/60" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-display font-black text-sm uppercase tracking-tight truncate group-hover:text-primary transition-colors">
                      {w.name}
                    </div>
                    <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50 flex items-center gap-2">
                      <span>{STYLE_ABBREV[w.style] ?? w.style}</span>
                      <span className="opacity-30">·</span>
                      <span className="text-arena-gold">{w.fame} fame</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right hidden sm:block">
                    <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">
                      Record
                    </div>
                    <div className="font-mono font-black text-xs">
                      <span className="text-primary">{w.career?.wins ?? 0}</span>
                      <span className="text-muted-foreground/30 mx-0.5">-</span>
                      <span className="text-muted-foreground/60">{w.career?.losses ?? 0}</span>
                      {(w.career?.kills ?? 0) > 0 && (
                        <span className="text-destructive ml-1 text-[9px]">/{w.career.kills}K</span>
                      )}
                    </div>
                  </div>

                  {w.fatigue !== undefined && (
                    <div className="text-right hidden md:block">
                      <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">
                        Fatigue
                      </div>
                      <div
                        className={cn(
                          'font-mono font-black text-xs',
                          isExhausted(w.fatigue)
                            ? 'text-destructive'
                            : isFatigued(w.fatigue)
                              ? 'text-arena-gold'
                              : 'text-primary'
                        )}
                      >
                        {w.fatigue}%
                      </div>
                    </div>
                  )}

                  <FormSparkline warriorId={w.id} limit={6} />

                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-primary transition-colors" />
                </div>
              </div>
            </Surface>
          </Link>
        );
      })}
    </div>
  );
}
