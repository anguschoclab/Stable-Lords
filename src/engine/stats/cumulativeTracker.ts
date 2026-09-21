import type { GameState } from '@/types/state.types';
import type { FightSummary } from '@/types/combat.types';
import type { Warrior } from '@/types/warrior.types';

/**
 * All-time counters accumulated across a whole simulation run. Unlike the
 * capped state arrays, these survive truncation — consumers like
 * `daily_oracle` read them for all-time metrics instead of finalState
 * array lengths.
 */
export interface CumulativeStats {
  totalBouts: number;
  deaths: number;
  retired: number;
  styleWins: Record<string, number>;
  styleLosses: Record<string, number>;
}

/**
 * Accumulates CumulativeStats from successive weekly states.
 */
export interface CumulativeTracker {
  /**
   * Records any bouts, deaths, and retirements present in `state` that have
   * not been seen before. Call once per week after `advanceWeek`, before
   * any truncation pass.
   */
  recordWeek: (state: GameState) => void;
  /**
   * Returns the all-time counters seen so far (style maps are copies).
   */
  snapshot: () => CumulativeStats;
}

/**
 * Creates a tracker that counts every distinct bout, death, and retirement
 * by entity id. Id-set tracking — NOT length-delta — because arenaHistory
 * can drop head entries mid-tick (tournamentSelection/resolution.ts appends
 * with an inline `slice(-500)`), which would silently undercount under a
 * length-delta scheme. Seeded with `initialState` so pre-existing history
 * counts toward all-time totals.
 */
export function createCumulativeTracker(initialState: GameState): CumulativeTracker {
  const seenBoutIds = new Set<FightSummary['id']>();
  const seenDeadIds = new Set<Warrior['id']>();
  const seenRetiredIds = new Set<Warrior['id']>();
  const styleWins: Record<string, number> = {};
  const styleLosses: Record<string, number> = {};

  const recordBout = (bout: FightSummary): void => {
    if (seenBoutIds.has(bout.id)) return;
    seenBoutIds.add(bout.id);

    // Seed both styles' keys so winless styles still appear in reports.
    const aStyle = bout.styleA || 'Unknown';
    const dStyle = bout.styleD || 'Unknown';
    styleWins[aStyle] ??= 0;
    styleLosses[aStyle] ??= 0;
    styleWins[dStyle] ??= 0;
    styleLosses[dStyle] ??= 0;

    if (bout.winner === 'A') {
      styleWins[aStyle]++;
      styleLosses[dStyle]++;
    } else if (bout.winner === 'D') {
      styleWins[dStyle]++;
      styleLosses[aStyle]++;
    }
    // winner === null (Exhaustion draw): counted in totalBouts, no W/L.
  };

  const recordWarriors = (warriors: readonly Warrior[] | undefined, seen: Set<Warrior['id']>) => {
    for (const w of warriors ?? []) seen.add(w.id);
  };

  const ingest = (state: GameState): void => {
    for (const bout of state.arenaHistory ?? []) recordBout(bout);
    recordWarriors(state.graveyard, seenDeadIds);
    recordWarriors(state.retired, seenRetiredIds);
  };

  ingest(initialState);

  return {
    recordWeek: ingest,
    snapshot: () => ({
      totalBouts: seenBoutIds.size,
      deaths: seenDeadIds.size,
      retired: seenRetiredIds.size,
      styleWins: { ...styleWins },
      styleLosses: { ...styleLosses },
    }),
  };
}
