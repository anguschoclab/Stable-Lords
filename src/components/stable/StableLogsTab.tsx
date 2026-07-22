import type { FightSummary } from '@/types/game';
import { WarriorLink } from '@/components/EntityLink';
import { Badge } from '@/components/ui/badge';
import { Surface } from '@/components/ui/Surface';
import { ImperialRing } from '@/components/ui/ImperialRing';
import { Skull } from 'lucide-react';
import { cn } from '@/lib/utils';

function getNamesFromTitle(title: string): { a: string; d: string } {
  const base = title.split(' (')[0] ?? '';
  const parts = base.split(' vs ');
  return { a: parts[0] || 'Unknown', d: parts[1] || 'Unknown' };
}

interface StableLogsTabProps {
  recentBouts: FightSummary[];
  stableWarriorIds: Set<string>;
}

/**
 *
 */
export function StableLogsTab({ recentBouts, stableWarriorIds }: StableLogsTabProps) {
  return (
    <Surface variant="glass" className="p-0 border-white/5 overflow-hidden">
      <div className="divide-y divide-white/5">
        {recentBouts.length > 0 ? (
          recentBouts.map((f) => {
            const n = getNamesFromTitle(f.title);
            const isStableA = stableWarriorIds.has(f.warriorIdA);
            const won = (f.winner === 'A' && isStableA) || (f.winner === 'D' && !isStableA);
            return (
              <div
                key={f.id}
                className="p-6 flex items-center justify-between group hover:bg-white/[0.01] transition-all motion-reduce:transition-none motion-reduce:transform-none"
              >
                <div className="flex items-center gap-8">
                  <div
                    className={cn(
                      'w-1 h-10 transition-all',
                      won
                        ? 'bg-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]'
                        : f.winner
                          ? 'bg-destructive'
                          : 'bg-white/10'
                    )}
                  />
                  <div>
                    <div className="flex items-center gap-4 mb-1.5">
                      <WarriorLink
                        name={n.a}
                        className={cn(
                          'text-[11px] font-black uppercase tracking-widest',
                          won && isStableA ? 'text-foreground' : 'text-muted-foreground/40'
                        )}
                      />
                      <span className="text-[9px] font-black text-muted-foreground/20">vs</span>
                      <WarriorLink
                        name={n.d}
                        className={cn(
                          'text-[11px] font-black uppercase tracking-widest',
                          won && !isStableA ? 'text-foreground' : 'text-muted-foreground/40'
                        )}
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/20">
                        Week {f.week}
                      </span>
                      {f.by && (
                        <Badge
                          variant="outline"
                          className="h-4 text-[8px] font-black uppercase tracking-widest px-2 py-0 border-white/5 text-muted-foreground/20"
                        >
                          {f.by.toUpperCase()}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  {f.by === 'Kill' && (
                    <ImperialRing size="sm" variant="blood">
                      <Skull className="h-3 w-3 text-primary" />
                    </ImperialRing>
                  )}
                  <span
                    className={cn(
                      'text-[10px] font-black uppercase tracking-widest',
                      won ? 'text-primary' : 'text-destructive/40'
                    )}
                  >
                    {won ? 'Victory' : 'Defeat'}
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-24 text-center text-muted-foreground/20 italic text-[10px] uppercase font-black tracking-widest">
            No bout logs recorded yet.
          </div>
        )}
      </div>
    </Surface>
  );
}
