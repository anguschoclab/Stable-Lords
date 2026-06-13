import { motion } from 'framer-motion';
import { CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Surface } from '@/components/ui/Surface';
import { Star, Users } from 'lucide-react';
import { InducteeCard } from '../InducteeCard';
import { AwardIcon } from './AwardIcon';
import FightsList from '@/components/awards/FightsList';
import UpsetsList, { type UpsetEntry } from '@/components/awards/UpsetsList';
import type { AnnualAward } from '@/types/game';
import type { Warrior } from '@/types/game';
import type { Owner } from '@/types/state.types';

interface YearAwardsSectionProps {
  year: number;
  awards: AnnualAward[];
  warriorById: Map<string, Warrior>;
  player: Owner;
  yearFights: Parameters<typeof FightsList>[0]['fights'];
  yearUpsets: UpsetEntry[];
}

export function YearAwardsSection({
  year,
  awards,
  warriorById,
  player,
  yearFights,
  yearUpsets,
}: YearAwardsSectionProps) {
  return (
    <article className="space-y-6">
      <div className="flex items-end gap-3 border-b-2 border-accent/30 pb-2">
        <h2 className="font-display text-xl text-foreground leading-none flex items-center gap-2 uppercase tracking-tighter">
          <Star className="h-5 w-5 text-arena-gold" /> Year {year} Accolades
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {awards.map((award, i) => {
          if (award.type === 'STABLE_OF_YEAR') {
            return (
              <motion.div key={i} whileHover={{ y: -5 }}>
                <Surface
                  variant="gold"
                  padding="none"
                  className="overflow-hidden relative group h-full"
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-primary opacity-40" />
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-none border bg-primary/10 border-primary/30">
                            <Users className="h-4 w-4 text-primary" />
                          </div>
                          <span className="font-display font-black text-xl uppercase tracking-tighter text-foreground group-hover:text-primary transition-colors">
                            {award.stableName}
                          </span>
                        </div>
                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
                          Leader:{' '}
                          {player.stableName === award.stableName ? player.name : 'Rival Owner'}
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className="text-[9px] font-black tracking-widest uppercase text-primary border-primary/20 py-1 px-2"
                      >
                        Stable of the Year
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground italic border-l-2 border-primary/20 pl-3 py-1">
                      &quot;{award.reason}&quot;
                    </p>
                  </CardContent>
                </Surface>
              </motion.div>
            );
          }
          const warrior = warriorById.get(award.warriorId as string);
          if (!warrior) return null;
          return (
            <InducteeCard
              key={i}
              warrior={warrior}
              title={award.type.replace(/_/g, ' ')}
              icon={<AwardIcon type={award.type} />}
              fights={yearFights}
            />
          );
        })}
      </div>

      {yearFights.length > 0 && (
        <div className="border-t border-border/20 pt-4 space-y-3">
          <FightsList fights={yearFights} />
          <UpsetsList upsets={yearUpsets} />
        </div>
      )}
    </article>
  );
}
