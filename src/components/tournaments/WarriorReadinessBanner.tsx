import { Zap } from 'lucide-react';
import { SectionDivider } from '@/components/ui/SectionDivider';
import { Surface } from '@/components/ui/Surface';
import { ImperialRing } from '@/components/ui/ImperialRing';
import type { TournamentEntry, Warrior } from '@/types/game';
import { TournamentPrizeBadge } from './TournamentPrizeBadge';
import { WarriorReadinessCard } from './WarriorReadinessCard';

interface WarriorReadinessBannerProps {
  tournament: TournamentEntry;
  warriors: Warrior[];
}

/**
 * Pre-tournament readiness banner: header (with prize badge) + grid of
 * per-warrior readiness cards.
 */
export function WarriorReadinessBanner({
  tournament,
  warriors,
}: WarriorReadinessBannerProps) {
  return (
    <div className="pt-4">
      <SectionDivider label="Warrior Readiness" />
      <Surface
        variant="glass"
        className="flex flex-col gap-6 p-6 border-l-4 border-l-primary shadow-xl"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ImperialRing size="sm" variant="blood">
              <Zap className="h-3.5 w-3.5 text-primary" />
            </ImperialRing>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/80">
              Combat Status Audit
            </span>
          </div>
          <TournamentPrizeBadge tierId={tournament.tierId} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {warriors.map((w) => (
            <WarriorReadinessCard key={w.id} warrior={w} />
          ))}
        </div>
      </Surface>
    </div>
  );
}
