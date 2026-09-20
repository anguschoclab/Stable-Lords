import {
  type WeatherType,
  type WarriorId,
  type StableId,
  type PromoterId,
  type TournamentId,
  type BoutOfferId,
  type LedgerEntryId,
  type ScoutReportId,
  type NewsId,
  type GrudgeId,
  type RivalryId,
  type InsightId,
  type HallEntryId,
  type SimulationReportId,
  type Season,
  type CrowdMoodType,
  type NewsletterItem,
  type TrainerTier,
  type TrainerFocus,
  type Trainer,
  type ScoutQuality,
  type FightingStyle,
  type FightId,
  type Attributes,
  type BaseSkills,
} from './shared.types';

import { type Warrior, type DeathEvent } from './warrior.types';
import { type CrestData } from './crest.types';
import type { Bookmark } from './bookmark.types';

export type {
  Warrior,
  DeathEvent,
  WeatherType,
  Season,
  CrowdMoodType,
  NewsletterItem,
  TrainerTier,
  TrainerFocus,
  Trainer,
  ScoutQuality,
  CrestData,
};
import { type FightSummary, type FightOutcomeBy } from './combat.types';
export type { FightSummary, FightOutcomeBy };
import type { PoolWarrior } from '@/engine/recruitment';
import type { ContentPack } from '@/lib/contentPacks';
export type { PoolWarrior };

// ─── Ranking & Contracts ───────────────────────────────────────────────────

/**
 * Defines the shape of ranking entry.
 */
export interface RankingEntry {
  overallRank: number;
  classRank: number;
  compositeScore: number;
}

/**
 * Bout offer status type.
 */
export type BoutOfferStatus = 'Proposed' | 'Signed' | 'Rejected' | 'Canceled' | 'Expired';

/**
 * Bout offer response type.
 */
export type BoutOfferResponse = 'Pending' | 'Accepted' | 'Declined' | 'Countered';

/**
 * Defines the shape of bout offer.
 */
export interface BoutOffer {
  id: BoutOfferId;
  promoterId: PromoterId;
  warriorIds: WarriorId[];
  boutWeek: number;
  expirationWeek: number;
  purse: number;
  hype: number;
  status: BoutOfferStatus;
  responses: Record<WarriorId, BoutOfferResponse>;
  proposerStableId?: StableId;
  conditions?: string[];
  createdAt?: string;
  /** Arena where this bout will take place. Absent only for legacy/tournament offers. */
  arenaId?: string;
  /** Absolute week when this offer was created. Disambiguates boutWeek/expirationWeek
   *  which are stored as display weeks (1–52). Legacy saves omit this field. */
  createdAbsoluteWeek?: number;
  /** Purse increase demanded by the last counter (COUNTERED_PURSE round).
   *  The proposer stable must afford this bump for the counter to sign. */
  counterPurseBump?: number;
}

/**
 * Promoter personality type.
 */
export type PromoterPersonality = 'Greedy' | 'Honorable' | 'Sadistic' | 'Flashy' | 'Corporate';

/**
 * Defines the shape of promoter.
 */
export interface Promoter {
  id: PromoterId;
  name: string;
  age: number;
  personality: PromoterPersonality;
  tier: 'Local' | 'Regional' | 'National' | 'Legendary';
  capacity: number; // Max bouts per week
  biases: FightingStyle[];
  arenaPool?: string[];
  history: {
    totalPursePaid: number;
    notableBouts: FightId[];
    mentorId?: PromoterId;
    legacyFame: number;
  };
}

// ─── Owner / Stable ─────────────────────────────────────────────────────────

import { OWNER_PERSONALITIES, META_ADAPTATIONS } from './enumSources';

/**
 * Owner personality type.
 */
export type OwnerPersonality = (typeof OWNER_PERSONALITIES)[number];

/**
 * Meta adaptation type.
 */
export type MetaAdaptation = (typeof META_ADAPTATIONS)[number];

/**
 * Defines the shape of owner.
 */
export interface Owner {
  id: StableId;
  name: string;
  stableName: string;
  fame: number;
  renown: number;
  titles: number;
  personality?: OwnerPersonality;
  metaAdaptation?: MetaAdaptation;
  favoredStyles?: FightingStyle[];
  generation?: number; // 🛡️ Crest lineage depth (0 = original founder)
  crest?: CrestData; // 🛡️ Heraldic crest for the stable
  backstoryId?: import('@/data/backstories').BackstoryId;
  foundedByWarriorId?: WarriorId; // Lineage breadcrumb for legacy founders
  age?: number; // 🎂 1.0 Hardening: Owner age for retirement
  ageRetired?: number; // Week the previous owner retired
}

// ─── Game State ─────────────────────────────────────────────────────────────

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
  | 'TOURNAMENT_CAMPAIGN';

/**
 * Defines the shape of ai strategy.
 */
