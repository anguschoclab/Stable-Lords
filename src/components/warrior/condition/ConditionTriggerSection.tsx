import type { PlanCondition, ConditionTriggerType } from '@/types/game';
import { TRIGGER_OPTIONS } from '@/constants/planConditions';
import { triggerDisplayValue } from '@/utils/planConditionUtils';

interface ConditionTriggerSectionProps {
  cond: PlanCondition;
  idx: number;
  onTriggerChange: (type: ConditionTriggerType) => void;
  onValueChange: (raw: string) => void;
}

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
          className="bg-black/60 border border-white/10 text-[10px] font-black uppercase tracking-wide text-foreground px-2 py-1.5 focus:outline-none focus:border-arena-gold/40 appearance-none"
        >
          {TRIGGER_OPTIONS.map((o) => (
            <option key={o.type} value={o.type}>
              {o.label}
            </option>
          ))}
        </select>

        {trigOpt.inputType === 'phase' ? (
          <select
            value={String(cond.trigger.value)}
            onChange={(e) => onValueChange(e.target.value)}
            className="bg-black/60 border border-white/10 text-[10px] font-black uppercase tracking-wide text-foreground px-2 py-1.5 focus:outline-none focus:border-arena-gold/40 appearance-none"
          >
            <option value="Opening">Opening</option>
            <option value="Mid">Mid</option>
            <option value="Late">Late</option>
          </select>
        ) : trigOpt.inputType === 'integer' ? (
          <select
            value={String(cond.trigger.value)}
            onChange={(e) => onValueChange(e.target.value)}
            className="bg-black/60 border border-white/10 text-[10px] font-black uppercase tracking-wide text-foreground px-2 py-1.5 focus:outline-none focus:border-arena-gold/40 appearance-none"
          >
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
          </select>
        ) : (
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
              className="w-16 bg-black/60 border border-white/10 text-[10px] font-mono font-bold text-arena-gold px-2 py-1.5 focus:outline-none focus:border-arena-gold/40 text-center"
            />
            <span className="text-[10px] text-muted-foreground/60 font-bold">%</span>
          </div>
        )}

        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">
          → {triggerDisplayValue(cond)}
        </span>
      </div>
    </div>
  );
}
