import type { Bookmark } from '../bookmark.types';
import type { FightSummary } from '../combat.types';
import type {
  BoutOfferId,
  CrowdMoodType,
  NewsletterItem,
  PromoterId,
  Season,
  TournamentId,
  Trainer,
  WarriorId,
  WeatherType,
} from '../shared.types';
import type { Warrior } from '../warrior.types';
import type { ArenaTitle, GrandChampionEntry, Promoter } from './championship';
import type {
  GazetteStory,
  HallEntry,
  InsightToken,
  LedgerEntry,
  MatchRecord,
  OwnerGrudge,
  RestState,
  RivalStableData,
  Rivalry,
  ScoutReportData,
  SeasonalGrowth,
  TournamentEntry,
  TrainingAssignment,
} from './game';
import type { Owner } from './owner';
import type { BoutOffer, RankingEntry } from './rankings';
import type {
  AnnualAward,
  DeferredBoutLog,
  HouseRules,
  KillEvent,
  LifetimeStats,
  ProgressionState,
  SimulationReport,
} from './simulation';
import type { PoolWarrior } from '@/engine/recruitment/recruitment';
import type { ContentPack } from '@/lib/contentPacks';

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
  /** All-time counters immune to array truncation. */
  lifetimeStats?: LifetimeStats;
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
  /**
   * Persistent registry of every warrior id that has ever died. Unlike
   * `graveyard` — which is retention-capped — this never truncates, so
   * liveness guards never decay over long sims.
   */
  deadWarriorIds: WarriorId[];
  /** Every kill recorded at resolution time (see {@link KillEvent}). */
  killEvents: KillEvent[];
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
  /** Hall-of-Fame-caliber retirees waiting to found their own stables.
   *  Persisted (replaces the old module-level candidate list): enqueued by
   *  every retirement path, consumed by the seasonal expansion pass. */
  legacyFounderQueue: Warrior[];
  /** Released/displaced veterans available to every stable — the recruit
   *  pool's veteran lane pulled into first-class state so AI drafting and
   *  the player Recruit UI draw from the same list. Entries expire after
   *  `FREE_AGENT_SHELF_WEEKS`. */
  freeAgents: PoolWarrior[];
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
  day: number; // 0-7
  isTournamentWeek: boolean;
  activeTournamentId?: TournamentId;
  // ─── Promoter System ───
  promoters: Record<PromoterId, Promoter>;
  boutOffers: Record<BoutOfferId, BoutOffer>;
  /** Per-arena championship state, keyed by arenaId. */
  arenaChampions?: Record<string, ArenaTitle>;
  /** Winners of the annual champions-only Grand Championship. */
  grandChampions?: GrandChampionEntry[];
  realmRankings: Record<WarriorId, RankingEntry>;
  awards: AnnualAward[];
  lastSimulationReport?: SimulationReport;
  cachedMetaDrift?: import('@/engine/analytics/metaDrift').StyleMeta;
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
