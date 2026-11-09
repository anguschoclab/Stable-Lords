/**
 * Strategy Validator — returns non-blocking soft warnings about a FightPlan.
 * Kept pure + deterministic so both the UI (PlanBuilder) and the AI planner
 * can consume the same ruleset.
 */
import type {
  BaseSkills,
  DefensiveTactic,
  FightPlan,
  OffensiveTactic,
  PhaseStrategy,
} from '@/types/shared.types';
import type { Warrior } from '@/types/warrior.types';
import { FightingStyle } from '@/types/shared.types';
import { getPhaseByMinute } from '@/engine/combat/phase';
import { getMastery } from '@/engine/stylePassives';
import { MAX_EXCHANGES, EXCHANGES_PER_MINUTE, BOUT_DURATION_MINUTES } from '@/constants/combat';
import { fightEquivalentsOf } from '@/engine/warrior/careerUpdate';

/**
 * Warning severity type.
 */
type WarningSeverity = 'info' | 'warn' | 'error';

/**
 * Defines the shape of strategy warning.
 */
export interface StrategyWarning {
  code: string;
  severity: WarningSeverity;
  message: string;
}

const HIGH = 8;
const LOW = 3;

/** Canon slasher rhythm (Arena 93): the style burns endurance fast, so the
 * articles taper activity to low by mid-bout — and no graduate favorite ever
 * ran offensive effort below moderate. */
function warnSlasherRhythm(plan: FightPlan, OE: number, AL: number, out: StrategyWarning[]): void {
  if (plan.style !== FightingStyle.SlashingAttack) return;
  const sustainedAL = (['mid', 'late'] as const).some((p) => (plan.phases?.[p]?.AL ?? AL) >= 7);
  if (sustainedAL) {
    out.push({
      code: 'SL_SUSTAINED_HIGH_AL',
      severity: 'info',
      message:
        'Slashers burn out fast — canon strategy drops AL to low after the opening, not sustained high.',
    });
  }
  if (OE < 5) {
    out.push({
      code: 'SL_LOW_OE',
      severity: 'info',
      message: 'No graduate slasher favorite ran OE below moderate — the style wins on offense.',
    });
  }
}

/** Canon wall rhythm (Arena 93): every Wall-of-Steel article tapers activity
 * to low by mid-bout — the style burns endurance like a lunger and cannot
 * afford a busy late fight. Kill desire stays at 6 or under; She-Puppy
 * reserves 7+ for desperation saves, not the base sheet. */
function warnWallRhythm(plan: FightPlan, AL: number, out: StrategyWarning[]): void {
  if (plan.style !== FightingStyle.WallOfSteel) return;
  const sustainedAL = (['mid', 'late'] as const).some((p) => (plan.phases?.[p]?.AL ?? AL) >= 7);
  if (sustainedAL) {
    out.push({
      code: 'WS_SUSTAINED_HIGH_AL',
      severity: 'info',
      message:
        'Walls burn endurance like lungers — canon sheets open hot, then taper AL to low by mid-bout.',
    });
  }
  if ((plan.killDesire ?? 5) >= 7) {
    out.push({
      code: 'WS_KILL_DESIRE',
      severity: 'info',
      message:
        'Canon wall sheets run kill desire 6 or under — 7+ is reserved for desperation saves.',
    });
  }
}

/** Canon lunger rhythm (Arena 93, Assur's Way + Snorri): the style tapers
 * activity fast — Assur's 7-10 opener drops to AL 4-5 by mid — and even the
 * defensive lunger keeps fighting at OE 4. Forced tactics stay light: the
 * articles' line is "laziness is king". */
function warnLungerRhythm(plan: FightPlan, OE: number, AL: number, out: StrategyWarning[]): void {
  if (plan.style !== FightingStyle.LungingAttack) return;
  const sustainedAL = (['mid', 'late'] as const).some((p) => (plan.phases?.[p]?.AL ?? AL) >= 7);
  if (sustainedAL) {
    out.push({
      code: 'LU_SUSTAINED_HIGH_AL',
      severity: 'info',
      message:
        'Canon lungers taper activity fast — a 7-10 opener should drop to AL 4-5 by mid, not stay busy.',
    });
  }
  if (OE < 4) {
    out.push({
      code: 'LU_LOW_OFFENSE',
      severity: 'info',
      message:
        'Even the defensive lunger fights at OE 4 — sub-moderate offense turns the style into a target.',
    });
  }
  const forced = [
    plan.offensiveTactic,
    plan.defensiveTactic,
    ...(['opening', 'mid', 'late'] as const).flatMap((p) => [
      plan.phases?.[p]?.offensiveTactic,
      plan.phases?.[p]?.defensiveTactic,
    ]),
  ].filter((t) => t && t !== 'none');
  if (forced.length >= 2) {
    out.push({
      code: 'LU_TACTICS_HEAVY',
      severity: 'info',
      message:
        'Heavy forced tactics on a lunger — Assur\'s canon line is "laziness is king"; let the style\'s own lunge do the work.',
    });
  }
}

