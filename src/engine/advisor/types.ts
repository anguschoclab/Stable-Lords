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
import type { BoutOffer, InsightToken, TrainingAssignment } from '@/types/state.types';
import type { Warrior } from '@/types/warrior.types';

/**
 * High-level campaign focus archetypes guiding weekly directives for a warrior.
 */
export type CampaignFocus =
  | 'TOURNAMENT_PUSH' // Contender peaking for seasonal tournament tier
  | 'PROSPECT_DEV' // Young fighter building attributes and core skills
  | 'PURSE_HUNTER' // Solvent prime fighter farming purses with controlled risk
  | 'REHABILITATION' // Injured or exhausted; hard combat block, Med Bay priority
  | 'VETERAN_TWILIGHT' // Age > 25; preserve legacy, cautious surrender thresholds
  | 'CROWN_BID'; // Ranked arena contender — every venue bout feeds the title ladder

/**
 * Explicit stable context for advisor evaluators so rival AI can reuse them
 * without silently reading the player's treasury, roster size, or intel.
 * Any omitted field falls back to the player-scoped GameState value.
 */
export interface StableEvalContext {
  /** Owning stable's treasury — drives purse-desperation weighting. */
  treasury?: number;
  /** Owning stable's roster size — drives the weekly burn projection. */
  rosterSize?: number;
  /** Intel tokens the evaluating stable actually holds (player: insightTokens;
   *  rivals: dossier-derived tokens). */
  insightTokens?: InsightToken[];
  /** Once-per-tick per-arena top-N contender ladder — lets CROWN_BID scoring
   *  recognize venue bouts that feed the title chase without re-ranking. */
  contenderIndex?: Map<string, WarriorId[]>;
}

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
 * A warrior's standing on a title ladder — the best-ranked championship
 * arena they contend at, or the crown they already hold. Derived from the
 * shared contender index, so it always matches what rival AI sees.
 */
export interface CrownStanding {
  arenaId: string;
  /** 1-based contender rank at the arena (undefined while reigning). */
  rank?: number;
  isChampion: boolean;
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
  /** Title-ladder standing — present only when the warrior reigns or is ranked. */
  crownStanding?: CrownStanding;
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
 * A single unresolved pre-advance checklist item: something the council
 * recommended that has not yet been applied to live state.
 */
export interface CouncilDirective {
  kind: 'unsigned-offer' | 'unassigned-training' | 'unapplied-tactics';
  warriorId: WarriorId;
  warriorName: string;
  label: string;
}

/** A bout already committed beyond the upcoming week. */
export interface FutureCommitment {
  offerId: BoutOfferId;
  warriorId: WarriorId;
  warriorName: string;
  opponentName: string;
  absoluteWeek: number;
  purse: number;
}

/** Projected absolute week an injured warrior returns to duty. */
export interface RecoveryEta {
  warriorId: WarriorId;
  warriorName: string;
  weeksRemaining: number;
  returnsAbsoluteWeek: number;
}

/**
 * Multi-week campaign horizon: everything on the calendar past next week —
 * committed bouts, injury return dates, and the tournament countdown.
 */
export interface CouncilLookahead {
  futureCommitments: FutureCommitment[];
  recoveryEtas: RecoveryEta[];
  /** Weeks until the next seasonal tournament bracket (0 during a tournament week). */
  weeksUntilTournament: number;
  projectedContenders: { warriorId: WarriorId; warriorName: string; tierName: string }[];
  /** Title-defense obligations on player-held crowns — a defense is due when
   *  the reign's activity gap reaches ARENA_TITLE.DEFENSE_INTERVAL_WEEKS. */
  titleDefenses: {
    arenaId: string;
    warriorId: WarriorId;
    warriorName: string;
    dueAbsoluteWeek: number;
  }[];
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
  /**
   * Pre-advance checklist — council recommendations not yet reflected in
   * live state (unsigned contracts, missing assignments, stale tactics).
   */
  unresolvedDirectives: CouncilDirective[];
  /** Multi-week campaign horizon — commitments and countdowns past next week. */
  lookahead: CouncilLookahead;
}
