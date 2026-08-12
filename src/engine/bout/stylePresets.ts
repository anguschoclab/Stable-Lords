/**
 * Per-style strategy presets — 20 named presets (2 per fighting style)
 * transcribed from Docs/Stable_Lords_Strategy_Editor_Spec_v1.0.md §5.
 *
 * Each preset provides a complete FightPlan with per-phase OE/AL/KD overrides.
 * The first preset per style is the "default" shown in PlanBuilder when no
 * player-saved plan exists.
 */
import { FightingStyle, type FightPlan, type PhaseStrategy } from '@/types/shared.types';
import { getAITactics } from '@/engine/ai/plan/levers';

/**
 *
 */
export interface StylePreset {
  name: string;
  description: string;
  plan: FightPlan;
}

type PhaseVals = { OE: number; AL: number; KD: number };

function makePhases(
  opening: PhaseVals,
  mid: PhaseVals,
  late: PhaseVals
): {
  opening: PhaseStrategy;
  mid: PhaseStrategy;
  late: PhaseStrategy;
} {
  return {
    opening: { OE: opening.OE, AL: opening.AL, killDesire: opening.KD },
    mid: { OE: mid.OE, AL: mid.AL, killDesire: mid.KD },
    late: { OE: late.OE, AL: late.AL, killDesire: late.KD },
  };
}

function makePreset(
  style: FightingStyle,
  name: string,
  description: string,
  base: PhaseVals,
  phases: { opening: PhaseVals; mid: PhaseVals; late: PhaseVals }
): StylePreset {
  const { offTactic, defTactic } = getAITactics(style);
  return {
    name,
    description,
    plan: {
      style,
      OE: base.OE,
      AL: base.AL,
      killDesire: base.KD,
      target: 'Any',
      protect: 'Any',
      offensiveTactic: offTactic,
      defensiveTactic: defTactic,
      phases: makePhases(phases.opening, phases.mid, phases.late),
    },
  };
}

