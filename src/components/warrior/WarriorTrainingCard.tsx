import {
  ATTRIBUTE_KEYS,
  type Warrior,
  type TrainingAssignment,
  type Attributes,
} from '@/types/game';
import { Button } from '@/components/ui/button';
import { Heart, X, Gauge } from 'lucide-react';
import { ATTRIBUTE_TOTAL_CAP } from '@/constants/training';
import { Surface } from '@/components/ui/Surface';
import { cn } from '@/lib/utils';
import { TrainingCardHeader } from './TrainingCardHeader';
import { AttributeRow } from './AttributeRow';
import { TraitTrainingSection } from './TraitTrainingSection';
import type { Trainer } from '@/types/shared.types';

export function WarriorTrainingCard({
  warrior,
  assignment,
  seasonalGains,
  trainers,
  onAssign,
  onAssignRecovery,
  onClear,
  onAssignTraitTraining,
}: {
  warrior: Warrior;
  assignment?: TrainingAssignment;
  seasonalGains: Partial<Record<keyof Attributes, number>>;
  trainers: Trainer[];
  onAssign: (attr: keyof Attributes) => void;
  onAssignRecovery: () => void;
  onClear: () => void;
  onAssignTraitTraining?: (trainerId: string) => void;
}) {
  const total = ATTRIBUTE_KEYS.reduce((sum, k) => sum + warrior.attributes[k], 0);
  const atCap = total >= ATTRIBUTE_TOTAL_CAP;
  const hasInjury = warrior.injuries.length > 0;
  const isRecovery = assignment?.type === 'recovery';
  const isTraining = assignment?.type === 'attribute';

  return (
    <Surface variant="glass" className="overflow-hidden flex flex-col group h-full">
      <TrainingCardHeader warrior={warrior} total={total} hasInjury={hasInjury} />

      <div className="p-4 flex-1 space-y-4">
        {hasInjury && !isTraining && (
          <Button
            variant="outline"
            onClick={isRecovery ? onClear : onAssignRecovery}
            className={cn(
              'w-full h-10 gap-2 border-white/5 transition-all text-[10px] font-black uppercase tracking-[0.2em]',
              isRecovery
                ? 'bg-destructive/20 text-destructive border-destructive/40 shadow-[0_0_15px_-5px_rgba(239,68,68,0.4)]'
                : 'bg-white/5 hover:bg-white/10'
            )}
          >
            <Heart
              className={cn('h-3.5 w-3.5', isRecovery ? 'text-destructive' : 'text-destructive')}
            />
            {isRecovery ? 'CANCEL RECOVERY' : 'ACTIVE RECOVERY'}
          </Button>
        )}

        {!isRecovery && (
          <div className="space-y-1">
            {ATTRIBUTE_KEYS.map((key) => (
              <AttributeRow
                key={key}
                warrior={warrior}
                attributeKey={key}
                assignment={assignment}
                seasonalGains={seasonalGains}
                trainers={trainers}
                atCap={atCap}
                onAssign={onAssign}
              />
            ))}
          </div>
        )}
      </div>

      <TraitTrainingSection
        warrior={warrior}
        assignment={assignment}
        isRecovery={isRecovery}
        trainers={trainers}
        onAssignTraitTraining={onAssignTraitTraining}
        onClear={onClear}
      />

      {assignment && (
        <div className="p-4 bg-white/5 border-t border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gauge className="h-3.5 w-3.5 text-primary opacity-60" />
            <span className="text-[10px] font-black uppercase tracking-widest opacity-60">
              {isRecovery ? 'REST MODE' : `CORE DRILL: ${assignment.attribute}`}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="h-8 group-hover:bg-destructive/10 group-hover:text-destructive text-[10px] font-black tracking-widest uppercase"
          >
            <X className="h-3 w-3 mr-1.5" /> TERMINATE
          </Button>
        </div>
      )}
    </Surface>
  );
}
