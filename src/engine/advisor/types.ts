/**
 * The Lanista's War Council — Advisor System Domain Types
 * Strict typed contracts for campaign pacing, bout selection, training recommendations,
 * and battle plan optimizations.
 */
import type {
  FightingStyle,
  Attributes,
  BaseSkills,
  OffensiveTactic,
  DefensiveTactic,
  WarriorId,
  BoutOfferId,
  FightPlan,
} from '@/types/shared.types';
import type { BoutOffer, TrainingAssignment } from '@/types/state.types';
import type { Warrior } from '@/types/warrior.types';

/**
 * High-level campaign focus archetypes guiding weekly directives for a warrior.
 */
export type CampaignFocus =
  | 'TOURNAMENT_PUSH' // Contender peaking for seasonal tournament tier
  | 'PROSPECT_DEV' // Young fighter building attributes and core skills
  | 'PURSE_HUNTER' // Solvent prime fighter farming purses with controlled risk
  | 'REHABILITATION' // Injured or exhausted; hard combat block, Med Bay priority
  | 'VETERAN_TWILIGHT'; // Age > 25; preserve legacy, cautious surrender thresholds

/**
 * Fight recommendation action directive.
 */
export type FightRecommendationAction =
  | 'ACCEPT_OFFER'
  | 'REST_RECOMMENDED'
  | 'NO_VIABLE_OFFERS'
  | 'BLOCKED_BY_INJURY';

/**
 * Danger assessment tier for combat.
 */
export type CombatDangerLevel = 'SAFE' | 'MODERATE' | 'HAZARDOUS' | 'LETHAL';

/**
 * Per-warrior fight advice.
 */
export interface WarriorFightAdvice {
  action: FightRecommendationAction;
  recommendedOfferId?: BoutOfferId;
  recommendedOffer?: BoutOffer;
  opponent?: Warrior | null;
  matchupEdge?: number;
  headline: string;
  reasoning: string[];
  warnings: string[];
  dangerLevel: CombatDangerLevel;
}

/**
 * Per-warrior seasonal tournament status and pacing advice.
 */
export interface WarriorTournamentAdvice {
  qualifiedTier: 'Gold' | 'Silver' | 'Bronze' | 'Iron' | null;
  tierName: string | null;
  overallRank: number | null;
  isParticipant: boolean;
  weeksUntilTournament: number;
  status: 'CONTENDER_REST' | 'ACTIVE_ROUND' | 'QUALIFYING' | 'OFF_SEASON' | 'NONE';
  headline: string;
  details: string;
}

/**
 * Per-warrior training and development recommendation.
 */
export interface WarriorTrainingAdvice {
  mode: 'attribute' | 'recovery' | 'skillDrill' | 'trait';
  targetAttribute?: keyof Attributes;
  targetSkill?: keyof BaseSkills;
  targetTrainerId?: string;
  gainChance?: number;
  headline: string;
  reasoning: string;
  burnWarning?: string;
}

/**
 * Per-warrior tactics and loadout audit advice.
 */
export interface WarriorTacticsAdvice {
  bestOffensiveTactic: OffensiveTactic;
  bestDefensiveTactic: DefensiveTactic;
  suggestedOE: number;
  suggestedAL: number;
  fallbackCondition?: 'FLEE' | 'TURTLE' | 'BERZERK' | 'YIELD' | 'None';
  gearNotes: string[];
}

/**
 * Atomic mutation payload to apply the advisor's recommendation for a warrior.
 */
export interface WarriorActionPayload {
  warriorId: WarriorId;
  /**
   * Omitted when the warrior is booked to fight or is being held available for
   * bookings — isBookable() excludes warriors holding any assignment, so
   * assigning one would suppress next week's offers/challenges.
   */
  trainingAssignment?: TrainingAssignment;
  boutOfferIdToAccept?: BoutOfferId;
  tacticsPlanPatch?: Partial<FightPlan>;
}

/**
 * Unified advisor card for a single warrior.
 */
export interface WarriorAdvisorCard {
  warriorId: WarriorId;
  warriorName: string;
  style: FightingStyle;
  campaignFocus: CampaignFocus;
  suggestedCampaignFocus: CampaignFocus;
  fatigueStatus: { band: 'fresh' | 'elevated' | 'exhausted'; value: number };
  injuryStatus: { isInjured: boolean; severities: string[]; requiresRecovery: boolean };
  fightAdvice: WarriorFightAdvice;
  tournamentAdvice: WarriorTournamentAdvice;
  trainingAdvice: WarriorTrainingAdvice;
  tacticsAdvice: WarriorTacticsAdvice;
  headlineSummary: string;
  actionPayload: WarriorActionPayload;
}

/**
 * Stable-wide aggregate council summary and batch execution directives.
 */
export interface StableAdvisorSummary {
  totalWarriors: number;
  combatReadyCount: number;
  rehabCount: number;
  tournamentContenderCount: number;
  unassignedTrainingCount: number;
  pendingBoutOffersCount: number;
  projectedPurseGold: number;
  projectedTrainingCost: number;
  treasury: number;
  solvencyWarning?: string;
  stableDirectives: string[];
  allActionPayloads: WarriorActionPayload[];
}

/**
 * Full report returned by the Master Council Service.
 */
export interface StableCouncilReport {
  summary: StableAdvisorSummary;
  cards: WarriorAdvisorCard[];
}
