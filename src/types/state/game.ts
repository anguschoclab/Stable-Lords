import type { FightOutcomeBy } from '../combat.types';
import type { CrestData } from '../crest.types';
import type { CrowdMoodType, FightId, GrudgeId, HallEntryId, InsightId, LedgerEntryId, NewsId, RivalryId, ScoutQuality, ScoutReportId, Season, StableId, TournamentId, Trainer, WarriorId } from '../shared.types';
import type { Attributes, BaseSkills, FightingStyle, Warrior } from '../warrior.types';
import type { Owner } from './owner';




/**
 * Defines the shape of tournament bout.
 */
export interface TournamentBout {
  round: number;
  matchIndex: number;
  warriorIdA: WarriorId;
  warriorIdD: WarriorId;
  stableIdA?: StableId;
  stableIdD?: StableId;
  winner?: 'A' | 'D' | null;
  by?: FightOutcomeBy;
  fightId?: FightId;
  /** Third-place playoff — terminal bout whose winner does NOT advance. */
  isBronzeMatch?: boolean;
}



/**
 * Defines the shape of tournament entry.
 */
export interface TournamentEntry {
  id: TournamentId;
  season: Season;
  week: number;
  tierId: string; // 🌩️ Tier Identity (v1.0)
  name: string;
  bracket: TournamentBout[];
  participants: Warrior[];
  champion?: string;
  completed: boolean;
}



/**
 * Defines the shape of training assignment.
 */
export interface TrainingAssignment {
  warriorId: WarriorId;
  type: 'attribute' | 'recovery' | 'skillDrill' | 'trait';
  attribute?: keyof Attributes;
  /** For skillDrill assignments — which combat skill to drill (ATT/PAR/DEF/INI/RIP/DEC). */
  skill?: keyof BaseSkills;
  /** Trait training: which trainer is teaching (sets the tier ceiling + pool). */
  trainerId?: string;
  /** Trait training: weeks left before the outcome roll. Counts down each week. */
  weeksRemaining?: number;
}



/**
 * Defines the shape of seasonal growth.
 */
export interface SeasonalGrowth {
  warriorId: WarriorId;
  season: Season;
  gains: Partial<Record<keyof Attributes, number>>;
}



/**
 * Defines the shape of ledger entry.
 */
export interface LedgerEntry {
  id: LedgerEntryId;
  week: number;
  label: string;
  amount: number;
  category: 'fight' | 'training' | 'recruit' | 'trainer' | 'upkeep' | 'prize' | 'other';
}



/**
 * Ai intent type.
 */
export type AIIntent =
  | 'EXPANSION'
  | 'CONSOLIDATION'
  | 'VENDETTA'
  | 'RECOVERY'
  | 'SURVIVAL'
  | 'WEALTH_ACCUMULATION'
  | 'AGGRESSIVE_EXPANSION'
  | 'ROSTER_DIVERSITY'
  | 'TOURNAMENT_CAMPAIGN'
  | 'CROWN_CAMPAIGN';



/**
 * Defines the shape of ai strategy.
 */
export interface AIStrategy {
  intent: AIIntent;
  targetStableId?: StableId;
  /** Arena the stable is campaigning for under CROWN_CAMPAIGN. */
  targetArenaId?: string;
  planWeeksRemaining: number;
  /** Human-readable explanation of why this intent was chosen (UI-facing). */
  reason?: string;
}



// TrainerData was here, now using Trainer from shared.types

/**
 * Typed reason an AI action was taken. Intent values mean the action was
 * intent-driven; the non-intent members tag systemic events. Replaces the
 * old English-substring intent inference in logAgentAction.
 */
export type AIEventCause =
  | AIIntent
  | 'BOUT_OUTCOME'
  | 'INTEL_UPDATE'
  | 'MAINTENANCE'
  | 'TOURNAMENT_PREP'
  | 'CROWN_DEFENSE'
  | 'CROWN_RELINQUISH'
  | 'CROWN_PREP';



/**
 * Defines the shape of ai event.
 */
export interface AIEvent {
  id: string; // Events are often transient or don't need branding if not referenced
  week: number;
  type: 'STRATEGY' | 'FINANCE' | 'ROSTER' | 'STAFF' | 'BOUT' | 'INTEL';
  description: string;
  riskTier: 'Low' | 'Medium' | 'High';
  cause?: AIEventCause;
}



/**
 * What a rival stable believes about another stable. `recordVs` and
 * `knownStyles` are observed facts; `estimatedThreat` is an inferred belief
 * that regresses toward uncertainty as `lastSeenWeek` stales.
 */
export interface OpponentDossier {
  lastSeenWeek: number;
  knownStyles: FightingStyle[];
  estimatedThreat: number; // 0..1
  recordVs: { w: number; l: number; k: number };
  planIntel?: {
    suspectedOE?: number;
    suspectedAL?: number;
    lastPlanWeek?: number;
  };
  /** Plan tendencies witnessed directly in fights this stable watched —
   *  normalized 0–1 running mean of observed OE/AL with a sample count.
   *  Consumed by crown targeting, offer eval, and scout blending. */
  observedTells?: {
    oe: number;
    al: number;
    samples: number;
    lastSeenWeek: number;
  };
}



