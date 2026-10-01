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
  /** Preferred range — influences Approach roll motivation bonus (+2 when contesting toward this range) */
  rangePreference?: DistanceRange;
  /** Stable owner's personality — drives in-bout adaptation conditions (see ownerAI.ts). Undefined for player-authored plans. */
  ownerPersonality?: 'Aggressive' | 'Methodical' | 'Showman' | 'Pragmatic' | 'Tactician';
}
