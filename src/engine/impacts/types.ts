/**
 * State Impact Types
 * Defines the shape of state impact for incremental state updates.
 */
import type {
  GameState,
  LedgerEntry,
  NewsletterItem,
  RivalStableData,
  RankingEntry,
  Season,
  WeatherType,
  BoutOffer,
  Promoter,
  Trainer,
  OwnerGrudge,
  Rivalry,
  CrowdMoodType,
  AnnualAward,
  SeasonalGrowth,
  TrainingAssignment,
  SimulationReport,
  GazetteStory,
  HallEntry,
  MatchRecord,
  RestState,
  ScoutReportData,
  InsightToken,
  TournamentEntry,
  ProgressionState,
  ArenaTitle,
  GrandChampionEntry,
} from '@/types/state.types';
import type { Warrior } from '@/types/warrior.types';
import type { FightSummary } from '@/types/combat.types';
import type { PoolWarrior } from '@/engine/recruitment/recruitment';
import type { WarriorId, StableId, TournamentId, BoutOfferId } from '@/types/shared.types';

// Re-export GameState for convenience
export type { GameState };

/** A single earned epithet award for a warrior (player- or rival-owned). */
export interface WarriorEpithetAward {
  warriorId: WarriorId;
  epithet: string;
}

/**
 * Defines the shape of state impact.
 * Each field represents a potential change to game state.
 */
export interface StateImpact {
  // Economy
  treasuryDelta?: number;
  fameDelta?: number;
  popularityDelta?: number;
  ledgerEntries?: LedgerEntry[];
  newsletterItems?: NewsletterItem[];

  // Warriors
  rosterUpdates?: Map<WarriorId, Partial<Warrior>>;
  /**
   * Earned epithet awards — deferred until after every other impact applies,
   * so same-tick whole-roster replacements (rivalsUpdates) can't erase them.
   */
  warriorEpithets?: WarriorEpithetAward[];
  rosterRemovals?: WarriorId[];
  rosterAdditions?: Warrior[];
  graveyard?: Warrior[];
  retired?: Warrior[];

  // Rivals
  rivalsUpdates?: Map<StableId, Partial<RivalStableData>>;
  /**
   * Per-warrior patches for rival-owned warriors, keyed by warrior id and
   * applied to whichever rival roster holds that warrior. Bout resolution
   * must use this (never a whole-roster `rivalsUpdates.roster` write): every
   * bout in a week resolves against the same pre-week state, so whole-roster
   * writes from separate bouts clobber each other under last-wins merging.
   */
  rivalWarriorPatches?: Map<WarriorId, Partial<Warrior>>;
  /** Rival-owned warriors to remove from their roster (e.g. killed in a bout). */
  rivalRosterRemovals?: WarriorId[];
  /**
   * Bankruptcy succession: the stable keyed by the old id is swapped, in
   * place, for the successor stable (which carries a new id). Applied before
   * every other impact key so same-tick `rivalsUpdates` keyed by the
   * successor's id land on it. `rivalsUpdates` alone cannot express this —
   * it only patches stables already in `state.rivals`, so a successor was
   * silently dropped and the bankrupt stable lived on as an unprocessed ghost.
   */
  rivalReplacements?: Map<StableId, RivalStableData>;
  /**
   * Stable membership changes that `rivalReplacements` cannot express:
   * seasonal-churn expansion adds stables outright; seasonal bankruptcy
   * shutters them with no successor. Additions skip ids already live.
   */
  rivalsAdditions?: RivalStableData[];
  rivalsRemovals?: StableId[];

  // World
  week?: number;
  day?: number;
  season?: Season;
  weather?: WeatherType;
  recruitPool?: PoolWarrior[];
  /** Queued legacy-founder warriors (replace — producers compute the next
   *  queue wholesale). Exclusive: only the seasonal churn consumes the queue. */
  legacyFounderQueue?: Warrior[];
  /** Delta enqueue of founder-caliber retirees (append — safe across
   *  same-snapshot passes that can't see each other's queue writes). */
  legacyFounderEnqueue?: Warrior[];
  /** Free-agent list (replace — producers compute the next list wholesale).
   *  Exclusive per stage: recruitment pass ages the shelf; rivalStrategy
   *  writes the post-draft remainder. */
  freeAgents?: PoolWarrior[];
  /** Delta additions of displaced/freed veterans (append — safe across
   *  same-snapshot passes). */
  freeAgentAdditions?: PoolWarrior[];
  /** Delta removals of signed veterans by id (append — safe across
   *  same-snapshot passes). */
  freeAgentRemovals?: string[];
  seasonalGrowth?: SeasonalGrowth[];

  // Rankings
  realmRankings?: Record<string, RankingEntry>;

  // Promoters
  boutOffers?: Record<BoutOfferId, BoutOffer>;
  promoters?: Record<string, Promoter>;

  // Tournaments
  tournaments?: TournamentEntry[];
  isTournamentWeek?: boolean;
  activeTournamentId?: TournamentId;

  // Training
  trainers?: Trainer[];
  hiringPool?: Trainer[];
  trainingAssignments?: TrainingAssignment[];
  restStates?: RestState[];
  coachDismissed?: string[];

  // Arena
  arenaHistory?: FightSummary[];
  hallOfFame?: HallEntry[];
  matchHistory?: MatchRecord[];
  moodHistory?: { week: number; mood: CrowdMoodType }[];
  crowdMood?: CrowdMoodType;
  /** Per-arena championship updates — dictMerge: each entry replaces the whole ArenaTitle for that arena. */
  arenaChampions?: Record<string, ArenaTitle>;
  /** Grand Championship winners — append. */
  grandChampions?: GrandChampionEntry[];

  // Narrative
  gazettes?: GazetteStory[];
  scoutReports?: ScoutReportData[];
  insightTokens?: InsightToken[];
  lastSimulationReport?: SimulationReport;

  // Social
  ownerGrudges?: OwnerGrudge[];
  rivalries?: Rivalry[];
  playerChallenges?: string[];
  playerAvoids?: string[];
  unacknowledgedDeaths?: string[];

  // Awards
  awards?: AnnualAward[];

  // Progression
  progression?: ProgressionState;
}

/**
 * Handler function type for applying a specific impact field to state.
 */
export type ImpactHandler<K extends keyof StateImpact> = (
  state: GameState,
  value: Exclude<StateImpact[K], undefined>
) => void;