export const STYLE_PRESETS: Record<FightingStyle, StylePreset[]> = {
  [FightingStyle.AimedBlow]: [
    makePreset(
      FightingStyle.AimedBlow,
      'Patient Surgeon',
      'Conservative opening, ramping precision through mid and late phases.',
      { OE: 6, AL: 5, KD: 5 },
      {
        opening: { OE: 4, AL: 5, KD: 3 },
        mid: { OE: 6, AL: 5, KD: 5 },
        late: { OE: 7, AL: 4, KD: 7 },
      }
    ),
    makePreset(
      FightingStyle.AimedBlow,
      'Aggressive Precision',
      'Higher activity early, finishing with maximum kill desire late.',
      { OE: 6, AL: 5, KD: 6 },
      {
        opening: { OE: 6, AL: 6, KD: 5 },
        mid: { OE: 7, AL: 5, KD: 6 },
        late: { OE: 5, AL: 3, KD: 8 },
      }
    ),
  ],

  [FightingStyle.BashingAttack]: [
    makePreset(
      FightingStyle.BashingAttack,
      'Steamroller',
      'Overwhelming aggression early, fading to defensive late-game finish.',
      { OE: 7, AL: 4, KD: 7 },
      {
        opening: { OE: 8, AL: 5, KD: 6 },
        mid: { OE: 7, AL: 4, KD: 7 },
        late: { OE: 5, AL: 3, KD: 9 },
      }
    ),
    makePreset(
      FightingStyle.BashingAttack,
      'Measured Brute',
      'Paced aggression that escalates through the bout for a late kill.',
      { OE: 7, AL: 4, KD: 6 },
      {
        opening: { OE: 6, AL: 4, KD: 4 },
        mid: { OE: 7, AL: 5, KD: 6 },
        late: { OE: 8, AL: 3, KD: 8 },
      }
    ),
  ],

  [FightingStyle.LungingAttack]: [
    makePreset(
      FightingStyle.LungingAttack,
      'Blitz',
      'All-out opening assault, conserving energy for a late finish.',
      { OE: 6, AL: 6, KD: 6 },
      {
        opening: { OE: 8, AL: 8, KD: 5 },
        mid: { OE: 6, AL: 6, KD: 6 },
        late: { OE: 4, AL: 4, KD: 7 },
      }
    ),
    makePreset(
      FightingStyle.LungingAttack,
      'Sustained Pressure',
      'Even tempo throughout, wearing the opponent down steadily.',
      { OE: 6, AL: 6, KD: 5 },
      {
        opening: { OE: 6, AL: 7, KD: 4 },
        mid: { OE: 6, AL: 6, KD: 5 },
        late: { OE: 5, AL: 5, KD: 6 },
      }
    ),
  ],

  [FightingStyle.ParryLunge]: [
    makePreset(
      FightingStyle.ParryLunge,
      'Counter-Strike',
      'Defensive opening, transitioning to aggressive lunges in mid and late.',
      { OE: 6, AL: 5, KD: 5 },
      {
        opening: { OE: 4, AL: 5, KD: 3 },
        mid: { OE: 6, AL: 6, KD: 5 },
        late: { OE: 7, AL: 5, KD: 7 },
      }
    ),
    makePreset(
      FightingStyle.ParryLunge,
      'Explosive Opener',
      'High-tempo opening, settling into a measured mid-late game.',
      { OE: 5, AL: 5, KD: 5 },
      {
        opening: { OE: 7, AL: 7, KD: 5 },
        mid: { OE: 5, AL: 5, KD: 5 },
        late: { OE: 4, AL: 4, KD: 6 },
      }
    ),
  ],

  [FightingStyle.ParryRiposte]: [
    makePreset(
      FightingStyle.ParryRiposte,
      'Classic Counter',
      'Pure counter-punching: low effort early, escalating through the bout.',
      { OE: 4, AL: 4, KD: 4 },
      {
        opening: { OE: 3, AL: 4, KD: 3 },
        mid: { OE: 4, AL: 5, KD: 4 },
        late: { OE: 5, AL: 4, KD: 6 },
      }
    ),
    makePreset(
      FightingStyle.ParryRiposte,
      'Aggressive Riposte',
      'More active counter style with consistent pressure and late kill focus.',
      { OE: 5, AL: 5, KD: 5 },
      {
        opening: { OE: 5, AL: 5, KD: 4 },
        mid: { OE: 5, AL: 5, KD: 5 },
        late: { OE: 6, AL: 4, KD: 7 },
      }
    ),
  ],

  [FightingStyle.ParryStrike]: [
    makePreset(
      FightingStyle.ParryStrike,
      'Measured Defense',
      'Balanced defense with gradual escalation toward a late finish.',
      { OE: 5, AL: 5, KD: 5 },
      {
        opening: { OE: 5, AL: 5, KD: 3 },
        mid: { OE: 5, AL: 5, KD: 5 },
        late: { OE: 6, AL: 4, KD: 7 },
      }
    ),
    makePreset(
      FightingStyle.ParryStrike,
      'Quick Finish',
      'Aggressive opening and mid, going for an early-to-mid kill.',
      { OE: 6, AL: 5, KD: 6 },
      {
        opening: { OE: 6, AL: 6, KD: 5 },
        mid: { OE: 7, AL: 5, KD: 6 },
        late: { OE: 5, AL: 3, KD: 8 },
      }
    ),
  ],

  [FightingStyle.SlashingAttack]: [
    makePreset(
      FightingStyle.SlashingAttack,
      'Pressure Cutter',
      'Relentless pressure with high activity, finishing strong.',
      { OE: 7, AL: 6, KD: 6 },
      {
        opening: { OE: 7, AL: 6, KD: 5 },
        mid: { OE: 7, AL: 6, KD: 6 },
        late: { OE: 6, AL: 4, KD: 7 },
      }
    ),
    makePreset(
      FightingStyle.SlashingAttack,
      'Cautious Slasher',
      'Measured opening, ramping up through mid for a late kill.',
      { OE: 6, AL: 6, KD: 5 },
      {
        opening: { OE: 5, AL: 5, KD: 3 },
        mid: { OE: 6, AL: 6, KD: 5 },
        late: { OE: 7, AL: 5, KD: 7 },
      }
    ),
  ],

  [FightingStyle.StrikingAttack]: [
    makePreset(
      FightingStyle.StrikingAttack,
      'Fast Finish',
      'Aggressive from the start, going for a quick kill.',
      { OE: 7, AL: 5, KD: 7 },
      {
        opening: { OE: 7, AL: 6, KD: 6 },
        mid: { OE: 7, AL: 5, KD: 7 },
        late: { OE: 6, AL: 3, KD: 9 },
      }
    ),
    makePreset(
      FightingStyle.StrikingAttack,
      'Technical Striker',
      'Measured approach with consistent tempo and late escalation.',
      { OE: 6, AL: 5, KD: 5 },
      {
        opening: { OE: 5, AL: 5, KD: 4 },
        mid: { OE: 6, AL: 5, KD: 5 },
        late: { OE: 6, AL: 4, KD: 7 },
      }
    ),
  ],

  [FightingStyle.TotalParry]: [
    makePreset(
      FightingStyle.TotalParry,
      'Endurance Wall',
      'Minimal effort throughout, outlasting the opponent for a late opening.',
      { OE: 3, AL: 3, KD: 2 },
      {
        opening: { OE: 2, AL: 3, KD: 1 },
        mid: { OE: 3, AL: 3, KD: 2 },
        late: { OE: 4, AL: 3, KD: 4 },
      }
    ),
    makePreset(
      FightingStyle.TotalParry,
      'Opportunistic',
      'Slightly more active parry style, looking for counter opportunities.',
      { OE: 4, AL: 4, KD: 4 },
      {
        opening: { OE: 3, AL: 4, KD: 2 },
        mid: { OE: 4, AL: 4, KD: 4 },
        late: { OE: 5, AL: 4, KD: 6 },
      }
    ),
  ],

  [FightingStyle.WallOfSteel]: [
    makePreset(
      FightingStyle.WallOfSteel,
      'Iron Curtain',
      'Defensive wall with high activity, gradually reducing effort.',
      { OE: 5, AL: 5, KD: 4 },
      {
        opening: { OE: 5, AL: 6, KD: 3 },
        mid: { OE: 5, AL: 5, KD: 4 },
        late: { OE: 4, AL: 4, KD: 5 },
      }
    ),
    makePreset(
      FightingStyle.WallOfSteel,
      'Aggressive Wall',
      'Active wall style with consistent pressure and kill intent.',
      { OE: 6, AL: 6, KD: 5 },
      {
        opening: { OE: 6, AL: 7, KD: 5 },
        mid: { OE: 6, AL: 6, KD: 5 },
        late: { OE: 5, AL: 5, KD: 6 },
      }
    ),
  ],
};

/**
 *
 */
export function getStylePresets(style: FightingStyle): StylePreset[] {
  return STYLE_PRESETS[style] ?? [];
}

/**
 *
 */
export function defaultStylePreset(style: FightingStyle): StylePreset {
  return (STYLE_PRESETS[style]?.[0] ?? STYLE_PRESETS[FightingStyle.StrikingAttack]?.[0]) as StylePreset;
}
