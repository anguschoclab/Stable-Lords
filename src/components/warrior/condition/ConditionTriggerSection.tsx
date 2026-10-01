import type { PlanCondition, ConditionTriggerType } from '@/types/game';
import { TRIGGER_OPTIONS, PSYCH_OPTIONS } from '@/constants/combat/planConditions';
import { triggerDisplayValue } from '@/engine/combat/planConditionUtils';

interface ConditionTriggerSectionProps {
  cond: PlanCondition;
  idx: number;
  onTriggerChange: (type: ConditionTriggerType) => void;
  onValueChange: (raw: string) => void;
}

/**
 *
 */
export function ConditionTriggerSection({
  cond,
  idx,
  onTriggerChange,
  onValueChange,
}: ConditionTriggerSectionProps) {
  const trigOpt = TRIGGER_OPTIONS.find((o) => o.type === cond.trigger.type);
  if (!trigOpt) return null;

  return (
    <div className="space-y-2">
      <div className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">
        When
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <select
          value={cond.trigger.type}
          onChange={(e) => onTriggerChange(e.target.value as ConditionTriggerType)}
          aria-label="Condition trigger type"
          className="bg-black/60 border border-white/10 text-[10px] font-black uppercase tracking-wide text-foreground px-2 py-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset appearance-none"
        >
          {TRIGGER_OPTIONS.map((o) => (
            <option key={o.type} value={o.type}>
              {o.label}
            </option>
          ))}
        </select>

        <TriggerValueInput
          cond={cond}
          idx={idx}
          inputType={trigOpt.inputType}
          onValueChange={onValueChange}
        />

        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">
          → {triggerDisplayValue(cond)}
        </span>
      </div>
    </div>
  );
}

/** Value input matching the trigger type: phase, psych state, integer, or percent. */
function TriggerValueInput({
  cond,
  idx,
  inputType,
  onValueChange,
}: {
  cond: PlanCondition;
  idx: number;
  inputType: string;
  onValueChange: (raw: string) => void;
}) {
  if (inputType === 'phase' || inputType === 'psych' || inputType === 'integer') {
    const options =
      inputType === 'phase'
        ? ['Opening', 'Mid', 'Late']
        : inputType === 'psych'
          ? [...PSYCH_OPTIONS]
          : ['1', '2', '3'];
    return (
      <select
        value={String(cond.trigger.value)}
        onChange={(e) => onValueChange(e.target.value)}
        aria-label={
          inputType === 'psych'
            ? 'Condition trigger psych state'
            : 'Condition trigger phase or value'
        }
        className="bg-black/60 border border-white/10 text-[10px] font-black uppercase tracking-wide text-foreground px-2 py-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset appearance-none"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <label htmlFor={`condition-item-${idx}-value`} className="sr-only">
        Trigger Value
      </label>
      <input
        id={`condition-item-${idx}-value`}
        type="number"
        min={0}
        max={100}
        step={5}
        value={Number(cond.trigger.value)}
        onChange={(e) => onValueChange(e.target.value)}
        className="w-16 bg-black/60 border border-white/10 text-[10px] font-mono font-bold text-arena-gold px-2 py-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset text-center"
      />
      <span className="text-[10px] text-muted-foreground/60 font-bold">%</span>
    </div>
  );
}
