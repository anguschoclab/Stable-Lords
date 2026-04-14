import type { GameState, LedgerEntry, NewsletterItem, RivalStableData, RankingEntry, Season, WeatherType, BoutOffer, Promoter, Trainer, OwnerGrudge, Rivalry, CrowdMoodType, AnnualAward, SeasonalGrowth, TrainingAssignment, SimulationReport, GazetteStory, HallEntry, MatchRecord, RestState, ScoutReportData, InsightToken, TournamentEntry } from "@/types/state.types";
import type { Warrior } from "@/types/warrior.types";
import type { FightSummary } from "@/types/combat.types";
import type { PoolWarrior } from "@/engine/recruitment";

export interface StateImpact {
  treasuryDelta?: number;
  fameDelta?: number;
  popularityDelta?: number;
  rosterUpdates?: Map<string, Partial<Warrior>>;
  rosterRemovals?: string[];
  rivalsUpdates?: Map<string, Partial<RivalStableData>>;
  newsletterItems?: NewsletterItem[];
  ledgerEntries?: LedgerEntry[];
  seasonalGrowth?: SeasonalGrowth[];
  newPoolRecruits?: PoolWarrior[];
  recruitPool?: PoolWarrior[];
  tournaments?: TournamentEntry[];
  isTournamentWeek?: boolean;
  activeTournamentId?: string;
  day?: number;
  graveyard?: Warrior[];
  week?: number;
  season?: Season;
  weather?: WeatherType;
  realmRankings?: Record<string, RankingEntry>;
  boutOffers?: Record<string, BoutOffer>;
  promoters?: Record<string, Promoter>;
  trainers?: Trainer[];
  hiringPool?: Trainer[];
  gazettes?: GazetteStory[];
  ownerGrudges?: OwnerGrudge[];
  rivalries?: Rivalry[];
  trainingAssignments?: TrainingAssignment[];
  lastSimulationReport?: SimulationReport;
  arenaHistory?: FightSummary[];
  hallOfFame?: HallEntry[];
  matchHistory?: MatchRecord[];
  moodHistory?: { week: number; mood: CrowdMoodType }[];
  retired?: Warrior[];
  scoutReports?: ScoutReportData[];
  insightTokens?: InsightToken[];
  playerChallenges?: string[];
  playerAvoids?: string[];
  coachDismissed?: string[];
  restStates?: RestState[];
  unacknowledgedDeaths?: string[];
  crowdMood?: CrowdMoodType;
  awards?: AnnualAward[];
}

type ImpactHandler<K extends keyof StateImpact> = (state: GameState, value: Exclude<StateImpact[K], undefined>) => void;