/** Canon expert rating (Duel2): a skill reaches Expert at 16 — Tripwire's
 * parry-lunge advice is to stop forcing tactics once the backing skill is
 * Expert and let the style's natural tools run. */
const EXPERT_SKILL = 16;

/** Which base skill a forced tactic leans on. */
const TACTIC_BACKING: Partial<Record<OffensiveTactic | DefensiveTactic, keyof BaseSkills>> = {
  Lunge: 'ATT',
  Slash: 'ATT',
  Bash: 'ATT',
  Decisiveness: 'DEC',
  Parry: 'PAR',
  Dodge: 'DEF',
  Responsiveness: 'DEF',
  Riposte: 'RIP',
};

function skillRating(warrior: Warrior, skill: keyof BaseSkills): number {
  return (warrior.baseSkills?.[skill] ?? 0) + (warrior.skillDrills?.[skill] ?? 0);
}

/** Tripwire's Parry-Lunge (Arena 93): "drop the tactics after Expert — let
 * it go at MO/MO or MO/HI no tactic." Forcing a tactic the warrior has
 * already mastered constrains the style's natural parry/dodge/riposte mix. */
function warnParryLungerTactics(plan: FightPlan, warrior: Warrior, out: StrategyWarning[]): void {
  if (plan.style !== FightingStyle.ParryLunge || !warrior.baseSkills) return;
  const tactics: (OffensiveTactic | DefensiveTactic | undefined)[] = [
    plan.offensiveTactic,
    plan.defensiveTactic,
    ...(['opening', 'mid', 'late'] as const).flatMap((p) => [
      plan.phases?.[p]?.offensiveTactic,
      plan.phases?.[p]?.defensiveTactic,
    ]),
  ];
  const pastExpert = tactics.some((t) => {
    if (!t || t === 'none') return false;
    const backing = TACTIC_BACKING[t];
    return backing !== undefined && skillRating(warrior, backing) >= EXPERT_SKILL;
  });
  if (pastExpert) {
    out.push({
      code: 'PL_TACTICS_PAST_EXPERT',
      severity: 'info',
      message:
        'An Expert-rated parry-lunger gains nothing from forced tactics — canon advice is to drop them and let the natural skills run.',
    });
  }
}

/**
 * Validate strategy.
 * @param plan -
 * @param warrior -
 */
