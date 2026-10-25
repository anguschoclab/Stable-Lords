import type { PlanCondition } from './conditionalPlans';
import { FightingStyle } from './fightingStyles';
import type { DistanceRange } from './spatial';
import type { EquipmentLoadout } from '@/data/equipment';

/**
 * Defines the shape of weapon.
 */

/**
 * Attack target type.
 */

/**
 * Attack target type.
 */
export type AttackTarget =
  'Head' | 'Chest' | 'Abdomen' | 'Right Arm' | 'Left Arm' | 'Right Leg' | 'Left Leg' | 'Any';

/**
 * Protect target type.
 */
export type ProtectTarget = 'Head' | 'Body' | 'Arms' | 'Legs' | 'Any';

/**
 * Offensive tactic type.
 */
export type OffensiveTactic = 'Lunge' | 'Slash' | 'Bash' | 'Decisiveness' | 'none';

/**
 * Defensive tactic type.
 */
export type DefensiveTactic = 'Dodge' | 'Parry' | 'Riposte' | 'Responsiveness' | 'none';

/**
 * Defines the shape of phase strategy.
 */
export interface PhaseStrategy {
  OE: number;
  AL: number;
  killDesire: number;
  offensiveTactic?: OffensiveTactic;
  defensiveTactic?: DefensiveTactic;
  target?: AttackTarget;
  aggressionBias?: number; // 0-10
}

/**
 * In-bout deception: the fighter really performs these axes
 * (and optional tactics) until `untilPhase`, then snaps to the real plan —
 * a `DECOY_REVEAL` reason code marks the reveal. Unlike `planMasked`
 * (scouting-level), the decoy costs real performance: the opponent's
 * tactic-streak and momentum reads build on the decoy pattern.
 */
export interface DecoyAxes {
  /** The phase at which the mask drops: 'mid' masks the opening, 'late' masks opening+mid. */
  untilPhase: 'mid' | 'late';
  OE: number;
  AL: number;
  killDesire?: number;
  offensiveTactic?: OffensiveTactic;
  defensiveTactic?: DefensiveTactic;
}

/**
 * Boundary-reactive phase curve: evaluated once at the named
 * phase boundary — unlike per-exchange condition overrides, a fired shift
 * is committed for the rest of that phase even if the read swings back.
 */
export interface PhaseShiftDecl {
  /** The phase boundary at which the read is evaluated and the shift applies. */
  at: 'mid' | 'late';
  /** The fight-state read that gates the shift. */
  when: 'MOMENTUM_BEHIND' | 'MOMENTUM_AHEAD' | 'HP_BEHIND' | 'HP_AHEAD';
  OE: number;
  AL: number;
  killDesire?: number;
  aggressionBias?: number;
}

/**
 * Defines the shape of desperate plan.
 */
export interface DesperatePlan {
  OE: number;
  AL: number;
  killDesire?: number;
  offensiveTactic?: OffensiveTactic;
  defensiveTactic?: DefensiveTactic;
  target?: AttackTarget;
  protect?: ProtectTarget;
}

/**
 * Canon "special strategy" slots: an alternate plan used when the warrior is
 * the bout's proposer and/or when they are the one being challenged. Resolved
 * once at plan-selection time (before the fight), then in-fight mechanics
 * (conditions, desperatePlan, phase shifts) apply on top as usual.
 */
export interface ChallengePlans {
  /** Applied when this warrior's stable proposed the bout. Partial override —
   *  only the fields listed are swapped over the base plan. */
  whenProposer?: Partial<DesperatePlan>;
  /** Applied when another stable's challenge brought this bout. */
  whenChallenged?: Partial<DesperatePlan>;
}

/**
 * Defines the shape of fight plan.
 */
export interface FightPlan {
  style: FightingStyle;
  OE: number;
  AL: number;
  killDesire?: number;
  aggressionBias?: number;
  openingMove?: 'Safe' | 'Aggressive' | 'Measured';
  fallbackCondition?: 'FLEE' | 'TURTLE' | 'BERZERK' | 'YIELD' | 'None';
  target?: AttackTarget;
  protect?: ProtectTarget;
  offensiveTactic?: OffensiveTactic;
  defensiveTactic?: DefensiveTactic;
  equipment?: EquipmentLoadout;
  /** Overrides ALL strategy when fighter is desperate (HP < 30% OR endurance < 20%). Canonical "Desperate" slot. */
  desperatePlan?: DesperatePlan;
  phases?: {
    opening?: PhaseStrategy;
    mid?: PhaseStrategy;
    late?: PhaseStrategy;
  };
  /** Conditional overrides evaluated mid-fight based on fight state. First match wins. */
  conditions?: PlanCondition[];
  /** 0-10 tendency to feint; only triggers when WT ≥ 15 and OE ≥ 4 */
  feintTendency?: number;
  /** Committed in-bout deception — see {@link DecoyAxes}. */
  decoyAxes?: DecoyAxes;
  /** Boundary-reactive phase shifts — see {@link PhaseShiftDecl}. */
  phaseShiftOn?: PhaseShiftDecl[];
  /** Preferred range — influences Approach roll motivation bonus (+2 when contesting toward this range) */
  rangePreference?: DistanceRange;
  /** Stable owner's personality — drives in-bout adaptation conditions (see ownerAI.ts). Undefined for player-authored plans. */
  ownerPersonality?: 'Aggressive' | 'Methodical' | 'Showman' | 'Pragmatic' | 'Tactician';
  /** Challenge-context alternate plans — see {@link ChallengePlans}. */
  challengePlans?: ChallengePlans;
}
