import { useMemo } from 'react';
import { Link } from '@tanstack/react-router';
import { ChevronRight, Swords, Activity } from 'lucide-react';
import { useGameStore } from '@/state/useGameStore';
import { useShallow } from 'zustand/react/shallow';
import { Surface } from '@/components/ui/Surface';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { FightSummary } from '@/types/game';
import { BoutTableRow } from './BoutTableRow';
import { EmptyBoutsState } from './EmptyBoutsState';

export function RecentBoutsWidget() {
  const state = useGameStore(
    useShallow((s) => ({
      player: s.player,
      arenaHistory: s.arenaHistory,
      rivals: s.rivals,
      roster: s.roster,
      graveyard: s.graveyard,
      retired: s.retired,
    }))
  );

  const recentBouts = useMemo(() => {
    const playerStableId = state.player.id;
    const history = state.arenaHistory || [];
    const results: FightSummary[] = [];

    for (let i = 0; i < history.length; i++) {
      const bout = history[i];
      if (bout && (bout.stableIdA === playerStableId || bout.stableIdD === playerStableId)) {
        results.push(bout);
        if (results.length >= 5) break;
      }
    }
    return results;
  }, [state.arenaHistory, state.player.id]);

  return (
    <Surface
      variant="glass"
      padding="none"
      className="flex flex-col h-full border-border/10 group overflow-hidden relative md:col-span-2 shadow-2xl"
    >
      <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none group-hover:opacity-[0.05] transition-opacity">
        <Swords className="h-48 w-48 text-primary" />
      </div>

      <div className="p-6 border-b border-white/5 bg-neutral-900/40 relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-2.5 rounded-none bg-primary/10 border border-primary/20 shadow-[0_0_15px_rgba(var(--primary-rgb),0.1)]">
            <Activity className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-display text-base font-black uppercase tracking-tight">
              Deployment History
            </h3>
            <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest opacity-40">
              Recent Arena Engagements
            </p>
          </div>
        </div>
        <Badge
          variant="outline"
          className="text-[9px] font-mono font-black border-white/10 bg-white/5 text-muted-foreground/60 h-7 px-3 tracking-widest"
        >
          LAST 5 BOUTS
        </Badge>
      </div>

      <div className="flex-1 overflow-x-auto relative z-10 custom-scrollbar">
        <Table>
          <TableHeader className="bg-black/20">
            <TableRow className="hover:bg-transparent border-white/5">
              <TableHead className="w-24 font-black uppercase text-[10px] tracking-widest pl-6 py-4">
                Week
              </TableHead>
              <TableHead className="font-black uppercase text-[10px] tracking-widest text-muted-foreground/60 py-4">
                Operative
              </TableHead>
              <TableHead className="font-black uppercase text-[10px] tracking-widest text-center text-muted-foreground/60 py-4">
                Outcome
              </TableHead>
              <TableHead className="font-black uppercase text-[10px] tracking-widest text-right pr-6 py-4">
                Method
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentBouts.length === 0 ? (
              <EmptyBoutsState />
            ) : (
              recentBouts.map((bout) => (
                <BoutTableRow
                  key={bout.id}
                  bout={bout}
                  playerStableId={state.player.id}
                  state={state}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="p-4 border-t border-white/5 bg-black/40 flex justify-center relative z-10 mt-auto">
        <Link
          to="/world/chronicle"
          className="text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground hover:text-primary transition-colors opacity-40 hover:opacity-100 flex items-center gap-2 group"
        >
          Sync_Engagement_Chronicle{' '}
          <ChevronRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </Surface>
  );
}
