import { Star } from 'lucide-react';
import { BookmarkButton } from '@/components/bookmarks/BookmarkButton';
import { cn } from '@/lib/utils';
import { Surface } from '@/components/ui/Surface';
import { StatBadge, WarriorNameTag } from '@/components/ui/WarriorBadges';
import { FAME_STAR_THRESHOLD } from '@/constants/training';
import { type FightingStyle } from '@/types/game';
import type { AttributePotential, CareerRecord, InjuryData, Warrior } from '@/types/warrior.types';
import type { Attributes } from '@/types/shared.types';
import { TraitBadge } from '@/components/warrior/traits/TraitBadge';
import { RankStrip } from './RankStrip';
import { PotentialBadge } from './PotentialBadge';
import { LiabilityBadge } from './LiabilityBadge';
import { AttributeMatrix } from './AttributeMatrix';
import { TacticalSummary } from './TacticalSummary';

interface RosterWarriorRowProps {
  warrior: {
    id: string;
    name: string;
    fame: number;
    style: string;
    champion: boolean;
    potential?: AttributePotential | null;
    attributes: Attributes;
    career: CareerRecord;
    injuries?: InjuryData[];
    flair?: string[];
    traits?: string[];
    age?: number;
  };
  rankIndex: number;
  onClick: () => void;
}

export function RosterWarriorRow({ warrior, rankIndex, onClick }: RosterWarriorRowProps) {
  const fights = warrior.career.wins + warrior.career.losses;
  const winRate = fights > 0 ? Math.round((warrior.career.wins / fights) * 100) : 0;
  const injuryCount = (warrior.injuries ?? []).length;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className="w-full relative group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      aria-label={`View profile for ${warrior.name}`}
    >
      <Surface
        variant="paper"
        padding="none"
        className="flex flex-col md:flex-row items-stretch border border-white/5 bg-background/90 transition-all motion-reduce:transition-none motion-reduce:transform-none duration-500 group-hover:border-primary/40 group-hover:shadow-[0_0_30px_rgba(var(--primary-rgb),0.1)]"
      >
        <RankStrip rankIndex={rankIndex} />

        {/* Main Body */}
        <div className="flex-1 p-6 flex flex-col md:flex-row gap-8">
          {/* Personnel Info */}
          <div className="flex-1 min-w-0 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <WarriorNameTag
                  id={warrior.id}
                  name={warrior.name}
                  isChampion={warrior.champion}
                  injuryCount={injuryCount}
                  useCrown
                />
                <div className="flex items-center gap-3">
                  <StatBadge styleName={warrior.style as FightingStyle} career={warrior.career} />
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-none bg-black border border-white/5 opacity-80 group-hover:border-primary/30 group-hover:opacity-100 transition-all motion-reduce:transition-none motion-reduce:transform-none">
                    <Star
                      className={cn(
                        'h-3 w-3',
                        warrior.fame > FAME_STAR_THRESHOLD
                          ? 'text-arena-gold'
                          : 'text-muted-foreground/60'
                      )}
                    />
                    <span
                      className={cn(
                        'text-[10px] font-mono font-black',
                        warrior.fame > FAME_STAR_THRESHOLD
                          ? 'text-arena-gold'
                          : 'text-muted-foreground'
                      )}
                    >
                      {warrior.fame}G
                    </span>
                  </div>
                  <PotentialBadge potential={warrior.potential} />
                  {warrior.traits && <LiabilityBadge warrior={warrior as Warrior} />}
                  {warrior.traits?.slice(0, 3).map((t) => (
                    <TraitBadge key={t} traitId={t} className="text-[8px]" />
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <BookmarkButton entityType="warrior" entityId={warrior.id} size="sm" />
                <div className="flex items-center gap-6 px-6 py-3 rounded-none bg-black/40 border border-white/5 group-hover:border-primary/10 transition-all motion-reduce:transition-none motion-reduce:transform-none">
                  <div className="text-center">
                    <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground opacity-40 block mb-0.5">
                      Victory
                    </span>
                    <span className="font-mono font-black text-primary text-sm">{winRate}%</span>
                  </div>
                  <div className="h-8 w-px bg-white/5" />
                  <div className="text-center">
                    <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground opacity-40 block mb-0.5">
                      Kills
                    </span>
                    <span
                      className={cn(
                        'font-mono font-black text-sm',
                        warrior.career.kills > 0 ? 'text-destructive' : 'text-muted-foreground/40'
                      )}
                    >
                      {warrior.career.kills}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <AttributeMatrix attributes={warrior.attributes} />
          </div>

          <TacticalSummary injuryCount={injuryCount} />
        </div>
      </Surface>
    </div>
  );
}
