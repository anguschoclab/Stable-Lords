/**
 * Per-style strategy presets — named fight plans transcribed from
 * docs/design/stable-lords-strategy-editor-spec-v1.0.md §5 (two per style), plus
 * canon strategies from the Arena 93 newsletter corpus (ripper, slasher,
 * striker, piker, and wall sheets from the Noblish Island articles).
 *
 * Each preset provides a complete FightPlan with per-phase OE/AL/KD
 * overrides; canon presets may also set per-phase tactics and a
 * desperatePlan. The first preset per style is the "default" shown in
 * PlanBuilder when no player-saved plan exists.
 */
import {
  FightingStyle,
  type AttackTarget,
  type DefensiveTactic,
  type DesperatePlan,
  type FightPlan,
  type OffensiveTactic,
  type PhaseStrategy,
  type ProtectTarget,
} from '@/types/shared.types';
import { getAITactics } from '@/engine/ai/plan/levers';

/**
 *
 */
export interface StylePreset {
  name: string;
  description: string;
  plan: FightPlan;
}

type PhaseVals = {
  OE: number;
  AL: number;
  KD: number;
  offTac?: OffensiveTactic;
  defTac?: DefensiveTactic;
};

function makePhases(
  opening: PhaseVals,
  mid: PhaseVals,
  late: PhaseVals
): {
  opening: PhaseStrategy;
  mid: PhaseStrategy;
  late: PhaseStrategy;
} {
  const phase = (v: PhaseVals): PhaseStrategy => ({
    OE: v.OE,
    AL: v.AL,
    killDesire: v.KD,
    ...(v.offTac !== undefined && { offensiveTactic: v.offTac }),
    ...(v.defTac !== undefined && { defensiveTactic: v.defTac }),
  });
  return { opening: phase(opening), mid: phase(mid), late: phase(late) };
}

type PresetSpec = PhaseVals & {
  desperatePlan?: DesperatePlan;
  target?: AttackTarget;
  protect?: ProtectTarget;
  offensiveTactic?: OffensiveTactic;
  defensiveTactic?: DefensiveTactic;
};

