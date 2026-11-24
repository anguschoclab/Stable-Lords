/**
 * Perception snapshot — a single read-only view of the world built once per
 * tick in RivalStrategyPass and shared across every rival's agent context,
 * so per-rival perception work never re-scans arenaHistory or rankings.
 */
import type { GameState, FightSummary, RankingEntry } from '@/types/state.types';
import type { BoutOffer } from '@/types/state/rankings';
import type { StableId, WarriorId } from '@/types/shared.types';
import { computeMetaDrift, type StyleMeta } from '@/engine/analytics/metaDrift';
import { getFightsForWeek } from '@/engine/core/historyUtils';
import { isActive } from '@/engine/warrior/warriorStatus';
import { buildContenderIndex } from '@/engine/championship/arenaChampionship';
import { estimateThreat } from '@/engine/ai/memory/intelDossier';
import { resolveWarriorOwner } from '@/engine/core/warriorOwnership';
import { boutOfferAbsoluteWeek } from '@/engine/core/absoluteWeek';

/** How threatening the player's best-ranked warrior is vs the world field. */
export type PlayerThreatLevel = 'Dominant' | 'Moderate' | 'Neutral';

/**
 * Computes how threatening the player is relative to the world,
 * based on their best warrior's realm ranking vs the world median.
 */
export function computePlayerThreatLevel(state: GameState): PlayerThreatLevel {
  const rankings = state.realmRankings;
  // Count without allocating a key array — called per rival/offer/intent.
  let totalRanked = 0;
  if (rankings) for (const _k in rankings) totalRanked++;
  if (totalRanked === 0) return 'Neutral';

  let playerBestRank: number | null = null;
  const roster = state.roster || [];

  for (let i = 0; i < roster.length; i++) {
    const warrior = roster[i];
    if (!warrior) continue;
    const entry = rankings[warrior.id];
    if (entry && (playerBestRank === null || entry.overallRank < playerBestRank)) {
      playerBestRank = entry.overallRank;
    }
  }

  if (playerBestRank === null) return 'Neutral';

  const percentile = playerBestRank / totalRanked;

  if (percentile <= 0.15) return 'Dominant';
  if (percentile <= 0.4) return 'Moderate';
  return 'Neutral';
}

/** The shared read-only world view consumed by every rival's agent context. */
export interface PerceptionSnapshot {
  /** World meta drift (cached meta if the state already computed one). */
  meta: StyleMeta;
  /** This week's resolved fights. */
  weekFights: FightSummary[];
  /** stableId → active roster size. */
  activeRosterSize: Map<StableId, number>;
  /** warriorId → ranking entry (index over state.realmRankings). */
  rankingsByWarrior: Map<WarriorId, RankingEntry>;
  /** stableId → true if that stable had a warrior fight this week. */
  foughtThisWeek: Set<string>;
  /** arenaId → reigning champion warriorId (any lifecycle status). */
  championByArena: Map<string, WarriorId>;
  /** champion warriorId → arenaIds held (reverse index of championByArena). */
  arenasHeldByChampion: Map<WarriorId, string[]>;
  /** arenaId → top-N eligible contender ids (rankContenders order), built
   *  once per tick so crown campaigning never re-ranks ladders per rival. */
  contenderIndexByArena: Map<string, WarriorId[]>;
  weather: GameState['weather'];
  crowdMood: GameState['crowdMood'];
  recruitPoolSize: number;
  hiringPoolSize: number;
  /** Compact player summary every agent may consider. */
  player: {
    stableId: StableId;
    fame: number;
    treasury: number;
    activeRosterSize: number;
  };
  absoluteWeek: number;
  /** Player threat rating — pure f(state), hoisted out of createAgentContext. */
  playerThreatLevel: PlayerThreatLevel;
  /** stableId → dossier threat estimate (estimateThreat formula verbatim). */
  threatByStableId: Map<StableId, number>;
  /** warriorId → owning stableId for every weekFights participant
   *  (undefined = unowned/dead — the roster-scan miss is cached once). */
  weekFightStableOf: Map<WarriorId, StableId | undefined>;
  /** Every rival owner.id in declaration order — refreshKnownRivals filters. */
  knownRivalOwnerIds: StableId[];
  /** lag-weeks → meta drift computed over history truncated at absoluteWeek-lag.
   *  Non-Methodical owners perceive 1–2 week old meta; both lags prebuilt. */
  laggedMetaByLag: Map<number, StyleMeta>;
  /** Warriors signed to an upcoming title bout (titleArenaId + Signed +
   *  boutOfferAbsoluteWeek >= now) — they rest until the bout resolves. */
  signedUpcomingTitleIds: Set<string>;
  /** Live title offers (titleArenaId + Signed|Proposed) in boutOffers order —
   *  intelWorker's per-rival opponent picks iterate this pre-filtered list
   *  instead of rescanning the whole offers map. */
  titleOffers: BoutOffer[];
}

