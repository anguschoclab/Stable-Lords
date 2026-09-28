import { useMemo } from 'react';
import type { FightPlan, Warrior } from '@/types/game';
import type { FightingStyle } from '@/types/game';
import { getMatchupBonus } from '@/constants/combat';
import { computeStrategyScore } from '@/engine/strategy/strategyAnalysis';
import { autoTuneFromBias, type Bias } from '@/engine/strategy/planBias';
import { getStylePresets } from '@/engine/bout/stylePresets';
import { defaultPlanForWarrior } from '@/engine/simulate';
import {
  validateStrategy,
  estimateStaminaCurve,
  predictedCollapseMinute,
} from '@/engine/strategy/strategyValidator';
import { BOUT_DURATION_MINUTES } from '@/constants/combat';
import { evaluateTacticsAdvice } from '@/engine/advisor/tacticsAdvisorBridge';
import { evaluateCampaignFocus } from '@/engine/advisor';
import { reconstructGameState } from '@/state/serialization';
import { useGameStore } from '@/state/useGameStore';

export const BIAS_PRESETS: { label: string; bias: Bias }[] = [
  { label: 'HEAD-HUNT', bias: 'head-hunt' },
  { label: 'HAMSTRING', bias: 'hamstring' },
  { label: 'GUT', bias: 'gut' },
  { label: 'GUARD-BREAK', bias: 'guard-break' },
  { label: 'BALANCED', bias: 'balanced' },
];

/** Derived plan metrics (score, warnings, matchup edge, presets) plus the plan-mutation handlers. */
export function usePlanOrchestration(
  plan: FightPlan,
  onPlanChange: (plan: FightPlan) => void,
  warrior?: Warrior,
  rivalStyle?: FightingStyle
) {
  const matchupAdv = useMemo(() => {
    if (!rivalStyle) return 0;
    return getMatchupBonus(plan.style, rivalStyle);
  }, [plan.style, rivalStyle]);

  const score = useMemo(() => computeStrategyScore(plan, warrior), [plan, warrior]);
  const warnings = useMemo(() => validateStrategy(plan, warrior), [plan, warrior]);

  const stylePresets = useMemo(() => getStylePresets(plan.style), [plan.style]);

  const collapseWarning = useMemo(() => {
    const curve = estimateStaminaCurve(plan, warrior);
    const collapse = predictedCollapseMinute(curve);
    if (collapse !== null && collapse < BOUT_DURATION_MINUTES) {
      return {
        code: 'PREDICTED_COLLAPSE',
        severity: 'warn' as const,
        message: `Warrior predicted to collapse at minute ${collapse}. Reduce OE/AL or add phase overrides.`,
      };
    }
    return null;
  }, [plan, warrior]);

  const allWarnings = collapseWarning ? [...warnings, collapseWarning] : warnings;

  const applyPreset = (presetPlan: FightPlan) => {
    onPlanChange({ ...presetPlan });
  };

  const restoreDefault = () => {
    if (warrior) {
      onPlanChange(defaultPlanForWarrior(warrior));
    }
  };

  const applyCouncilTactics = () => {
    if (!warrior) return;
    const state = reconstructGameState(useGameStore.getState());
    const focus = evaluateCampaignFocus(warrior, state);
    const tacticsAdvice = evaluateTacticsAdvice(warrior, focus);
    onPlanChange({
      ...plan,
      offensiveTactic: tacticsAdvice.bestOffensiveTactic,
      defensiveTactic: tacticsAdvice.bestDefensiveTactic,
      OE: tacticsAdvice.suggestedOE,
      AL: tacticsAdvice.suggestedAL,
      fallbackCondition: tacticsAdvice.fallbackCondition,
    });
  };

  const applyBias = (bias: Bias) => {
    onPlanChange({ ...plan, ...autoTuneFromBias(plan, bias) });
  };

  return {
    matchupAdv,
    score,
    allWarnings,
    stylePresets,
    applyPreset,
    restoreDefault,
    applyCouncilTactics,
    applyBias,
  };
}