const impactHandlers: { [K in keyof StateImpact]-?: ImpactHandler<K> } = {
  treasuryDelta: (state, value) => { state.treasury = (state.treasury ?? 0) + value; },
  fameDelta: (state, value) => {
    state.fame = (state.fame ?? 0) + value;
    if (state.player) state.player.fame = (state.player.fame ?? 0) + value;
  },
  popularityDelta: (state, value) => { state.popularity = (state.popularity ?? 0) + value; },
  rosterRemovals: (state, value) => {
    if (value.length === 0) return;
    state.roster = state.roster.filter(w => !value.includes(w.id));
  },
  rosterUpdates: (state, value) => {
    if (value.size === 0) return;
    state.roster = state.roster.map(w => {
      const update = value.get(w.id);
      return update ? { ...w, ...update } : w;
    });
  },
  rivalsUpdates: (state, value) => {
    if (value.size === 0) return;
    state.rivals = state.rivals.map(r => {
      const update = value.get(r.owner.id);
      return update ? { ...r, ...update } : r;
    });
  },
  newsletterItems: (state, value) => { state.newsletter = [...(state.newsletter || []), ...value]; },
  ledgerEntries: (state, value) => { state.ledger = [...(state.ledger ?? []), ...value]; },
  seasonalGrowth: (state, value) => { state.seasonalGrowth = [...(state.seasonalGrowth || []), ...value]; },
  week: (state, value) => { state.week = value; },
  season: (state, value) => { state.season = value; },
  weather: (state, value) => { state.weather = value; },
  realmRankings: (state, value) => { state.realmRankings = value; },
  arenaHistory: (state, value) => { state.arenaHistory = [...(state.arenaHistory || []), ...value]; },
  hallOfFame: (state, value) => { state.hallOfFame = [...(state.hallOfFame || []), ...value]; },
  matchHistory: (state, value) => { state.matchHistory = [...(state.matchHistory || []), ...value]; },
  moodHistory: (state, value) => { state.moodHistory = [...(state.moodHistory || []), ...value]; },
  retired: (state, value) => { state.retired = [...(state.retired || []), ...value]; },
  scoutReports: (state, value) => { state.scoutReports = [...(state.scoutReports || []), ...value]; },
  insightTokens: (state, value) => { state.insightTokens = [...(state.insightTokens || []), ...value]; },
  playerChallenges: (state, value) => { state.playerChallenges = [...(state.playerChallenges || []), ...value]; },
  playerAvoids: (state, value) => { state.playerAvoids = [...(state.playerAvoids || []), ...value]; },
  coachDismissed: (state, value) => { state.coachDismissed = [...(state.coachDismissed || []), ...value]; },
  restStates: (state, value) => { state.restStates = [...(state.restStates || []), ...value]; },
  crowdMood: (state, value) => { state.crowdMood = value; },
  unacknowledgedDeaths: (state, value) => { state.unacknowledgedDeaths = [...(state.unacknowledgedDeaths || []), ...value]; },
  awards: (state, value) => { state.awards = [...(state.awards || []), ...value]; },
  boutOffers: (state, value) => { state.boutOffers = value; },
  promoters: (state, value) => { state.promoters = value; },
  recruitPool: (state, value) => { state.recruitPool = value; },
  tournaments: (state, value) => { 
    if (!value || value.length === 0) return;
    const existing = state.tournaments || [];
    const updated = existing.map(t => {
      const replacement = value.find(v => v.id === t.id);
      return replacement ? replacement : t;
    });
    // Add any new tournaments that weren't in the existing array
    const newTournaments = value.filter(v => !existing.find(e => e.id === v.id));
    state.tournaments = [...updated, ...newTournaments];
  },
  isTournamentWeek: (state, value) => { state.isTournamentWeek = value; },
  activeTournamentId: (state, value) => { state.activeTournamentId = value; },
  day: (state, value) => { state.day = value; },
  graveyard: (state, value) => { state.graveyard = [...(state.graveyard || []), ...value]; },
  trainers: (state, value) => { state.trainers = value; },
  hiringPool: (state, value) => { state.hiringPool = value; },
  gazettes: (state, value) => { state.gazettes = value; },
  ownerGrudges: (state, value) => { state.ownerGrudges = value; },
  rivalries: (state, value) => { state.rivalries = value; },
  trainingAssignments: (state, value) => { state.trainingAssignments = value; },
  lastSimulationReport: (state, value) => { state.lastSimulationReport = value; },
  newPoolRecruits: (state, value) => { state.recruitPool = value; }
};

export function resolveImpacts(state: GameState, impacts: StateImpact[]): GameState {
  const newState = { ...state };
  for (const impact of impacts) {
    for (const key of Object.keys(impact) as Array<keyof StateImpact>) {
      const value = impact[key];
      if (value !== undefined) {
        const handler = impactHandlers[key] as ImpactHandler<typeof key>;
        if (handler) {
          handler(newState, value as never); // Typesafe by construction, but TypeScript loses the generic linkage when iterating Object.keys
        }
      }
    }
  }
  return newState;
}

