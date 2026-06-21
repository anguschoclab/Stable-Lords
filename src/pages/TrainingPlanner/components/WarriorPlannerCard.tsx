import { useMemo } from 'react';
import { Surface } from '@/components/ui/Surface';
import { StatBadge } from '@/components/ui/WarriorBadges';
import { ImperialRing } from '@/components/ui/ImperialRing';
import { Activity, Star, Dumbbell } from 'lucide-react';
import { ATTRIBUTE_KEYS, type Attributes } from '@/types/shared.types';
import type { Warrior } from '@/types/state.types';
import type { Trainer } from '@/types/shared.types';
import { computeGainChance } from '@/engine/training';
import { potentialRating, potentialGrade, diminishingReturnsFactor } from '@/engine/potential';
import { assessBurnRisks, computeTrainability } from '@/engine/training/burnAnalysis';
import { AttributeRow } from './AttributeRow';
import { BurnWarnings } from './BurnWarnings';

interface WarriorPlannerCardProps {
  warrior: Warrior;
  trainers: Trainer[];
  seasonalGains: Partial<Record<keyof Attributes, number>>;
}

/**
 *
 */
export function WarriorPlannerCard({ warrior, trainers, seasonalGains }: WarriorPlannerCardProps) {
  const burns = useMemo(() => assessBurnRisks(warrior, trainers), [warrior, trainers]);
  const trainability = useMemo(() => computeTrainability(warrior, trainers), [warrior, trainers]);
  const potRating = warrior.potential ? potentialRating(warrior.potential) : null;
  const potGrade = potRating !== null ? potentialGrade(potRating) : null;

  const ranked = ATTRIBUTE_KEYS.filter((k): k is Exclude<keyof Attributes, 'SZ'> => k !== 'SZ')
    .map((k) => ({
      key: k as keyof Attributes,
      val: warrior.attributes[k],
      pot: warrior.potential?.[k],
      chance: computeGainChance(warrior, k, trainers),
      seasonGain: seasonalGains[k] ?? 0,
      capped:
        warrior.attributes[k] >= 25 ||
        (warrior.potential?.[k] !== undefined &&
          warrior.attributes[k] >= (warrior.potential?.[k] ?? 0)),
      seasonCapped: (seasonalGains[k] ?? 0) >= 3,
      drFactor: diminishingReturnsFactor(warrior.attributes[k], warrior.potential?.[k]),
    }))
    .sort((a, b) => {
      if (a.capped && !b.capped) return 1;
      if (!a.capped && b.capped) return -1;
      return b.chance - a.chance;
    });

  return (
    <div className="space-y-12">
      <Surface variant="glass" className="p-8 border-white/5 space-y-8">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-6">
            <ImperialRing size="md" variant="bronze">
              <Activity className="h-5 w-5 text-muted-foreground/40" />
            </ImperialRing>
            <div>
              <h2 className="text-2xl font-display font-black uppercase tracking-tight text-foreground leading-none mb-2">
                {warrior.name}
              </h2>
              <div className="flex items-center gap-4">
                <StatBadge styleName={warrior.style} showFullName />
                <span className="text-[10px] text-muted-foreground/40 uppercase tracking-widest font-black">
                  Age {warrior.age}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40">
                Potential Index
              </span>
              <div className="flex items-center gap-3">
                <Star className="h-4 w-4 text-arena-gold" />
                <span className="text-xl font-display font-black text-arena-gold">{potGrade}</span>
              </div>
            </div>
            <div className="text-right border-l border-white/5 pl-6">
              <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40">
                Trainability
              </span>
              <div className="flex items-center gap-3">
                <Dumbbell className="h-4 w-4 text-primary" />
                <span className="text-xl font-display font-black text-foreground">
                  {trainability}%
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {ranked.map((attr) => (
            <AttributeRow key={attr.key} attr={attr} />
          ))}
        </div>

        <BurnWarnings burns={burns} />
      </Surface>
    </div>
  );
}
