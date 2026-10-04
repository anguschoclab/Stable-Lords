import {
  ATTRIBUTE_KEYS,
  type Warrior,
  type TrainingAssignment,
  type Attributes,
} from '@/types/game';
import { Button } from '@/components/ui/button';
import { Heart, X, Gauge, ShieldCheck } from 'lucide-react';
import { ATTRIBUTE_TOTAL_CAP } from '@/constants/training';
import { hasInjuries } from '@/engine/injuries/utils';
import { Surface } from '@/components/ui/Surface';
import { cn } from '@/lib/utils';
import { TrainingCardHeader } from './TrainingCardHeader';
import { AttributeRow } from './AttributeRow';
import { TraitTrainingSection } from './TraitTrainingSection';
import type { Trainer } from '@/types/shared.types';
import type { WarriorTrainingAdvice } from '@/engine/advisor/types';

/** Recovery toggle for an injured warrior; highlighted when the council recommends rest. */
function RecoveryButton({
  isRecovery,
  advisorRecommended,
  onAssignRecovery,
  onClear,
}: {
  isRecovery: boolean;
  advisorRecommended: boolean;
  onAssignRecovery: () => void;
  onClear: () => void;
}) {
  return (
    <Button
      variant="outline"
      onClick={isRecovery ? onClear : onAssignRecovery}
      className={cn(
        'w-full h-10 gap-2 border-white/5 transition-all motion-reduce:transition-none motion-reduce:transform-none text-[10px] font-black uppercase tracking-[0.2em]',
        isRecovery
          ? 'bg-destructive/20 text-destructive border-destructive/40 shadow-[0_0_15px_-5px_rgba(239,68,68,0.4)]'
          : advisorRecommended
            ? 'bg-arena-gold/10 border-arena-gold/40 text-foreground hover:bg-arena-gold/20 shadow-[0_0_10px_-4px_rgba(217,119,6,0.3)]'
            : 'bg-white/5 hover:bg-white/10'
      )}
    >
      <Heart className={cn('h-3.5 w-3.5', isRecovery ? 'text-destructive' : 'text-destructive')} />
      <span>{isRecovery ? 'CANCEL RECOVERY' : 'ACTIVE RECOVERY'}</span>
      {advisorRecommended && (
        <span
          data-testid="advisor-recovery-badge"
          className="ml-auto text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-sm bg-arena-gold/20 text-arena-gold border border-arena-gold/40 flex items-center gap-1"
        >
          <ShieldCheck className="h-2.5 w-2.5" />
          Council Pick
        </span>
      )}
    </Button>
  );
}

/** Footer strip showing the active assignment with a terminate action. */
function AssignmentFooter({
  assignment,
  isRecovery,
  onClear,
}: {
  assignment: TrainingAssignment;
  isRecovery: boolean;
  onClear: () => void;
}) {
  return (
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
  );
}

/** Per-warrior training card: header, recovery toggle, attribute rows, trait section. */
export function WarriorTrainingCard(props: {
  warrior: Warrior;
  assignment?: TrainingAssignment;
  seasonalGains: Partial<Record<keyof Attributes, number>>;
  trainers: Trainer[];
  onAssign: (attr: keyof Attributes) => void;
  onAssignRecovery: () => void;
  onClear: () => void;
  onAssignTraitTraining?: (trainerId: string) => void;
  advisorAdvice?: WarriorTrainingAdvice;
}) {
  const { warrior, assignment, seasonalGains, trainers, onAssign } = props;
  const { onAssignRecovery, onClear, onAssignTraitTraining, advisorAdvice } = props;
  const total = ATTRIBUTE_KEYS.reduce((sum, k) => sum + warrior.attributes[k], 0);
  const atCap = total >= ATTRIBUTE_TOTAL_CAP;
  const hasInjury = hasInjuries(warrior);
  const isRecovery = assignment?.type === 'recovery';
  const isTraining = assignment?.type === 'attribute';

  return (
    <Surface variant="glass" className="overflow-hidden flex flex-col group h-full">
      <TrainingCardHeader
        warrior={warrior}
        total={total}
        hasInjury={hasInjury}
        trainers={trainers}
      />

      <div className="p-4 flex-1 space-y-4">
        {hasInjury && !isTraining && (
          <RecoveryButton
            isRecovery={isRecovery}
            advisorRecommended={advisorAdvice?.mode === 'recovery'}
            onAssignRecovery={onAssignRecovery}
            onClear={onClear}
          />
        )}

        {!isRecovery && (
          <AttributeRows
            warrior={warrior}
            assignment={assignment}
            seasonalGains={seasonalGains}
            trainers={trainers}
            atCap={atCap}
            onAssign={onAssign}
            advisorAdvice={advisorAdvice}
          />
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
        <AssignmentFooter assignment={assignment} isRecovery={isRecovery} onClear={onClear} />
      )}
    </Surface>
  );
}

/** The seven assignable attribute rows, advisor-recommendation marked. */
function AttributeRows(props: {
  warrior: Warrior;
  assignment?: TrainingAssignment;
  seasonalGains: Partial<Record<keyof Attributes, number>>;
  trainers: Trainer[];
  atCap: boolean;
  onAssign: (attr: keyof Attributes) => void;
  advisorAdvice?: WarriorTrainingAdvice;
}) {
  const { warrior, assignment, seasonalGains, trainers, atCap } = props;
  const { onAssign, advisorAdvice } = props;
  return (
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
          isAdvisorRecommended={
            advisorAdvice?.mode === 'attribute' && advisorAdvice.targetAttribute === key
          }
        />
      ))}
    </div>
  );
}
