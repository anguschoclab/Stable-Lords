import type { PlanCondition } from '@/types/game';

interface ConditionLabelInputProps {
  cond: PlanCondition;
  idx: number;
  onChange: (label: string | undefined) => void;
}

/**
 *
 */
export function ConditionLabelInput({ cond, idx, onChange }: ConditionLabelInputProps) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={`condition-item-${idx}-label`}
        className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 block"
      >
        Label (optional)
      </label>
      <input
        id={`condition-item-${idx}-label`}
        type="text"
        placeholder="e.g. Survival Mode"
        maxLength={32}
        value={cond.label ?? ''}
        onChange={(e) => onChange(e.target.value || undefined)}
        className="w-full bg-black/60 border border-white/10 text-[10px] font-bold text-foreground placeholder:text-muted-foreground/20 px-2 py-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
      />
    </div>
  );
}
