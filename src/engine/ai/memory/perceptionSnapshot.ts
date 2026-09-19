/**
 * Perception snapshot — a single read-only view of the world built once per
 * tick in RivalStrategyPass and shared across every rival's agent context,
 * so per-rival perception work never re-scans arenaHistory or rankings.
 */
import type { GameState, FightSummary, RankingEntry } from '@/types/state.types';
import type { StableId, WarriorId } from '@/types/shared.types';
import { computeMetaDrift, type StyleMeta } from '@/engine/metaDrift';
import { getFightsForWeek } from '@/engine/core/historyUtils';
import { isActive } from '@/engine/warriorStatus';

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
}

/**
 * Build the once-per-tick snapshot: meta drift, this week's fights, per-stable
 * roster sizes, rankings index, and a compact player summary.
 */
export function buildPerceptionSnapshot(state: GameState): PerceptionSnapshot {
  const absoluteWeek = state.absoluteWeek ?? state.week;
  const weekFights = getFightsForWeek(state.arenaHistory ?? [], absoluteWeek);

  const activeRosterSize = new Map<StableId, number>();
  const foughtThisWeek = new Set<string>();
  const warriorToStable = state.warriorToStableMap;

  for (const rival of state.rivals ?? []) {
    activeRosterSize.set(
      rival.id,
      rival.roster.reduce((c, w) => (isActive(w) ? c + 1 : c), 0)
    );
  }
  const playerActive = (state.roster ?? []).reduce(
    (c, w) => (isActive(w) ? c + 1 : c),
    0
  );
  activeRosterSize.set(state.player.id, playerActive);

  for (const fight of weekFights) {
    const a = warriorToStable?.get(fight.warriorIdA)?.stableId;
    const d = warriorToStable?.get(fight.warriorIdD)?.stableId;
    if (a) foughtThisWeek.add(a);
    if (d) foughtThisWeek.add(d);
  }

  const rankingsByWarrior = new Map<WarriorId, RankingEntry>();
  for (const [wid, entry] of Object.entries(state.realmRankings ?? {})) {
    rankingsByWarrior.set(wid as WarriorId, entry);
  }

  return {
    meta: state.cachedMetaDrift ?? computeMetaDrift(state.arenaHistory ?? []),
    weekFights,
    activeRosterSize,
    rankingsByWarrior,
    foughtThisWeek,
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
  };
}