/**
 * Build the once-per-tick snapshot: meta drift, this week's fights, per-stable
 * roster sizes, rankings index, and a compact player summary.
 */
/** stableId-keyed facts indexed once over the rival list + player. */
function indexStableFacts(
  state: GameState,
  absoluteWeek: number,
  playerActive: number
): {
  activeRosterSize: Map<StableId, number>;
  threatByStableId: Map<StableId, number>;
  knownRivalOwnerIds: StableId[];
} {
  const activeRosterSize = new Map<StableId, number>();
  const threatByStableId = new Map<StableId, number>();
  const knownRivalOwnerIds: StableId[] = [];
  for (const rival of state.rivals ?? []) {
    activeRosterSize.set(
      rival.id,
      rival.roster.reduce((c, w) => (isActive(w) ? c + 1 : c), 0)
    );
    threatByStableId.set(
      rival.id,
      estimateThreat(rival.id, rival.fame ?? rival.owner.fame ?? 0, absoluteWeek)
    );
    knownRivalOwnerIds.push(rival.owner.id);
  }
  activeRosterSize.set(state.player.id, playerActive);
  threatByStableId.set(
    state.player.id,
    estimateThreat(state.player.id, state.fame ?? 0, absoluteWeek)
  );
  return { activeRosterSize, threatByStableId, knownRivalOwnerIds };
}

/** Per-fight participant indexes: who fought (by stable) and who owns whom. */
function indexWeekFights(
  state: GameState,
  weekFights: FightSummary[]
): {
  foughtThisWeek: Set<string>;
  weekFightStableOf: Map<WarriorId, StableId | undefined>;
} {
  const foughtThisWeek = new Set<string>();
  const weekFightStableOf = new Map<WarriorId, StableId | undefined>();
  const warriorToStable = state.warriorToStableMap;
  for (const fight of weekFights) {
    const a = warriorToStable?.get(fight.warriorIdA)?.stableId;
    const d = warriorToStable?.get(fight.warriorIdD)?.stableId;
    if (a) foughtThisWeek.add(a);
    if (d) foughtThisWeek.add(d);
    // One ownership resolution per participant — dead fighters cache their
    // roster-scan miss once instead of once per observing rival.
    if (!weekFightStableOf.has(fight.warriorIdA)) {
      weekFightStableOf.set(
        fight.warriorIdA,
        (a ?? resolveWarriorOwner(state, fight.warriorIdA)?.stableId) as StableId | undefined
      );
    }
    if (!weekFightStableOf.has(fight.warriorIdD)) {
      weekFightStableOf.set(
        fight.warriorIdD,
        (d ?? resolveWarriorOwner(state, fight.warriorIdD)?.stableId) as StableId | undefined
      );
    }
  }
  return { foughtThisWeek, weekFightStableOf };
}

/** One offers pass → signed-upcoming-title warrior ids + the ordered list
 *  of live title offers (Signed|Proposed) the intel pickers rescan per rival. */
