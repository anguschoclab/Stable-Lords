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
} from '@/types/state.types';
import type { Warrior } from '@/types/warrior.types';
import type { FightSummary } from '@/types/combat.types';
import type { PoolWarrior } from '@/engine/recruitment';
import type { WarriorId, StableId, TournamentId } from '@/types/shared.types';

// Re-export GameState for convenience
export type { GameState };

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
  rosterRemovals?: WarriorId[];
  graveyard?: Warrior[];
  retired?: Warrior[];

  // Rivals
  rivalsUpdates?: Map<StableId, Partial<RivalStableData>>;

  // World
  week?: number;
  day?: number;
  season?: Season;
  weather?: WeatherType;
  recruitPool?: PoolWarrior[];
  seasonalGrowth?: SeasonalGrowth[];

  // Rankings
  realmRankings?: Record<string, RankingEntry>;

  // Promoters
  boutOffers?: Record<string, BoutOffer>;
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
}

/**
 * Handler function type for applying a specific impact field to state.
 */
export type ImpactHandler<K extends keyof StateImpact> = (
  state: GameState,
  value: Exclude<StateImpact[K], undefined>
) => void;
