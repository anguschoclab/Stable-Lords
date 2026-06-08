import type {
  PlanCondition,
  ConditionTriggerType,
} from '@/types/game';
import {
  ConditionHeader,
  ConditionTriggerSection,
  OverrideSliders,
  TacticSelectors,
  ConditionLabelInput,
} from './condition';

// Re-export constants and utility for backwards compatibility during migration
export { TRIGGER_OPTIONS, OFFENSIVE_TACTICS, DEFENSIVE_TACTICS } from '@/constants/planConditions';
export { triggerDisplayValue } from '@/utils/planConditionUtils';

interface ConditionItemProps {
  cond: PlanCondition;
  idx: number;
  removeCondition: (idx: number) => void;
  updateTrigger: (idx: number, type: ConditionTriggerType) => void;
  updateTriggerValue: (idx: number, raw: string) => void;
  updateOverrideSlider: (
    idx: number,
    key: 'OE' | 'AL' | 'killDesire',
    val: number | undefined
  ) => void;
  updateOverrideTactic: (
    idx: number,
    key: 'offensiveTactic' | 'defensiveTactic',
    val: string
  ) => void;
  updateCondition: (idx: number, partial: Partial<PlanCondition>) => void;
}

export function ConditionItem({
  cond,
  idx,
  removeCondition,
  updateTrigger,
  updateTriggerValue,
  updateOverrideSlider,
  updateOverrideTactic,
  updateCondition,
}: ConditionItemProps) {
  return (
    <div className="border border-white/10 bg-black/30 p-4 space-y-4">
      <ConditionHeader
        idx={idx}
        label={cond.label}
        onRemove={() => removeCondition(idx)}
      />

      <ConditionTriggerSection
        cond={cond}
        idx={idx}
        onTriggerChange={(type) => updateTrigger(idx, type)}
        onValueChange={(raw) => updateTriggerValue(idx, raw)}
      />

      <div className="space-y-3">
        <div className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">
          Then Override
        </div>

        <OverrideSliders
          cond={cond}
          onSliderChange={(key, val) => updateOverrideSlider(idx, key, val)}
        />

        <TacticSelectors
          cond={cond}
          idx={idx}
          onTacticChange={(key, val) => updateOverrideTactic(idx, key, val)}
        />

        <ConditionLabelInput
          cond={cond}
          idx={idx}
          onChange={(label) => updateCondition(idx, { label })}
        />
      </div>
    </div>
  );
}
