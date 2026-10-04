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
  /** Ordinary weekly arena bouts (non-tournament) — the denominator the
   *  design bible's 8–15% mortality target applies to. */
  weeklyBouts: number;
  weeklyKills: number;
  tournamentBouts: number;
  tournamentKills: number;
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
  const acc = new StatsAccumulator();
  acc.ingest(initialState);
  return {
    recordWeek: (state) => acc.ingest(state),
    snapshot: () => acc.snapshot(),
  };
}

/**
 * Internal bookkeeping for the tracker — a class so each counter routine
 * stays a small standalone unit while sharing the seen-sets.
 */
class StatsAccumulator {
  private readonly seenBoutIds = new Set<FightSummary['id']>();
  private readonly seenKillEventIds = new Set<string>();
  private readonly seenDeadIds = new Set<Warrior['id']>();
  private readonly seenRetiredIds = new Set<Warrior['id']>();
  private readonly styleWins: Record<string, number> = {};
  private readonly styleLosses: Record<string, number> = {};
  private weeklyBouts = 0;
  private weeklyKills = 0;
  private tournamentBouts = 0;
  private tournamentKills = 0;

  private recordBout(bout: FightSummary): void {
    if (this.seenBoutIds.has(bout.id)) return;
    this.seenBoutIds.add(bout.id);

    if (bout.tournamentId != null) {
      this.tournamentBouts++;
    } else {
      this.weeklyBouts++;
    }

    // Seed both styles' keys so winless styles still appear in reports.
    const aStyle = bout.styleA || 'Unknown';
    const dStyle = bout.styleD || 'Unknown';
    this.styleWins[aStyle] ??= 0;
    this.styleLosses[aStyle] ??= 0;
    this.styleWins[dStyle] ??= 0;
    this.styleLosses[dStyle] ??= 0;

    if (bout.winner === 'A') {
      this.styleWins[aStyle]++;
      this.styleLosses[dStyle]++;
    } else if (bout.winner === 'D') {
      this.styleWins[dStyle]++;
      this.styleLosses[aStyle]++;
    }
    // winner === null (Exhaustion draw): counted in totalBouts, no W/L.
  }

  // Kills are counted from the resolution-time kill event ledger — NOT from
  // `arenaHistory` summaries, which are a retention-capped display window.
  // A kill whose summary has aged out still counts here; a repeat kill of an
  // already-dead warrior counts again (that asymmetry vs unique deaths is
  // the oracle's corruption tripwire).
  private recordKillEvents(state: GameState): void {
    for (const e of state.killEvents ?? []) {
      if (this.seenKillEventIds.has(e.id)) continue;
      this.seenKillEventIds.add(e.id);
      if (e.tournamentId != null) this.tournamentKills++;
      else this.weeklyKills++;
    }
  }

  private recordWarriors(warriors: readonly Warrior[] | undefined, seen: Set<Warrior['id']>) {
    for (const w of warriors ?? []) seen.add(w.id);
  }

  ingest(state: GameState): void {
    for (const bout of state.arenaHistory ?? []) this.recordBout(bout);
    this.recordKillEvents(state);
    for (const id of state.deadWarriorIds ?? []) this.seenDeadIds.add(id);
    this.recordWarriors(state.graveyard, this.seenDeadIds);
    this.recordWarriors(state.retired, this.seenRetiredIds);
  }

  snapshot(): CumulativeStats {
    return {
      totalBouts: this.seenBoutIds.size,
      weeklyBouts: this.weeklyBouts,
      weeklyKills: this.weeklyKills,
      tournamentBouts: this.tournamentBouts,
      tournamentKills: this.tournamentKills,
      deaths: this.seenDeadIds.size,
      retired: this.seenRetiredIds.size,
      styleWins: { ...this.styleWins },
      styleLosses: { ...this.styleLosses },
    };
  }
}