function makePreset(
  style: FightingStyle,
  name: string,
  description: string,
  base: PresetSpec,
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
      target: base.target ?? 'Any',
      protect: base.protect ?? 'Any',
      offensiveTactic: base.offensiveTactic ?? offTactic,
      defensiveTactic: base.defensiveTactic ?? defTactic,
      desperatePlan: base.desperatePlan,
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
    makePreset(
      FightingStyle.LungingAttack,
      "Assur's Lazy 7-10",
      'Arena 93 — Assur\'s Lunger Model: 7-10 minute 1 for a whole basic career, AL off fast to save the endurance burn, OE ~7, no tactics.',
      {
        OE: 7,
        AL: 10,
        KD: 6,
        offensiveTactic: 'none',
        desperatePlan: { OE: 7, AL: 10, killDesire: 6 },
      },
      {
        opening: { OE: 7, AL: 10, KD: 6 },
        mid: { OE: 7, AL: 5, KD: 5 },
        late: { OE: 6, AL: 4, KD: 4 },
      }
    ),
    makePreset(
      FightingStyle.LungingAttack,
      'Defensive Lunger',
      'Arena 93 — The Wild Boar: fight defensively to cover the endurance burn; dodge steals the initiative back. Never run it vs other lungers.',
      {
        OE: 4,
        AL: 5,
        KD: 4,
        offensiveTactic: 'none',
        defensiveTactic: 'Dodge',
        target: 'Right Leg',
        protect: 'Body',
        // Drake (Arena 93): the lunger's desperation line is 10-10-4 Dodge —
        // flat-out activity, moderate kill intent, dodging for dear life.
        desperatePlan: { OE: 10, AL: 10, killDesire: 4, defensiveTactic: 'Dodge' },
      },
      {
        opening: { OE: 4, AL: 6, KD: 4 },
        mid: { OE: 4, AL: 4, KD: 4 },
        late: { OE: 4, AL: 4, KD: 5 },
      }
    ),
    makePreset(
      FightingStyle.LungingAttack,
      "Snorri's Tempo",
      'Arena 93 — Elder Snorri\'s hi-hi-mod: run hot minute 1, throttle both dials to moderate, KD inside the 5-8 band.',
      { OE: 9, AL: 9, KD: 7 },
      {
        opening: { OE: 9, AL: 9, KD: 7 },
        mid: { OE: 7, AL: 7, KD: 6 },
        late: { OE: 5, AL: 6, KD: 5 },
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
    // "The Armor Piercing Parry-Lunge" (Arena 93): 2-6-2 P / 9-9-7 / 7-7-5 bleed,
    // head-hunting, 10-10-10 desperation. Minute-1-only head protection has no
    // phase slot in the model — expressed as plan-wide protect 'Head'.
    makePreset(
      FightingStyle.ParryLunge,
      'Armor-Piercer',
      'Walls up the opening, then hunts the head at 9-9-7 — spastic when desperate.',
      { OE: 6, AL: 7, KD: 5, target: 'Head', protect: 'Head', desperatePlan: { OE: 10, AL: 10, killDesire: 10 } },
      {
        opening: { OE: 2, AL: 6, KD: 2, defTac: 'Parry' },
        mid: { OE: 9, AL: 9, KD: 7 },
        late: { OE: 6, AL: 6, KD: 6 },
      }
    ),
    // Tripwire's Parry-Lunge: MO/HI Dodge opening bleeding to LO/VL late,
    // LO/HI Dodge desperation. Tactics drop once skills mature — the late
    // phase explicitly runs 'none' rather than forcing the dodge.
    makePreset(
      FightingStyle.ParryLunge,
      'Tripwire Tempo',
      'Dodges the opening at moderate effort, bleeds to low-low, re-dodges when desperate.',
      { OE: 5, AL: 5, KD: 5, defensiveTactic: 'Dodge', desperatePlan: { OE: 3, AL: 8, killDesire: 6, defensiveTactic: 'Dodge' } },
      {
        opening: { OE: 5, AL: 8, KD: 5, defTac: 'Dodge' },
        mid: { OE: 6, AL: 5, KD: 5, defTac: 'Dodge' },
        late: { OE: 4, AL: 1, KD: 5, defTac: 'none' },
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
    makePreset(
      FightingStyle.ParryRiposte,
      'Fast Ripper',
      "Cadmus's ripper: high-output opening burst, settling mid, then a high-activity surge to close.",
      { OE: 7, AL: 7, KD: 6 },
      {
        opening: { OE: 8, AL: 8, KD: 6 },
        mid: { OE: 5, AL: 5, KD: 7 },
        late: { OE: 8, AL: 10, KD: 5 },
      }
    ),
    makePreset(
      FightingStyle.ParryRiposte,
      'Third-Minute Surge',
      "Blackhawk's ripper: patient low-effort start, waking up mid, finishing on the shell with kill desire sheathed.",
      { OE: 4, AL: 4, KD: 5 },
      {
        opening: { OE: 3, AL: 4, KD: 5 },
        mid: { OE: 6, AL: 4, KD: 5 },
        late: { OE: 3, AL: 5, KD: 2 },
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
    makePreset(
      FightingStyle.ParryStrike,
      "Assur's Cadence",
      'Assur\'s "magic" piker strategy — the flat 9-10 rhythm that carried his Tournament Champion. Add tactics as desired; slow down for scum.',
      { OE: 9, AL: 10, KD: 6 },
      {
        opening: { OE: 9, AL: 10, KD: 6 },
        mid: { OE: 9, AL: 10, KD: 6 },
        late: { OE: 9, AL: 10, KD: 6 },
      }
    ),
    makePreset(
      FightingStyle.ParryStrike,
      'One Strike, One Kill',
      "The Priest's offensive piker — the style's killing attitude flat out, decisiveness through every phase including desperation.",
      {
        OE: 10,
        AL: 10,
        KD: 10,
        offensiveTactic: 'Decisiveness',
        desperatePlan: {
          OE: 10,
          AL: 10,
          killDesire: 10,
          offensiveTactic: 'Decisiveness',
        },
      },
      {
        opening: { OE: 10, AL: 10, KD: 10, offTac: 'Decisiveness' },
        mid: { OE: 10, AL: 10, KD: 10, offTac: 'Decisiveness' },
        late: { OE: 10, AL: 10, KD: 10, offTac: 'Decisiveness' },
      }
    ),
    makePreset(
      FightingStyle.ParryStrike,
      "Priest's Shell",
      "The Priest's defensive piker — assure defense behind Responsiveness in minute one, secure enough to run Decisiveness by minute two, blank late. Shell up when desperate.",
      {
        OE: 10,
        AL: 10,
        KD: 10,
        defensiveTactic: 'Responsiveness',
        desperatePlan: {
          OE: 10,
          AL: 10,
          killDesire: 10,
          defensiveTactic: 'Responsiveness',
        },
      },
      {
        opening: { OE: 10, AL: 10, KD: 10, defTac: 'Responsiveness' },
        mid: { OE: 10, AL: 7, KD: 10, offTac: 'Decisiveness' },
        late: { OE: 10, AL: 10, KD: 10 },
      }
    ),
  ],

  [FightingStyle.SlashingAttack]: [
    makePreset(
      FightingStyle.SlashingAttack,
      "Reaper's Fade",
      'The canon collapse — burn hot out of the gate, let the activity bleed off as the arms tire. When desperate, go out swinging.',
      { OE: 9, AL: 5, KD: 6, desperatePlan: { OE: 10, AL: 8, killDesire: 8 } },
      {
        opening: { OE: 10, AL: 10, KD: 6 },
        mid: { OE: 9, AL: 4, KD: 6 },
        late: { OE: 7, AL: 2, KD: 7 },
      }
    ),
    makePreset(
      FightingStyle.SlashingAttack,
      'Fight Another Day',
      "Jorja's rhythm for Vic — still a slasher's opening, but when the tank runs dry the answer is fight another day: drop effort, sheath the kill desire.",
      {
        OE: 9,
        AL: 4,
        KD: 6,
        desperatePlan: { OE: 5, AL: 4, killDesire: 2 },
        target: 'Right Arm',
        protect: 'Body',
      },
      {
        opening: { OE: 10, AL: 9, KD: 7 },
        mid: { OE: 8, AL: 3, KD: 7 },
        late: { OE: 6, AL: 2, KD: 5 },
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
    makePreset(
      FightingStyle.StrikingAttack,
      "Assur's Opener",
      'The canon 10-10 sheet — all-out first minute behind decisiveness, then throttle down hard.',
      { OE: 6, AL: 4, KD: 6 },
      {
        opening: { OE: 10, AL: 10, KD: 7 },
        mid: { OE: 6, AL: 4, KD: 6 },
        late: { OE: 5, AL: 1, KD: 5 },
      }
    ),
    makePreset(
      FightingStyle.StrikingAttack,
      'Scum-Breaker',
      'Anti-scum grinder — steady moderate effort aimed at the legs until the shell cracks.',
      { OE: 6, AL: 2, KD: 6, target: 'Right Leg' },
      {
        opening: { OE: 6, AL: 4, KD: 6 },
        mid: { OE: 6, AL: 2, KD: 6 },
        late: { OE: 6, AL: 1, KD: 6 },
      }
    ),
    makePreset(
      FightingStyle.StrikingAttack,
      "Talon's Marauder",
      'Opens hot behind decisiveness, then fights off the Responsiveness counter.',
      { OE: 7, AL: 3, KD: 7, defensiveTactic: 'Responsiveness' },
      {
        opening: { OE: 10, AL: 10, KD: 6 },
        mid: { OE: 7, AL: 3, KD: 7 },
        late: { OE: 5, AL: 1, KD: 5 },
      }
    ),
    makePreset(
      FightingStyle.StrikingAttack,
      'Crimson Striker',
      'Moderate activity with the kill intent forward — answers with Responsiveness.',
      { OE: 7, AL: 2, KD: 6, defensiveTactic: 'Responsiveness' },
      {
        opening: { OE: 10, AL: 4, KD: 6 },
        mid: { OE: 7, AL: 2, KD: 6 },
        late: { OE: 6, AL: 1, KD: 5 },
      }
    ),
    makePreset(
      FightingStyle.StrikingAttack,
      "Tex's Marathon",
      'Sustainable opening aimed at the arms behind a protected head — surges all-out when desperate.',
      {
        OE: 6,
        AL: 2,
        KD: 6,
        target: 'Right Arm',
        protect: 'Head',
        desperatePlan: { OE: 10, AL: 8, killDesire: 8 },
      },
      {
        opening: { OE: 10, AL: 10, KD: 6 },
        mid: { OE: 6, AL: 2, KD: 6 },
        late: { OE: 5, AL: 1, KD: 5 },
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
    // Arena 93 pure defensive ("scum"): 1 OE / 1 AL behind a shield and heavy
    // armor, Parry tactic — win by never getting hit until the foe drops.
    // Deliberately NOT first: index 0 is the default plan, and defaulting
    // every TP to the pure scum line would re-baseline the whole matchup.
    makePreset(
      FightingStyle.TotalParry,
      'Scum Wall',
      'True 1-1 parry wall: minimum effort, shield up, outlast everything.',
      { OE: 1, AL: 1, KD: 1, defensiveTactic: 'Parry' },
      {
        opening: { OE: 1, AL: 1, KD: 1, defTac: 'Parry' },
        mid: { OE: 1, AL: 1, KD: 1, defTac: 'Parry' },
        late: { OE: 2, AL: 1, KD: 3, defTac: 'Parry' },
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
    makePreset(
      FightingStyle.WallOfSteel,
      "She-Puppy's Dervish",
      'The berserker wall — attack and defend the arms like a slasher, then bleed the activity off as the arms tire. Shells up behind Parry when desperate.',
      {
        OE: 9,
        AL: 6,
        KD: 6,
        protect: 'Arms',
        desperatePlan: { OE: 2, AL: 6, killDesire: 2, defensiveTactic: 'Parry' },
      },
      {
        opening: { OE: 9, AL: 6, KD: 6 },
        mid: { OE: 6, AL: 4, KD: 6 },
        late: { OE: 5, AL: 2, KD: 5 },
      }
    ),
    makePreset(
      FightingStyle.WallOfSteel,
      "Eli's High-Low",
      'Minute one is all-out — 10-10-6 — then the pace tapers to the ADM-proven high offensive effort over low activity.',
      { OE: 10, AL: 10, KD: 6 },
      {
        opening: { OE: 10, AL: 10, KD: 6 },
        mid: { OE: 9, AL: 4, KD: 6 },
        late: { OE: 6, AL: 3, KD: 5 },
      }
    ),
    makePreset(
      FightingStyle.WallOfSteel,
      "Dante's Guard",
      'The Nerdy Style opener — 6-4-6, then move effort and activity up or down by one until the parry locks in.',
      { OE: 6, AL: 4, KD: 6 },
      {
        opening: { OE: 6, AL: 4, KD: 6 },
        mid: { OE: 5, AL: 4, KD: 6 },
        late: { OE: 5, AL: 4, KD: 6 },
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
  return (STYLE_PRESETS[style]?.[0] ??
    STYLE_PRESETS[FightingStyle.StrikingAttack]?.[0]) as StylePreset;
}