export function mergeImpacts(impacts: StateImpact[]): StateImpact {
  const merged: StateImpact = {
    treasuryDelta: 0,
    fameDelta: 0,
    popularityDelta: 0,
    rosterUpdates: new Map(),
    rivalsUpdates: new Map(),
    newsletterItems: [],
    ledgerEntries: [],
    graveyard: [],
    arenaHistory: [],
    matchHistory: [],
    restStates: [],
    insightTokens: [],
    awards: [],
    retired: [],
    scoutReports: [],
    hallOfFame: [],
    moodHistory: [],
    playerChallenges: [],
    playerAvoids: [],
    coachDismissed: [],
    unacknowledgedDeaths: [],
    seasonalGrowth: [],
    rosterRemovals: [],
  };

  for (const imp of impacts) {
    // Numeric accumulation
    if (imp.treasuryDelta) merged.treasuryDelta! += imp.treasuryDelta;
    if (imp.fameDelta) merged.fameDelta! += imp.fameDelta;
    if (imp.popularityDelta) merged.popularityDelta! += imp.popularityDelta;

    // Map merges (shallow-merge per key)
    if (imp.rosterUpdates) {
      imp.rosterUpdates.forEach((val, key) => {
        const existing = merged.rosterUpdates!.get(key) || {};
        merged.rosterUpdates!.set(key, { ...existing, ...val });
      });
    }
    if (imp.rivalsUpdates) {
      imp.rivalsUpdates.forEach((val, key) => {
        const existing = merged.rivalsUpdates!.get(key) || {};
        merged.rivalsUpdates!.set(key, { ...existing, ...val });
      });
    }

    // Array appends
    if (imp.newsletterItems?.length) merged.newsletterItems!.push(...imp.newsletterItems);
    if (imp.ledgerEntries?.length) merged.ledgerEntries!.push(...imp.ledgerEntries);
    if (imp.graveyard?.length) merged.graveyard!.push(...imp.graveyard);
    if (imp.arenaHistory?.length) merged.arenaHistory!.push(...imp.arenaHistory);
    if (imp.matchHistory?.length) merged.matchHistory!.push(...imp.matchHistory);
    if (imp.restStates?.length) merged.restStates!.push(...imp.restStates);
    if (imp.insightTokens?.length) merged.insightTokens!.push(...imp.insightTokens);
    if (imp.awards?.length) merged.awards!.push(...imp.awards);
    if (imp.retired?.length) merged.retired!.push(...imp.retired);
    if (imp.scoutReports?.length) merged.scoutReports!.push(...imp.scoutReports);
    if (imp.hallOfFame?.length) merged.hallOfFame!.push(...imp.hallOfFame);
    if (imp.moodHistory?.length) merged.moodHistory!.push(...imp.moodHistory);
    if (imp.playerChallenges?.length) merged.playerChallenges!.push(...imp.playerChallenges);
    if (imp.playerAvoids?.length) merged.playerAvoids!.push(...imp.playerAvoids);
    if (imp.coachDismissed?.length) merged.coachDismissed!.push(...imp.coachDismissed);
    if (imp.unacknowledgedDeaths?.length) merged.unacknowledgedDeaths!.push(...imp.unacknowledgedDeaths);
    if (imp.seasonalGrowth?.length) merged.seasonalGrowth!.push(...imp.seasonalGrowth);
    if (imp.rosterRemovals?.length) merged.rosterRemovals!.push(...imp.rosterRemovals);

    // Replace semantics (last writer wins)
    if (imp.tournaments) merged.tournaments = imp.tournaments;
    if (imp.recruitPool !== undefined) merged.recruitPool = imp.recruitPool;
    if (imp.newPoolRecruits !== undefined) merged.newPoolRecruits = imp.newPoolRecruits;
    if (imp.realmRankings !== undefined) merged.realmRankings = imp.realmRankings;
    if (imp.boutOffers !== undefined) merged.boutOffers = imp.boutOffers;
    if (imp.promoters !== undefined) merged.promoters = imp.promoters;
    if (imp.trainers !== undefined) merged.trainers = imp.trainers;
    if (imp.hiringPool !== undefined) merged.hiringPool = imp.hiringPool;
    if (imp.gazettes !== undefined) merged.gazettes = imp.gazettes;
    if (imp.ownerGrudges !== undefined) merged.ownerGrudges = imp.ownerGrudges;
    if (imp.rivalries !== undefined) merged.rivalries = imp.rivalries;
    if (imp.trainingAssignments !== undefined) merged.trainingAssignments = imp.trainingAssignments;
    if (imp.lastSimulationReport !== undefined) merged.lastSimulationReport = imp.lastSimulationReport;
    if (imp.isTournamentWeek !== undefined) merged.isTournamentWeek = imp.isTournamentWeek;
    if (imp.activeTournamentId !== undefined) merged.activeTournamentId = imp.activeTournamentId;
    if (imp.day !== undefined) merged.day = imp.day;
    if (imp.week !== undefined) merged.week = imp.week;
    if (imp.season !== undefined) merged.season = imp.season;
    if (imp.weather !== undefined) merged.weather = imp.weather;
    if (imp.crowdMood !== undefined) merged.crowdMood = imp.crowdMood;
  }

  return merged;
}
