import { useGameStore } from '@/state/useGameStore';
import { useShallow } from 'zustand/react/shallow';
import { useNavigate, Link } from '@tanstack/react-router';
import { Surface } from '@/components/ui/Surface';
import { Button } from '@/components/ui/button';
import { Users, ChevronRight, Swords } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { RosterWarriorRow } from './RosterWarriorRow';/**
                                                                                   * Roster wall.
                                                                                   * @returns The result.
                                                                                   */


/**
 * Roster wall.
 * @returns The result.
 */
export function RosterWall() {
  const navigate = useNavigate();

  const sortedRoster = useGameStore(
    useShallow((s) =>
      s.roster
        .filter((w) => w.status === 'Active')
        .map((w) => ({
          id: w.id,
          name: w.name,
          fame: w.fame,
          style: w.style,
          champion: w.champion,
          potential: w.potential,
          attributes: w.attributes,
          career: w.career,
          injuries: w.injuries,
          flair: w.flair,
        }))
        .sort((a, b) => b.fame - a.fame)
    )
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
            <h3 className="font-display text-base font-black uppercase tracking-tight">
              Active Personnel Matrix
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[9px] text-muted-foreground font-black uppercase tracking-[0.2em] opacity-60">
                Deployable Assets // Total Synced: {sortedRoster.length}
              </span>
              <div className="h-1 w-1 rounded-full bg-primary animate-pulse" />
            </div>
          </div>
        </div>

        <Link to="/ops/recruit">
          <Button variant="outline" size="sm">
            Initialize Recruitment <ChevronRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      <div className="p-8">
        {sortedRoster.length === 0 ? (
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
                Roster Data Empty
              </p>
              <p className="text-xs text-muted-foreground/60 italic max-w-sm mx-auto leading-relaxed">
                Synchronization failed. All personnel berths are currently vacant. Proceed to the
                recruitment terminal to enlist your first combatant asset.
              </p>
            </div>
            <Link to="/ops/recruit" className="mt-4">
              <Button>Initialize Sync</Button>
            </Link>
          </Surface>
        ) : (
          <div className="grid gap-6">
            <AnimatePresence mode="popLayout">
              {sortedRoster.map((w, i) => (
                <motion.div
                  key={w.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.5 }}
                >
                  <RosterWarriorRow
                    warrior={w}
                    rankIndex={i}
                    onClick={() => navigate({ to: '/warrior/$id', params: { id: w.id } })}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </Surface>
  );
}