function titleOfferIndex(
  state: GameState,
  now: number
): { signedUpcomingTitleIds: Set<string>; titleOffers: BoutOffer[] } {
  const ids = new Set<string>();
  const titleOffers: BoutOffer[] = [];
  for (const offer of Object.values(state.boutOffers ?? {})) {
    if (!offer.titleArenaId) continue;
    if (offer.status !== 'Signed' && offer.status !== 'Proposed') continue;
    titleOffers.push(offer);
    if (offer.status === 'Signed' && boutOfferAbsoluteWeek(offer) >= now) {
      for (const wId of offer.warriorIds) ids.add(wId as string);
    }
  }
  return { signedUpcomingTitleIds: ids, titleOffers };
}

/** Metas for the two non-Methodical perception delays — one history pass. */
function laggedMetaMap(state: GameState, absoluteWeek: number): Map<number, StyleMeta> {
  const history = state.arenaHistory ?? [];
  const cutoff1 = absoluteWeek - 1;
  const cutoff2 = absoluteWeek - 2;
  const lag1History: typeof history = [];
  const lag2History: typeof history = [];
  for (const f of history) {
    const wk = f.absoluteWeek ?? f.week;
    if (wk <= cutoff2) lag2History.push(f);
    if (wk <= cutoff1) lag1History.push(f);
  }
  return new Map<number, StyleMeta>([
    [1, computeMetaDrift(lag1History)],
    [2, computeMetaDrift(lag2History)],
  ]);
}

/** Builds the once-per-tick world view every rival's agent context shares. */
export function buildPerceptionSnapshot(state: GameState): PerceptionSnapshot {
  const absoluteWeek = state.absoluteWeek ?? state.week;
  const weekFights = getFightsForWeek(state.arenaHistory ?? [], absoluteWeek);
  const playerActive = (state.roster ?? []).reduce((c, w) => (isActive(w) ? c + 1 : c), 0);
  const { activeRosterSize, threatByStableId, knownRivalOwnerIds } = indexStableFacts(
    state,
    absoluteWeek,
    playerActive
  );
  const { foughtThisWeek, weekFightStableOf } = indexWeekFights(state, weekFights);

  const rankingsByWarrior = new Map<WarriorId, RankingEntry>();
  for (const [wid, entry] of Object.entries(state.realmRankings ?? {})) {
    rankingsByWarrior.set(wid as WarriorId, entry);
  }

  const championByArena = new Map<string, WarriorId>();
  const arenasHeldByChampion = new Map<WarriorId, string[]>();
  for (const [arenaId, t] of Object.entries(state.arenaChampions ?? {})) {
    const champId = t?.champion?.warriorId;
    if (!champId) continue;
    championByArena.set(arenaId, champId);
    arenasHeldByChampion.set(champId, [...(arenasHeldByChampion.get(champId) ?? []), arenaId]);
  }

  return {
    meta: state.cachedMetaDrift ?? computeMetaDrift(state.arenaHistory ?? []),
    weekFights,
    activeRosterSize,
    rankingsByWarrior,
    foughtThisWeek,
    championByArena,
    arenasHeldByChampion,
    contenderIndexByArena: buildContenderIndex(state),
    weather: state.weather,
    crowdMood: state.crowdMood,
    recruitPoolSize: (state.recruitPool ?? []).length,
    hiringPoolSize: (state.hiringPool ?? []).length,
    player: {
      stableId: state.player.id,
      fame: state.fame ?? 0,
      treasury: state.treasury ?? 0,
      activeRosterSize: playerActive,
    },
    absoluteWeek,
    playerThreatLevel: computePlayerThreatLevel(state),
    threatByStableId,
    weekFightStableOf,
    knownRivalOwnerIds,
    laggedMetaByLag: laggedMetaMap(state, absoluteWeek),
    ...titleOfferIndex(state, absoluteWeek),
  };
}
