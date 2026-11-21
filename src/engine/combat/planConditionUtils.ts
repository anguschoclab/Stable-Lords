import type { PlanCondition } from '@/types/game';
import { TRIGGER_OPTIONS } from '@/constants/combat/planConditions';

/** Human-readable trigger value for a plan condition (percent suffix when applicable). */
export function triggerDisplayValue(cond: PlanCondition): string {
  const opt = TRIGGER_OPTIONS.find((o) => o.type === cond.trigger.type);
  if (!opt) return String(cond.trigger.value);
  if (opt.inputType === 'percent') return `${cond.trigger.value}%`;
  if (opt.inputType === 'phase') return String(cond.trigger.value);
  return String(cond.trigger.value);
}
