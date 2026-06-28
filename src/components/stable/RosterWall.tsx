import { useState, useMemo } from 'react';
import { useNavigate, Link } from '@tanstack/react-router';
import { Surface } from '@/components/ui/Surface';
import { Button } from '@/components/ui/button';
import { Users, ChevronRight, Swords } from 'lucide-react';
import { motion } from 'framer-motion';
import { useActiveRoster } from '@/hooks/useActiveRoster';
import { useGameStore, useBookmarks } from '@/state/useGameStore';
import { BookmarkFilterToggle } from '@/components/bookmarks/BookmarkFilterToggle';
import { RosterWarriorRow } from './RosterWarriorRow';
import { StyleCompositionDonut } from './StyleCompositionDonut';
import type { FightingStyle } from '@/types/shared.types';

function EmptyRosterState() {
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
        <p className="text-sm font-display font-black uppercase tracking-[0.2em] text-muted-foreground">
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

/**
 *
 */
export function RosterWall() {
  const navigate = useNavigate();
  const sortedRoster = useActiveRoster();
  const isBookmarked = useGameStore((s) => s.isBookmarked);
  const bookmarks = useBookmarks();
  const [showBookmarkedOnly, setShowBookmarkedOnly] = useState(false);

  const filteredRoster = useMemo(() => {
    if (!showBookmarkedOnly) return sortedRoster;
    return sortedRoster.filter((w) => isBookmarked('warrior', w.id));
  }, [sortedRoster, showBookmarkedOnly, isBookmarked, bookmarks]);

  const rosterStyles = useMemo(
    () => sortedRoster.map((w) => w.style as FightingStyle),
    [sortedRoster]
  );

  return (
    <Surface variant="glass" padding="none" className="border-border/10 relative shadow-2xl">
      <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-primary/40 via-arena-gold/40 to-primary/40 opacity-30" />

      <div className="p-8 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-neutral-900/40 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-none bg-primary/10 border border-primary/20 shadow-[0_0_15px_rgba(var(--primary-rgb),0.2)]">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="font-display text-base font-black uppercase tracking-tight">Roster</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[9px] text-muted-foreground font-black uppercase tracking-[0.2em] opacity-60">
                Warriors: {sortedRoster.length}
              </span>
              <div className="h-1 w-1 rounded-full bg-primary animate-pulse" />
              {sortedRoster.length > 0 && (
                <StyleCompositionDonut styles={rosterStyles} size={28} className="ml-1 opacity-70 hover:opacity-100 transition-opacity" />
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <BookmarkFilterToggle
            active={showBookmarkedOnly}
            onToggle={() => setShowBookmarkedOnly((v) => !v)}
          />
          <Link to="/stable/recruit">
            <Button variant="outline" size="sm">
              Initialize Recruitment <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      <div className="p-8">
        {filteredRoster.length === 0 ? (
          <EmptyRosterState />
        ) : (
          <div className="grid gap-6">
              {filteredRoster.map((w, i) => (
                <motion.div
                  key={w.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i, 8) * 0.05, duration: 0.5 }}
                >
                  <RosterWarriorRow
                    warrior={w}
                    rankIndex={i}
                    onClick={() => navigate({ to: '/warrior/$id', params: { id: w.id } })}
                  />
                </motion.div>
              ))}
          </div>
        )}
      </div>
    </Surface>
  );
}
