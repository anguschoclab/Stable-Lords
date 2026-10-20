import { Link } from '@tanstack/react-router';
import { Surface } from '@/components/ui/Surface';
import { Button } from '@/components/ui/button';
import { Users, ChevronRight, Swords } from 'lucide-react';
import { motion } from 'framer-motion';
import { BookmarkFilterToggle } from '@/components/bookmarks/BookmarkFilterToggle';
import { RosterWarriorRow } from '../RosterWarriorRow';
import { StyleCompositionDonut } from '../StyleCompositionDonut';
import type { FightingStyle } from '@/types/shared.types';
import { buildContenderIndex } from '@/engine/championship/arenaChampionship';
import { getArenaById } from '@/data/arenas';
import type { GameState } from '@/types/state.types';
import type { useActiveRoster } from '@/hooks/useActiveRoster';

export function EmptyRosterState() {
  return (
    <Surface
      variant="glass"
      className="py-24 text-center border-dashed border-border/40 flex flex-col items-center gap-6"
    >
      <div className="relative">
        <div className="absolute inset-0 bg-primary/10 blur-2xl rounded-full" />
        <Swords className="h-16 w-16 text-muted-foreground opacity-20 relative z-10" />
      </div>
      <div className="space-y-2">
        <p className="text-sm font-display font-black uppercase tracking-[0.15em] text-muted-foreground">
          No Warriors
        </p>
        <p className="text-xs text-muted-foreground/60 italic max-w-sm mx-auto leading-relaxed">
          Your roster is empty. Visit the recruiting grounds to sign your first warrior.
        </p>
      </div>
      <Link to="/stable/recruit" className="mt-4">
        <Button>Recruit Warriors</Button>
      </Link>
    </Surface>
  );
}

/** Wall header: roster count, style donut, bookmark filter, recruit CTA. */
export function WallHeader({
  rosterSize,
  rosterStyles,
  showBookmarkedOnly,
  onToggleBookmarked,
}: {
  rosterSize: number;
  rosterStyles: FightingStyle[];
  showBookmarkedOnly: boolean;
  onToggleBookmarked: () => void;
}) {
  return (
    <div className="p-8 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-neutral-900/40 backdrop-blur-md">
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-none bg-primary/10 border border-primary/20 shadow-[0_0_15px_rgba(var(--primary-rgb),0.2)]">
          <Users className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h3 className="font-display text-base font-black uppercase tracking-tight">Roster</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[9px] text-muted-foreground font-black uppercase tracking-[0.15em] opacity-60">
              Warriors: {rosterSize}
            </span>
            <div className="h-1 w-1 rounded-full bg-primary animate-pulse motion-reduce:animate-none" />
            {rosterSize > 0 && (
              <StyleCompositionDonut
                styles={rosterStyles}
                size={28}
                className="ml-1 opacity-70 hover:opacity-100 transition-opacity motion-reduce:transition-none"
              />
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <BookmarkFilterToggle active={showBookmarkedOnly} onToggle={onToggleBookmarked} />
        <Link to="/stable/recruit">
          <Button variant="outline" size="sm">
            Initialize Recruitment <ChevronRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}

// warriorId → best contender standing across arenas (same index rival AI
// campaigns against — the chip shows real ladder position, not decoration).
export function buildContenderBadges(state: GameState) {
  const index = buildContenderIndex(state);
  const badges = new Map<string, { arenaName: string; rank: number }>();
  for (const [arenaId, ids] of index) {
    ids.forEach((wId, i) => {
      const rank = i + 1;
      const existing = badges.get(wId);
      if (!existing || rank < existing.rank) {
        badges.set(wId, { arenaName: getArenaById(arenaId).name, rank });
      }
    });
  }
  return badges;
}

/** Animated roster-row grid (or the empty state when nothing matches). */
export function RosterRows({
  warriors,
  contenderBadges,
  onSelect,
}: {
  warriors: ReturnType<typeof useActiveRoster>;
  contenderBadges: Map<string, { arenaName: string; rank: number }>;
  onSelect: (id: string) => void;
}) {
  if (warriors.length === 0) return <EmptyRosterState />;
  return (
    <div className="grid gap-6">
      {warriors.map((w, i) => (
        <motion.div
          key={w.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: Math.min(i, 8) * 0.05, duration: 0.5 }}
        >
          <RosterWarriorRow
            warrior={w}
            rankIndex={i}
            onClick={() => onSelect(w.id)}
            contenderBadge={contenderBadges.get(w.id)}
          />
        </motion.div>
      ))}
    </div>
  );
}