/**
 * A rival stable's chosen crown target: which warrior is climbing which
 * arena's title ladder, and why. Refreshed each tick by the crown worker;
 * consumed one tick later by the intent engine (memory is allowed to lag).
 */
export interface CrownAssessment {
  arenaId: string;
  warriorId: WarriorId;
  score: number;
  reason: string;
}



/**
 * Defines the shape of ai agent memory.
 */
export interface AIAgentMemory {
  lastTreasury: number;
  burnRate: number;
  metaAwareness: Record<string, number>;
  knownRivals: StableId[];
  currentIntent?: AIIntent;
  seasonRecord?: {
    wins: number;
    losses: number;
    kills: number;
    rosterSizeAtSeasonStart: number;
  };
  lastSeasonRecord?: {
    wins: number;
    losses: number;
    kills: number;
    rosterSizeAtSeasonStart: number;
  };
  /** Perceived opponent intel keyed by stable id (player stable included). */
  opponentDossiers: Record<string, OpponentDossier>;
  /** Top reasons recent bouts were lost, most recent first, capped at 3. */
  lastLossFactors?: string[];
  /** Current crown target — the stable's best (warrior, arena) campaign. */
  crownAssessment?: CrownAssessment;
  /** Arena id whose crown the stable intends to vacate — consumed by the
   *  championship pass (real relinquish happens through its delta). */
  pendingRelinquish?: string;
}



/**
 * Defines the shape of rival stable data.
 */
export interface RivalStableData {
  id: StableId;
  owner: Owner;
  fame: number;
  roster: Warrior[];
  trainers?: Trainer[];
  treasury: number;
  strategy?: AIStrategy;
  agentMemory?: AIAgentMemory;
  actionHistory?: AIEvent[];
  /** Absolute week this stable entered the world (world-seeded stables are
   *  undefined/0; successor stables minted mid-run carry their mint week so
   *  liveness checks don't flag a stable that has had no week to act). */
  establishedAbsoluteWeek?: number;
  motto?: string;
  origin?: string;
  philosophy?: string;
  tier?: 'Minor' | 'Established' | 'Major' | 'Legendary';
  crest?: CrestData;
  seasonalGrowth?: SeasonalGrowth[];
  ledger: LedgerEntry[];
  trainingAssignments: TrainingAssignment[];
  /** Set by processAIRosterManagement when the roster is below its personality
   *  floor — the unified recruitment path (aiDraftFromPool) acts on it. */
  needsRecruit?: boolean;
  /** Season index of the last poach bid tabled by this stable — enforces the
   *  once-per-season poaching cadence (G.2). */
  lastPoachSeason?: number;
}



/**
 * Defines the shape of scout report data.
 */
export interface ScoutReportData {
  id: ScoutReportId;
  warriorName: string;
  style: string;
  quality: ScoutQuality;
  week: number;
  attributeRanges: Partial<Record<keyof Attributes, string>>;
  record: string;
  knownInjuries: string[];
  suspectedOE?: string;
  suspectedAL?: string;
  /** True when the target stable is known to mask its committed plan —
   *  the report's plan section may reflect a decoy. */
  possiblyMaskedPlan?: boolean;
  notes: string;
}



/**
 * Defines the shape of rest state.
 */
export interface RestState {
  warriorId: WarriorId;
  restUntilWeek: number;
}



/**
 * Defines the shape of rivalry.
 */
export interface Rivalry {
  id: RivalryId;
  stableIdA: StableId;
  stableIdB: StableId;
  intensity: number;
  reason: string;
  startWeek: number;
}



/**
 * Defines the shape of match record.
 */
export interface MatchRecord {
  week: number;
  playerWarriorId: WarriorId;
  opponentWarriorId: WarriorId;
  opponentStableId: StableId;
}



/**
 * Defines the shape of owner grudge.
 */
export interface OwnerGrudge {
  id: GrudgeId;
  ownerIdA: StableId;
  ownerIdB: StableId;
  intensity: number;
  reason: string;
  startWeek: number;
  lastEscalation: number;
}



/**
 * Defines the shape of gazette story.
 */
export interface GazetteStory {
  id: NewsId;
  headline: string;
  body: string;
  mood: CrowdMoodType;
  tags: string[];
  week: number;
}



/**
 * Insight token type type.
 */
export type InsightTokenType = 'Weapon' | 'Rhythm' | 'Style' | 'Attribute' | 'Tactic' | 'Trait';



/**
 * Defines the shape of insight token.
 */
export interface InsightToken {
  id: InsightId;
  type: InsightTokenType;
  warriorId: WarriorId;
  warriorName: string;
  detail: string;
  targetKey?: string;
  origin?: string;
  discoveredWeek: number;
}



/**
 * Defines the shape of hall entry.
 */
export interface HallEntry {
  id: HallEntryId;
  week: number;
  label: 'Fight of the Week' | 'Fight of the Tournament';
  fightId: FightId;
}
