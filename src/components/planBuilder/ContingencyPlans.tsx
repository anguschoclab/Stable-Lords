import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { GitBranch, Swords } from 'lucide-react';
import type { FightPlan, PlanCondition } from '@/types/game';
import type { ChallengePlans } from '@/types/shared/fightPlan';
import ConditionEditor from '@/components/warrior/ConditionEditor';
import { PlanValueSlider } from './sections';

interface ContingencyPlansProps {
  plan: FightPlan;
  onPlanChange: (plan: FightPlan) => void;
}

/** One challenge-context slot: OE / AL / kill-desire overrides for that role. */
function SpecialStrategySlot(props: {
  idPrefix: string;
  title: string;
  base: FightPlan;
  override: NonNullable<ChallengePlans['whenProposer']> | undefined;
  onChange: (v: ChallengePlans['whenProposer']) => void;
}) {
  const { idPrefix, title, base, override, onChange } = props;
  const enabled = override !== undefined;
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label
          htmlFor={`${idPrefix}-switch`}
          className="text-[10px] font-black uppercase tracking-widest text-muted-foreground cursor-pointer"
        >
          {title}
        </Label>
        <Switch
          id={`${idPrefix}-switch`}
          aria-label={title}
          checked={enabled}
          onCheckedChange={(on) =>
            onChange(
              on
                ? { OE: base.OE, AL: base.AL, killDesire: base.killDesire }
                : undefined
            )
          }
        />
      </div>
      {enabled && (
        <div className="grid gap-3 pl-1">
          <PlanValueSlider
            id={`${idPrefix}-oe`}
            label="OE"
            toneClass="text-arena-pop"
            value={override?.OE ?? base.OE}
            onChange={(v) => onChange({ ...override, OE: v })}
          />
          <PlanValueSlider
            id={`${idPrefix}-al`}
            label="AL"
            toneClass="text-arena-pop"
            value={override?.AL ?? base.AL}
            onChange={(v) => onChange({ ...override, AL: v })}
          />
          <PlanValueSlider
            id={`${idPrefix}-kd`}
            label="Kill Desire"
            toneClass="text-arena-pop"
            value={(override?.killDesire ?? base.killDesire) ?? 5}
            onChange={(v) => onChange({ ...override, killDesire: v })}
          />
        </div>
      )}
    </div>
  );
}

/**
 * Contingency plans.
 * @param - { plan, on plan change }.
 */
export default function ContingencyPlans({ plan, onPlanChange }: ContingencyPlansProps) {
  const [showConditions, setShowConditions] = useState(!!plan.conditions?.length);
  const [showSpecial, setShowSpecial] = useState(!!plan.challengePlans);

  const setSlot = (key: keyof ChallengePlans, v: ChallengePlans[keyof ChallengePlans]) => {
    const next = { ...plan.challengePlans, [key]: v };
    const empty = !next.whenProposer && !next.whenChallenged;
    onPlanChange({ ...plan, challengePlans: empty ? undefined : next });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label
          htmlFor="contingency-plans-switch"
          className="flex items-center gap-2 cursor-pointer"
        >
          <GitBranch className="w-4 h-4 text-arena-pop" />
          <span className="text-[10px] font-black uppercase tracking-widest text-arena-pop">
            Contingency Plans
          </span>
          {(plan.conditions?.length ?? 0) > 0 && (
            <Badge className="rounded-none border-none bg-arena-pop/20 text-arena-pop text-[9px] font-black px-1.5 py-0.5">
              {plan.conditions?.length}
            </Badge>
          )}
        </Label>
        <Switch
          id="contingency-plans-switch"
          aria-label="Contingency Plans"
          checked={showConditions}
          onCheckedChange={setShowConditions}
        />
      </div>

      {showConditions && (
        <div className="bg-black/40 border border-white/5 p-4">
          <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 italic mb-4">
            Override strategy mid-fight when conditions are met. First match wins. WT stat governs
            how quickly they activate.
          </p>
          <ConditionEditor
            conditions={plan.conditions ?? []}
            onChange={(conds: PlanCondition[]) =>
              onPlanChange({ ...plan, conditions: conds.length > 0 ? conds : undefined })
            }
          />
        </div>
      )}

      <div className="flex items-center justify-between">
        <Label
          htmlFor="special-strategy-switch"
          className="flex items-center gap-2 cursor-pointer"
        >
          <Swords className="w-4 h-4 text-arena-pop" />
          <span className="text-[10px] font-black uppercase tracking-widest text-arena-pop">
            Special Strategy
          </span>
        </Label>
        <Switch
          id="special-strategy-switch"
          aria-label="Special Strategy"
          checked={showSpecial}
          onCheckedChange={setShowSpecial}
        />
      </div>

      {showSpecial && (
        <div className="bg-black/40 border border-white/5 p-4 space-y-4">
          <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 italic">
            Alternate plans used only when this warrior issues the challenge or is the one being
            challenged. Fields left unchanged inherit the base plan.
          </p>
          <SpecialStrategySlot
            idPrefix="when-proposer"
            title="When Challenging"
            base={plan}
            override={plan.challengePlans?.whenProposer}
            onChange={(v) => setSlot('whenProposer', v)}
          />
          <SpecialStrategySlot
            idPrefix="when-challenged"
            title="When Challenged"
            base={plan}
            override={plan.challengePlans?.whenChallenged}
            onChange={(v) => setSlot('whenChallenged', v)}
          />
          <SpecialStrategySlot
            idPrefix="tournament"
            title="Tournament"
            base={plan}
            override={plan.tournamentPlan}
            onChange={(v) => onPlanChange({ ...plan, tournamentPlan: v })}
          />
        </div>
      )}
    </div>
  );
}
