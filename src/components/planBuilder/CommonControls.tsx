import { useId } from 'react';
import type { FightPlan } from '@/types/game';
import { PlanValueSlider, TacticBadgeStrip } from './sections';

interface CommonControlsProps {
  plan: FightPlan;
  onPlanChange: (plan: FightPlan) => void;
}

/**
 * Common controls.
 * @param - { plan, on plan change }.
 */
export default function CommonControls({ plan, onPlanChange }: CommonControlsProps) {
  const idPrefix = useId();
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white/5 p-6 border border-white/5">
      <div className="space-y-6">
        <PlanValueSlider
          id={`${idPrefix}-plan-oe`}
          label="Offensive Effort"
          toneClass="text-arena-gold"
          value={plan.OE}
          onChange={(v) => onPlanChange({ ...plan, OE: v })}
        />
        <PlanValueSlider
          id={`${idPrefix}-plan-al`}
          label="Activity Level"
          toneClass="text-arena-fame"
          value={plan.AL ?? 5}
          onChange={(v) => onPlanChange({ ...plan, AL: v })}
        />
      </div>

      <div className="space-y-6">
        <PlanValueSlider
          id={`${idPrefix}-plan-kd`}
          label="Kill Desire"
          toneClass="text-destructive"
          value={plan.killDesire ?? 5}
          onChange={(v) => onPlanChange({ ...plan, killDesire: v })}
        />
        <TacticBadgeStrip plan={plan} />
      </div>
    </div>
  );
}
