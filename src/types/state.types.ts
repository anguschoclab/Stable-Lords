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
export type { PoolWarrior }; /**
 * Defines the shape of ranking entry.
 */

// ─── Ranking & Contracts ───────────────────────────────────────────────────

/**
 * Defines the shape of ranking entry.
 */
export interface RankingEntry {
  overallRank: number;
  classRank: number;
  compositeScore: number;
} /**
 * Bout offer status type.
 */

/**
 * Bout offer status type.
 */
export type BoutOfferStatus = 'Proposed' | 'Signed' | 'Rejected' | 'Canceled' | 'Expired'; /**
 * Bout offer response type.
 */

/**
 * Bout offer response type.
 */
export type BoutOfferResponse = 'Pending' | 'Accepted' | 'Declined'; /**
 * Defines the shape of bout offer.
 */

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
} /**
 * Promoter personality type.
 */

/**
 * Promoter personality type.
 */
export type PromoterPersonality = 'Greedy' | 'Honorable' | 'Sadistic' | 'Flashy' | 'Corporate'; /**
 * Defines the shape of promoter.
 */

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
  history: {
    totalPursePaid: number;
    notableBouts: FightId[];
    mentorId?: PromoterId;
    legacyFame: number;
  };
} /**
 * Owner personality type.
 */

// ─── Owner / Stable ─────────────────────────────────────────────────────────

import { OWNER_PERSONALITIES, META_ADAPTATIONS } from './enumSources';

/**
 * Owner personality type.
 */
export type OwnerPersonality = (typeof OWNER_PERSONALITIES)[number];

/**
 * Meta adaptation type.
 */
export type MetaAdaptation = (typeof META_ADAPTATIONS)[number]; /**
 * Defines the shape of owner.
 */

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
} /**
 * Defines the shape of tournament bout.
 */

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
} /**
 * Defines the shape of tournament entry.
 */

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
} /**
 * Defines the shape of training assignment.
 */

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
} /**
 * Defines the shape of seasonal growth.
 */

/**
 * Defines the shape of seasonal growth.
 */
export interface SeasonalGrowth {
  warriorId: WarriorId;
  season: Season;
  gains: Partial<Record<keyof Attributes, number>>;
} /**
 * Defines the shape of ledger entry.
 */

/**
 * Defines the shape of ledger entry.
 */
export interface LedgerEntry {
  id: LedgerEntryId;
  week: number;
  label: string;
  amount: number;
  category: 'fight' | 'training' | 'recruit' | 'trainer' | 'upkeep' | 'prize' | 'other';
} /**
 * Ai intent type.
 */

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
  | 'ROSTER_DIVERSITY'; /**
 * Defines the shape of ai strategy.
 */

/**
 * Defines the shape of ai strategy.
 */
export interface AIStrategy {
  intent: AIIntent;
  targetStableId?: StableId;
  planWeeksRemaining: number;
} /**
 * Defines the shape of ai event.
 */

// TrainerData was here, now using Trainer from shared.types

/**
 * Defines the shape of ai event.
 */
export interface AIEvent {
  id: string; // Events are often transient or don't need branding if not referenced
  week: number;
  type: 'STRATEGY' | 'FINANCE' | 'ROSTER' | 'STAFF';
  description: string;
  riskTier: 'Low' | 'Medium' | 'High';
} /**
 * Defines the shape of ai agent memory.
 */

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
} /**
 * Defines the shape of rival stable data.
 */

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
} /**
 * Defines the shape of scout report data.
 */

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
} /**
 * Defines the shape of rest state.
 */

/**
 * Defines the shape of rest state.
 */
export interface RestState {
  warriorId: WarriorId;
  restUntilWeek: number;
} /**
 * Defines the shape of rivalry.
 */

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
} /**
 * Defines the shape of match record.
 */

/**
 * Defines the shape of match record.
 */
export interface MatchRecord {
  week: number;
  playerWarriorId: WarriorId;
  opponentWarriorId: WarriorId;
  opponentStableId: StableId;
} /**
 * Defines the shape of owner grudge.
 */

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
} /**
 * Defines the shape of gazette story.
 */

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
} /**
 * Insight token type type.
 */

/**
 * Insight token type type.
 */
export type InsightTokenType = 'Weapon' | 'Rhythm' | 'Style' | 'Attribute' | 'Tactic' | 'Trait'; /**
 * Defines the shape of insight token.
 */

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
} /**
 * Defines the shape of hall entry.
 */

/**
 * Defines the shape of hall entry.
 */
export interface HallEntry {
  id: HallEntryId;
  week: number;
  label: 'Fight of the Week' | 'Fight of the Tournament';
  fightId: FightId;
} /**
 * Defines the shape of simulation report.
 */

// ─── Simulation & Awards ────────────────────────────────────────────────────

/**
 * Defines the shape of simulation report.
 */
export interface SimulationReport {
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
} /**
 * Annual award type type.
 */

/**
 * Annual award type type.
 */
export type AnnualAwardType =
  | 'WARRIOR_OF_YEAR'
  | 'KILLER_OF_YEAR'
  | 'STABLE_OF_YEAR'
  | 'CLASS_MVP'
  | 'TOURNAMENT_RANK'; /**
 * Defines the shape of annual award.
 */

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

export type ObjectiveId =
  | 'TOP_10_STABLE'
  | 'TOP_3_STABLE'
  | 'FIRST_TOURNAMENT_WIN'
  | 'HALL_OF_FAMER'
  | 'REALM_CHAMPION';

export interface ProgressionObjective {
  id: ObjectiveId;
  label: string;
  description: string;
  completed: boolean;
  completedWeek?: number;
  completedYear?: number;
}

export type ProgressionStatus = 'active' | 'won' | 'continued';

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
} /**
 * Defines the shape of game state.
 */

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
  player: Owner;
  fame: number;
  popularity: number;
  treasury: number;
  ledger: LedgerEntry[];
  week: number;
  year: number; // 🌩️ Calendar Authority (v1.0)
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
  bookmarks: Bookmark[];
  deferredBoutLogs?: DeferredBoutLog[];
  progression: ProgressionState;
} /**
 * Defines the shape of ui prefs.
 */

/**
 * Defines the shape of ui prefs.
 */
export interface UIPrefs {
  autoTunePlan: boolean;
  dashboardLayout?: string[];
}
