import { useMemo } from 'react';
import { useGameStore } from '@/state/useGameStore';
import { useShallow } from 'zustand/react/shallow';
import { Surface } from '@/components/ui/Surface';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Flame, TrendingUp } from 'lucide-react';
import {
  usePlayerRosterIds,
  useRivalWarriorStable,
  useRivalriesList,
  useMostWantedRival,
} from '@/hooks/useRivalries';
import { RivalryCard } from './RivalryCard';
import { MostWantedBanner } from './MostWantedBanner';

/**
 *
 */
export function RivalryWidget() {
  const state = useGameStore(
    useShallow((s) => ({
      roster: s.roster,
      graveyard: s.graveyard,
      rivals: s.rivals,
      arenaHistory: s.arenaHistory,
      week: s.week,
    }))
  );

  const rosterIds = usePlayerRosterIds(state);
  const rosterNames = useMemo(
    () => new Set((state.roster || []).map((w) => w.name)),
    [state.roster]
  );
  const rivalWarriorStable = useRivalWarriorStable(state);
  const rivalries = useRivalriesList(state, rosterIds, rivalWarriorStable);
  const mostWanted = useMostWantedRival(state, rosterIds, rivalWarriorStable);

  return (
    <Surface
      variant="glass"
      padding="none"
      className="md:col-span-2 border-border/10 group overflow-hidden relative flex flex-col min-h-96"
    >
      <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none group-hover:opacity-[0.05] transition-opacity">
        <Flame className="h-48 w-48 text-destructive" />
      </div>

      <div className="p-6 border-b border-white/5 bg-neutral-900/40 relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-2.5 rounded-none bg-destructive/10 border border-destructive/20 shadow-[0_0_15px_rgba(var(--destructive-rgb),0.1)]">
            <Flame className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <h3 className="font-display text-base font-black uppercase tracking-tight">
              Vendetta Registry
            </h3>
            <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest opacity-40">
              Inter-Stable Conflict Monitor
            </p>
          </div>
        </div>
        <Badge
          variant="outline"
          className="text-[9px] font-mono font-black border-white/10 bg-white/5 text-muted-foreground/60 h-7 px-3 tracking-widest"
        >
          {rivalries.length} ACTIVE FEUDS
        </Badge>
      </div>

      <div className="flex-1 overflow-y-auto relative z-10 custom-scrollbar p-6">
        {rivalries.length === 0 ? (
          <div className="py-12 text-center opacity-20 italic">
            <p className="text-[10px] uppercase tracking-[0.3em]">
              No significant vendettas detected
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {rivalries.slice(0, 4).map((r) => (
                <RivalryCard key={r.ownerId} rivalry={r} rosterNames={rosterNames} />
              ))}
            </div>

            {mostWanted && (
              <MostWantedBanner
                name={mostWanted.name}
                stable={mostWanted.stable}
                wins={mostWanted.wins}
                kills={mostWanted.kills}
              />
            )}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-white/5 bg-black/40 flex justify-center relative z-10 mt-auto">
        <Button
          variant="ghost"
          aria-label="Access Conflict Archives"
          className="text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground hover:text-destructive transition-colors opacity-40 hover:opacity-100 flex items-center gap-2 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          Access Conflict Archives{' '}
          <TrendingUp className="h-3 w-3 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
        </Button>
      </div>
    </Surface>
  );
}
