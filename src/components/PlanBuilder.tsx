import { Card, CardContent } from '@/components/ui/card';
import type { FightPlan, Warrior } from '@/types/game';
import type { FightingStyle } from '@/types/game';
import TacticBank from './planBuilder/TacticBank';
import CommonControls from './planBuilder/CommonControls';
import SpatialControls from './planBuilder/SpatialControls';
import PhaseOverrides from './planBuilder/PhaseOverrides';
import StylePassives from './planBuilder/StylePassives';
import ContingencyPlans from './planBuilder/ContingencyPlans';
import { usePlanOrchestration } from './planBuilder/usePlanOrchestration';
import { PlanHeader, WarningsRow, PresetBar } from './planBuilder/sections';

/* ── Sub-components ─────────────────────────────────────── */

interface PlanBuilderProps {
  plan: FightPlan;
  onPlanChange: (plan: FightPlan) => void;
  warrior?: Warrior;
  rivalStyle?: FightingStyle;
}

/**
 * Plan builder.
 * @param - { plan, on plan change, warrior, rival style }.
 */
export default function PlanBuilder({ plan, onPlanChange, warrior, rivalStyle }: PlanBuilderProps) {
  const {
    matchupAdv,
    score,
    allWarnings,
    stylePresets,
    applyPreset,
    restoreDefault,
    applyCouncilTactics,
    applyBias,
  } = usePlanOrchestration(plan, onPlanChange, warrior, rivalStyle);

  return (
    <Card className="bg-background border-arena-blood/20 shadow-2xl relative overflow-hidden">
      {/* Decorative pulse */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-arena-blood/5 blur-[80px] rounded-full -mr-16 -mt-16" />

      <PlanHeader plan={plan} matchupAdv={matchupAdv} score={score} />

      <CardContent className="pt-6 space-y-8">
        <WarningsRow plan={plan} warrior={warrior} warnings={allWarnings} />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <TacticBank plan={plan} onPlanChange={onPlanChange} />
          </div>

          <div className="lg:col-span-3 space-y-8">
            <CommonControls plan={plan} onPlanChange={onPlanChange} />
            <SpatialControls plan={plan} warrior={warrior} onPlanChange={onPlanChange} />
            <PhaseOverrides plan={plan} onPlanChange={onPlanChange} />
            <StylePassives plan={plan} warrior={warrior} />
            <ContingencyPlans plan={plan} onPlanChange={onPlanChange} />
          </div>
        </div>

        <PresetBar
          plan={plan}
          warrior={warrior}
          stylePresets={stylePresets}
          onApplyPreset={applyPreset}
          onRestoreDefault={restoreDefault}
          onApplyCouncilTactics={applyCouncilTactics}
          onApplyBias={applyBias}
        />
      </CardContent>
    </Card>
  );
}