export function validateStrategy(plan: FightPlan, warrior?: Warrior): StrategyWarning[] {
  const out: StrategyWarning[] = [];
  const OE = plan.OE ?? 5;
  const AL = plan.AL ?? 5;
  const KD = plan.killDesire ?? 5;

  // Global effort balance
  if (OE >= HIGH && AL >= HIGH) {
    out.push({
      code: 'OVER_EXERTION',
      severity: 'warn',
      message: 'Both OE and AL are very high — warrior will burn endurance fast.',
    });
  }
  if (OE <= LOW && AL <= LOW) {
    out.push({
      code: 'PASSIVE_PLAN',
      severity: 'warn',
      message: 'Both OE and AL are very low — expect a slow, indecisive fight.',
    });
  }
  if (KD >= 9 && AL <= 3) {
    out.push({
      code: 'LETHAL_UNDEFENDED',
      severity: 'warn',
      message: 'High kill desire with low defence — glass-cannon posture.',
    });
  }

  // Style vs. posture sanity — canon walls open hot (10-10-6, 9-6-6), so
  // only the true defensive styles draw the high-OE warning.
  if (plan.style === FightingStyle.TotalParry && OE >= HIGH) {
    out.push({
      code: 'STYLE_MISMATCH_OE',
      severity: 'warn',
      message: `${plan.style} is a defensive style but OE is aggressive.`,
    });
  }
  if (plan.style === FightingStyle.BashingAttack && AL >= HIGH) {
    out.push({
      code: 'STYLE_MISMATCH_AL',
      severity: 'info',
      message: 'Bashing attack rarely leans this heavily on defence.',
    });
  }

  // Canon ripper guidance (Arena 93): once a Parry-Riposte reaches master the
  // Riposte defensive tactic is redundant — the style's natural parry already
  // generates counters, so veteran rippers run Parry instead.
  if (warrior && plan.style === FightingStyle.ParryRiposte) {
    const fights = fightEquivalentsOf(warrior);
    const tier = getMastery(fights).tier;
    const riposteTactic =
      plan.defensiveTactic === 'Riposte' ||
      (['opening', 'mid', 'late'] as const).some(
        (p) => plan.phases?.[p]?.defensiveTactic === 'Riposte'
      );
    if ((tier === 'Master' || tier === 'Grandmaster') && riposteTactic) {
      out.push({
        code: 'PR_RIPOSTE_PAST_MASTER',
        severity: 'info',
        message:
          'A master-level ripper counters without the Riposte tactic — canon advice is to drop it for Parry.',
      });
    }
  }

  warnSlasherRhythm(plan, OE, AL, out);
  warnWallRhythm(plan, AL, out);
  warnLungerRhythm(plan, OE, AL, out);
  if (warrior) warnParryLungerTactics(plan, warrior, out);

  // Attribute fit — endurance-heavy plan vs. low WT warrior
  if (warrior?.attributes) {
    const wt = warrior.attributes.WT ?? 10;
    if (wt < 10 && OE + AL >= 16) {
      out.push({
        code: 'WT_TOO_LOW_FOR_EFFORT',
        severity: 'warn',
        message: `Low WT (${wt}) may collapse before this effort pays off.`,
      });
    }
  }

  // Per-phase sanity
  const phases = plan.phases ?? {};
  const phaseNames = ['opening', 'mid', 'late'] as const;
  for (const p of phaseNames) {
    const ps = phases[p] as PhaseStrategy | undefined;
    if (!ps) continue;
    if ((ps.OE ?? 5) >= 10 && (ps.AL ?? 5) >= 10) {
      out.push({
        code: `PHASE_${p.toUpperCase()}_SATURATED`,
        severity: 'warn',
        message: `${p} phase is capped on both OE and AL — unsustainable.`,
      });
    }
  }

  return out;
}

/**
 * Per-minute endurance-burn estimate used by the stamina curve preview.
 * Deterministic, decoupled from the full sim: intended as a UI heuristic only.
 * Defaults to BOUT_DURATION_MINUTES (MAX_EXCHANGES / EXCHANGES_PER_MINUTE).
 */
export function estimateStaminaCurve(
  plan: FightPlan,
  warrior?: Warrior,
  minutes = BOUT_DURATION_MINUTES
): number[] {
  const wt = warrior?.attributes?.WT ?? 10;
  const max = warrior?.derivedStats?.endurance ?? 50 + wt * 2;
  let cur = max;
  const out: number[] = [cur];
  const phases = plan.phases ?? {};
  for (let m = 1; m <= minutes; m++) {
    const phaseKey = getPhaseByMinute(m, MAX_EXCHANGES, EXCHANGES_PER_MINUTE);
    const ps = (phases as Record<string, PhaseStrategy | undefined>)[phaseKey];
    const OE = ps?.OE ?? plan.OE ?? 5;
    const AL = ps?.AL ?? plan.AL ?? 5;
    // Engine fatigue: oe * 0.18 + al * 0.09 per exchange, 3 exchanges per minute
    const burn = EXCHANGES_PER_MINUTE * (OE * 0.18 + AL * 0.09);
    cur = Math.max(0, cur - burn);
    out.push(cur);
  }
  return out;
}

/**
 * Returns the first minute (1-based) where stamina drops below thresholdRatio * max,
 * or null if stamina never crosses the threshold.
 */
export function predictedCollapseMinute(curve: number[], thresholdRatio = 0.2): number | null {
  const max = curve[0];
  if (max === undefined || max <= 0) return null;
  const threshold = max * thresholdRatio;
  for (let i = 1; i < curve.length; i++) {
    const v = curve[i];
    if (v !== undefined && v < threshold) return i;
  }
  return null;
}