export interface AIStrategy {
  intent: AIIntent;
  targetStableId?: StableId;
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
  | 'TOURNAMENT_PREP';

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

// ─── Simulation & Awards ────────────────────────────────────────────────────

/**
 * Defines the shape of simulation report.
 */
export interface SimulationReport {
  absoluteWeek?: number;
  id: SimulationReportId;
  week: number;
  treasuryChange: number;
  trainingGains: {
    warriorId: WarriorId;
    warriorName: string;
    attr: keyof Attributes;
    gain: number;
  }[];
  agingEvents: string[];
  healthEvents: string[];
  bouts?: import('@/types/combat.types').FightSummary[];
}

/**
 * Annual award type type.
 */
export type AnnualAwardType =
  'WARRIOR_OF_YEAR' | 'KILLER_OF_YEAR' | 'STABLE_OF_YEAR' | 'CLASS_MVP' | 'TOURNAMENT_RANK';

/**
 * Defines the shape of annual award.
 */
export interface AnnualAward {
  year: number;
  type: AnnualAwardType;
  warriorId?: WarriorId;
  warriorName?: string;
  stableId?: StableId;
  stableName?: string;
  style?: FightingStyle;
  value: number; // e.g. 15 wins, 5 kills
  reason: string;
}

/**
 * Identifier for a progression objective.
 */
export type ObjectiveId =
  'TOP_10_STABLE' | 'TOP_3_STABLE' | 'FIRST_TOURNAMENT_WIN' | 'HALL_OF_FAMER' | 'REALM_CHAMPION';

/**
 * Defines the shape of a progression objective.
 */
export interface ProgressionObjective {
  id: ObjectiveId;
  label: string;
  description: string;
  completed: boolean;
  completedWeek?: number;
  completedYear?: number;
}

/**
 * Status of the overall progression campaign.
 */
export type ProgressionStatus = 'active' | 'won' | 'continued';

/**
 * Defines the shape of progression state.
 */
export interface ProgressionState {
  status: ProgressionStatus;
  stableStanding: number;
  totalStables: number;
  objectives: ProgressionObjective[];
  wonYear?: number;
  wonWeek?: number;
  acknowledgedWin?: boolean;
}
/**
 * Defines the shape of deferred bout log.
 */

/**
 * Defines the shape of deferred bout log.
 */
export interface DeferredBoutLog {
  year: number;
  season: number;
  boutId: string;
  transcript: string[];
}

/** Player-configurable house rules (non-canonical variants). */
export interface HouseRules {
  /** Kill-window probability multiplier applied to every bout. 1 = canonical. */
  deathRateMult: number;
  /** When true, fatal blows become career-threatening injuries, never deaths. */
  severeInjuryInsteadOfDeath: boolean;
}

/** Canonical (full permadeath) house rules — the default game. */
export const CANONICAL_HOUSE_RULES: HouseRules = {
  deathRateMult: 1,
  severeInjuryInsteadOfDeath: false,
};

/**
 * Defines the shape of game state.
 */
export interface GameState {
  meta: {
    gameName: string;
    version: string;
    createdAt: string;
  };
  pendingResolutionData?: {
    gazette: NewsletterItem[];
    injuries: string[];
    deaths: string[];
    bouts: import('@/engine/bout').BoutResult[];
    promotions: string[];
  };
  lastWeekBoutDisplay?: {
    results: import('@/engine/bout').BoutResult[];
    deathNames: string[];
    injuryNames: string[];
  };
  ftueComplete: boolean;
  ftueStep?: number;
  coachDismissed: string[];
  /**
   * Optional house rules (Design Bible §House Rules and Mods). Absent or
   * canonical values mean standard full-permadeath play; any weakening of
   * permadeath is a non-canonical house rule and must be labeled as such in UI.
   */
  houseRules?: HouseRules;
  /** Installed content packs (Design Bible #36) — narrative overlays only. */
  contentPacks?: ContentPack[];
  player: Owner;
  fame: number;
  popularity: number;
  treasury: number;
  ledger: LedgerEntry[];
  week: number;
  year: number; // 🌩️ Calendar Authority (v1.0)
  /** Monotonic week counter — never resets at year rollover. All cross-week
   *  scheduling math (offers, countdowns) uses this; `week` is display-only. */
  absoluteWeek: number;
  phase: 'planning' | 'resolution';
  season: Season;
  weather: WeatherType;
  roster: Warrior[];
  graveyard: Warrior[];
  retired: Warrior[];
  arenaHistory: FightSummary[];
  newsletter: NewsletterItem[];
  gazettes: GazetteStory[];
  hallOfFame: HallEntry[];
  crowdMood: CrowdMoodType;
  tournaments: TournamentEntry[];
  trainers: Trainer[];
  hiringPool: Trainer[];
  trainingAssignments: TrainingAssignment[];
  seasonalGrowth: SeasonalGrowth[];
  rivals: RivalStableData[];
  scoutReports: ScoutReportData[];
  restStates: RestState[];
  rivalries: Rivalry[];
  matchHistory: MatchRecord[];
  playerChallenges: string[];
  playerAvoids: string[];
  recruitPool: PoolWarrior[];
  rosterBonus: number;
  ownerGrudges: OwnerGrudge[];
  insightTokens: InsightToken[];
  moodHistory: { week: number; mood: CrowdMoodType }[];
  isFTUE: boolean;
  unacknowledgedDeaths: string[];
  // ─── Daily Progression ───
  day: number; // 0-7
  isTournamentWeek: boolean;
  activeTournamentId?: TournamentId;
  // ─── Promoter System ───
  promoters: Record<PromoterId, Promoter>;
  boutOffers: Record<BoutOfferId, BoutOffer>;
  realmRankings: Record<WarriorId, RankingEntry>;
  awards: AnnualAward[];
  lastSimulationReport?: SimulationReport;
  cachedMetaDrift?: import('@/engine/metaDrift').StyleMeta;
  warriorMap?: Map<WarriorId, import('@/types/warrior.types').Warrior>;
  warriorToStableMap?: Map<string, { stableId: string; isPlayer: boolean }>;
  rivalMap?: Map<string, import('@/types/state.types').RivalStableData>;
  rivalryMap?: Map<string, Rivalry>;
  grudgeMap?: Map<string, OwnerGrudge>;
  warriorToOfferIds?: Map<WarriorId, BoutOfferId[]>;
  bookmarks: Bookmark[];
  deferredBoutLogs?: DeferredBoutLog[];
  progression: ProgressionState;
}

/**
 * Defines the shape of ui prefs.
 */
export interface UIPrefs {
  autoTunePlan: boolean;
  dashboardLayout?: string[];
}
