import { Plus } from 'lucide-react';
import type { PlanCondition, ConditionTriggerType } from '@/types/game';
import { TRIGGER_OPTIONS } from '@/constants/combat/planConditions';
import { ConditionItem } from './ConditionItem';

interface ConditionEditorProps {
  conditions: PlanCondition[];
  onChange: (conditions: PlanCondition[]) => void;
}

const DEFAULT_CONDITION: PlanCondition = {
  trigger: { type: 'HP_BELOW', value: 35 },
  override: { OE: 4 },
};

/** Trigger-type and trigger-value mutations for one condition row. */
function triggerMutations(
  conditions: PlanCondition[],
  updateCondition: (idx: number, partial: Partial<PlanCondition>) => void
) {
  function updateTrigger(idx: number, type: ConditionTriggerType) {
    const opt = TRIGGER_OPTIONS.find((o) => o.type === type);
    if (!opt) return;

    let value: number | string;
    if (opt.inputType === 'percent') value = 35;
    else if (opt.inputType === 'integer') value = 2;
    else if (opt.inputType === 'psych') value = 'Desperate';
    else value = 'Mid';
    updateCondition(idx, { trigger: { type, value } });
  }

  function updateTriggerValue(idx: number, raw: string) {
    const cond = conditions[idx];
    if (!cond) return;
    const opt = TRIGGER_OPTIONS.find((o) => o.type === cond.trigger.type);
    if (!opt) return;

    let value: number | string;
    if (opt.inputType === 'phase' || opt.inputType === 'psych') {
      value = raw;
    } else {
      const n = parseFloat(raw);
      value = isNaN(n) ? cond.trigger.value : n;
    }
    updateCondition(idx, { trigger: { ...cond.trigger, value } });
  }

  return { updateTrigger, updateTriggerValue };
}

/** Condition list mutations bound to the current conditions array. */
function useConditionMutations(
  conditions: PlanCondition[],
  onChange: (conditions: PlanCondition[]) => void
) {
  function addCondition() {
    onChange([...conditions, { ...DEFAULT_CONDITION, override: { OE: 4 } }]);
  }

  function removeCondition(idx: number) {
    onChange(conditions.filter((_, i) => i !== idx));
  }

  function updateCondition(idx: number, partial: Partial<PlanCondition>) {
    onChange(conditions.map((c, i) => (i === idx ? { ...c, ...partial } : c)));
  }

  const { updateTrigger, updateTriggerValue } = triggerMutations(conditions, updateCondition);

  function setOverrideKey(
    idx: number,
    key: keyof PlanCondition['override'],
    val: number | string | undefined
  ) {
    const cond = conditions[idx];
    if (!cond) return;
    if (val === undefined || val === 'none') {
      const { [key]: _removed, ...rest } = cond.override;
      updateCondition(idx, { override: rest });
    } else {
      updateCondition(idx, { override: { ...cond.override, [key]: val } });
    }
  }

  const updateOverrideSlider = (
    idx: number,
    key: 'OE' | 'AL' | 'killDesire',
    val: number | undefined
  ) => setOverrideKey(idx, key, val);

  const updateOverrideTactic = (
    idx: number,
    key: 'offensiveTactic' | 'defensiveTactic',
    val: string
  ) => setOverrideKey(idx, key, val);

  return {
    addCondition,
    removeCondition,
    updateCondition,
    updateTrigger,
    updateTriggerValue,
    updateOverrideSlider,
    updateOverrideTactic,
  };
}

/**
 * Condition editor.
 * @param - { conditions, on change }.
 */
export default function ConditionEditor({ conditions, onChange }: ConditionEditorProps) {
  const {
    addCondition,
    removeCondition,
    updateCondition,
    updateTrigger,
    updateTriggerValue,
    updateOverrideSlider,
    updateOverrideTactic,
  } = useConditionMutations(conditions, onChange);

  return (
    <div className="space-y-4">
      {conditions.length === 0 && (
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 italic text-center py-4">
          No conditions set — fighter uses base strategy throughout.
        </p>
      )}

      {conditions.map((cond, idx) => (
        <ConditionItem
          key={idx}
          cond={cond}
          idx={idx}
          removeCondition={removeCondition}
          updateTrigger={updateTrigger}
          updateTriggerValue={updateTriggerValue}
          updateOverrideSlider={updateOverrideSlider}
          updateOverrideTactic={updateOverrideTactic}
          updateCondition={updateCondition}
        />
      ))}

      <button
        onClick={addCondition}
        className="w-full flex items-center justify-center gap-2 border border-dashed border-white/10 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 hover:border-arena-gold/40 hover:text-arena-gold transition-all motion-reduce:transition-none motion-reduce:transform-none"
        aria-label="Add Condition"
      >
        <Plus className="w-3.5 h-3.5" />
        Add Condition
      </button>
    </div>
  );
}
