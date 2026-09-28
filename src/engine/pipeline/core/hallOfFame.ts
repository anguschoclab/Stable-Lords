import {
  type GameState,
  type AnnualAward,
  type HallEntry,
  type RivalStableData,
} from '@/types/state.types';
import type { Warrior } from '@/types/warrior.types';
import type { FightSummary } from '@/types/combat.types';
import { FightingStyle, type WarriorId, type StableId, type HallEntryId } from '@/types/shared.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { resolveRng } from '@/utils/random';
import { StateImpact } from '@/engine/impacts';
import { getFightsForWeek } from '@/engine/core/historyUtils';

interface WarriorStats {
  w: Warrior;
  wins: number;
  kills: number;
  fame: number;
}

/** Award bookkeeping bundle: roster + rival-roster update maps. */
interface AwardLedger {
  rosterUpdates: Map<WarriorId, Partial<Warrior>>;
  rivalsUpdates: Map<StableId, Partial<RivalStableData>>;
  awards: AnnualAward[];
  hofNews: string[];
}

/** Collects the per-year stat deltas (career minus yearly snapshot). */
function collectEligible(state: GameState, completedYear: number): WarriorStats[] {
  const eligible: WarriorStats[] = [];
  const collect = (w: Warrior) => {
    const snapshot = w.yearlySnapshots?.[completedYear] || {
      wins: 0,
      losses: 0,
      kills: 0,
      fame: 0,
    };
    const wins = (w.career?.wins || 0) - (snapshot.wins || 0);
    const kills = (w.career?.kills || 0) - (snapshot.kills || 0);
    const fameGain = (w.fame || 0) - (snapshot.fame || 0);
    eligible.push({
      w,
      wins: Math.max(0, wins),
      kills: Math.max(0, kills),
      fame: Math.max(0, fameGain),
    });
  };

  state.roster.forEach(collect);
  state.rivals.forEach((r) => r.roster.forEach(collect));
  return eligible;
}

/**
 * Single-pass argmax over eligible warriors: `score` picks the metric,
 * `tiebreak` (fame/wins) resolves ties. Returns undefined for empty lists.
 */
function pickBest(
  eligible: WarriorStats[],
  score: (e: WarriorStats) => number,
  tiebreak: (e: WarriorStats) => number
): WarriorStats | undefined {
  let best = eligible[0];
  for (let i = 1; i < eligible.length; i++) {
    const curr = eligible[i];
    if (!curr || !best) continue;
    if (score(curr) > score(best) || (score(curr) === score(best) && tiebreak(curr) > tiebreak(best))) {
      best = curr;
    }
  }
  return best;
}

/**
 * Applies an award's fame bump and records the updated warrior in the
 * player-roster or rival-roster update map for its owning stable.
 */
function recordAward(
  state: GameState,
  recipient: WarriorStats,
  award: AnnualAward,
  fameBonus: number,
  ledger: AwardLedger
): void {
  const { updatedWarrior } = applyAward(recipient.w, award, fameBonus);
  if (recipient.w.stableId === state.player.id) {
    ledger.rosterUpdates.set(recipient.w.id, updatedWarrior);
  } else if (recipient.w.stableId) {
    const stableId = recipient.w.stableId;
    const currentRoster =
      ledger.rivalsUpdates.get(stableId)?.roster ||
      state.rivalMap?.get(stableId)?.roster ||
      [];
    const updatedRoster = [...currentRoster];
    const index = updatedRoster.findIndex((w: Warrior) => w.id === recipient.w.id);
    if (index !== -1) {
      updatedRoster[index] = updatedWarrior;
    } else {
      updatedRoster.push(updatedWarrior);
    }
    ledger.rivalsUpdates.set(stableId, { roster: updatedRoster });
  }
  ledger.awards.push(award);
}

/**
 * Process hall of fame awards for the completed year.
 *
 * @param state   - Current game state (old week/year before rollover).
 * @param newWeek - The week we are advancing *to* (used for newsletter timing).
 * @param rng     - Optional RNG service.
 * @returns       - StateImpact with awards, roster/rival updates, and newsletter items.
 */
export function processHallOfFame(
  state: GameState,
  newWeek: number,
  rng?: IRNGService
): StateImpact {
  const rngService = resolveRng(rng, state.year * 777);

  // completedYear = the year that just finished.
  // On the transition tick (week=52→1): state.year is the completed year.
  // On a post-rollover tick (week=1, year=2): state.year - 1 is the completed year.
  const completedYear = state.week === 1 ? state.year - 1 : state.year;

  if (newWeek !== 1 || completedYear < 1) return {};
  const ledger: AwardLedger = {
    rosterUpdates: new Map<WarriorId, Partial<Warrior>>(),
    rivalsUpdates: new Map<StableId, Partial<RivalStableData>>(),
    awards: [],
    hofNews: [],
  };

  const eligible = collectEligible(state, completedYear);
  if (eligible.length === 0) return {};

  const woty = pickBest(eligible, (e) => e.wins, (e) => e.fame);
  if (woty && woty.wins > 0) {
    const award: AnnualAward = {
      year: completedYear,
      type: 'WARRIOR_OF_YEAR',
      warriorId: woty.w.id,
      warriorName: woty.w.name,
      stableId: woty.w.stableId,
      value: woty.wins,
      reason: `Recorded ${woty.wins} victories in Year ${completedYear}`,
    };
    recordAward(state, woty, award, 50, ledger);
    ledger.hofNews.push(
      `🏛️ WARRIOR OF THE YEAR: ${woty.w.name} is the champion of Year ${completedYear} with ${woty.wins} wins!`
    );
  }

  const koty = pickBest(eligible, (e) => e.kills, (e) => e.wins);
  if (koty && koty.kills > 0) {
    const award: AnnualAward = {
      year: completedYear,
      type: 'KILLER_OF_YEAR',
      warriorId: koty.w.id,
      warriorName: koty.w.name,
      stableId: koty.w.stableId,
      value: koty.kills,
      reason: `Claimed ${koty.kills} lives in Year ${completedYear}`,
    };
    recordAward(state, koty, award, 50, ledger);
    ledger.hofNews.push(
      `💀 KILLER OF THE YEAR: ${koty.w.name} earned the 'Reaper's Gaze' with ${koty.kills} kills.`
    );
  }

  for (const style of Object.values(FightingStyle)) {
    const styleEligible = eligible.filter((e) => e.w.style === style);
    const mvp = pickBest(styleEligible, (e) => e.wins, (e) => e.fame);
    if (mvp && mvp.wins > 0) {
      const award: AnnualAward = {
        year: completedYear,
        type: 'CLASS_MVP',
        warriorId: mvp.w.id,
        warriorName: mvp.w.name,
        stableId: mvp.w.stableId,
        style,
        value: mvp.wins,
        reason: `Leading ${style} specialist in Year ${completedYear}`,
      };
      recordAward(state, mvp, award, 20, ledger);
      ledger.hofNews.push(
        `⚔️ ${style.toUpperCase()} MVP: ${mvp.w.name} honored as the elite of their class.`
      );
    }
  }

  const impact: StateImpact = {
    awards: [...(state.awards || []), ...ledger.awards],
    rosterUpdates: ledger.rosterUpdates,
    rivalsUpdates: ledger.rivalsUpdates,
  };

  if (ledger.hofNews.length > 0) {
    impact.newsletterItems = [
      {
        id: rngService.uuid(),
        week: newWeek,
        title: 'Hall of Fame Inductions',
        items: ledger.hofNews,
      },
    ];
  }

  return impact;
}

function applyAward(
  warrior: Warrior,
  award: AnnualAward,
  fameBonus: number
): { updatedWarrior: Warrior } {
  const updatedWarrior = {
    ...warrior,
    fame: (warrior.fame || 0) + fameBonus,
    flair: [...(warrior.flair || []), award.type],
  };

  return { updatedWarrior };
}

/**
 * Create yearly warrior-career snapshots used as baselines for award calculations.
 *
 * @param state        - Current game state.
 * @param snapshotYear - The year key to store the snapshot under. Defaults to `state.year`.
 * @returns            - StateImpact with rosterUpdates and rivalsUpdates.
 */
export function createYearlySnapshots(state: GameState, snapshotYear?: number): StateImpact {
  const currentYear = snapshotYear ?? state.year;
  const rosterUpdates = new Map<WarriorId, Partial<Warrior>>();
  const rivalsUpdates = new Map<StableId, Partial<RivalStableData>>();

  state.roster.forEach((w: Warrior) => {
    const career = w.career || { wins: 0, losses: 0, kills: 0 };
    rosterUpdates.set(w.id, {
      yearlySnapshots: {
        ...(w.yearlySnapshots || {}),
        [currentYear]: { ...career, fame: w.fame || 0 },
      },
    });
  });

  state.rivals.forEach((r) => {
    const updatedRoster = r.roster.map((w: Warrior) => {
      const career = w.career || { wins: 0, losses: 0, kills: 0 };
      return {
        ...w,
        yearlySnapshots: {
          ...(w.yearlySnapshots || {}),
          [currentYear]: { ...career, fame: w.fame || 0 },
        },
      };
    });
    rivalsUpdates.set(r.id, { roster: updatedRoster });
  });

  return { rosterUpdates, rivalsUpdates };
}

/**
 * Score a fight for 'Fight of the Week' consideration: kills outrank
 * everything, then flashy spectacle, then the fame the bout generated.
 */
function fightNotability(f: FightSummary): number {
  return (
    (f.by === 'Kill' ? 1_000_000 : 0) +
    (f.flashyTags?.length ?? 0) * 10_000 +
    (f.fameDeltaA ?? 0) +
    (f.fameDeltaD ?? 0)
  );
}

/**
 * Append the week's standout bouts to the Hall of Fame ledger.
 *
 * The `hallOfFame` state field was plumbed end-to-end (impact writer,
 * truncation cap, declared pipeline write) but no producer ever created a
 * `HallEntry` — the array stayed empty forever. Each week the most notable
 * bout earns a 'Fight of the Week' entry, and every tournament whose final
 * resolved that week earns a 'Fight of the Tournament' entry.
 *
 * @param state - Current game state (arenaHistory holds this week's fights).
 * @param rng   - Optional RNG service for entry ids.
 * @returns     - StateImpact with new hallOfFame entries, or {} if none.
 */
export function recordWeeklyHallOfFame(state: GameState, rng?: IRNGService): StateImpact {
  const weekFights = getFightsForWeek(state.arenaHistory || [], state.absoluteWeek);
  if (weekFights.length === 0) return {};

  const rngService = resolveRng(rng, state.absoluteWeek * 331 + 7);
  const alreadyRecorded = new Set((state.hallOfFame ?? []).map((e) => e.fightId));
  const entries: HallEntry[] = [];

  // 'Fight of the Tournament' — the final is the last recorded bout for each
  // tournamentId in this week's fights.
  const finalsByTournament = new Map<string, FightSummary>();
  for (const f of weekFights) {
    if (f.tournamentId) finalsByTournament.set(f.tournamentId, f);
  }
  for (const final of finalsByTournament.values()) {
    if (alreadyRecorded.has(final.id)) continue;
    entries.push({
      id: rngService.uuid('hof') as HallEntryId,
      week: state.week,
      label: 'Fight of the Tournament',
      fightId: final.id,
    });
    alreadyRecorded.add(final.id);
  }

  // 'Fight of the Week' — the single most notable bout of the week.
  const best = weekFights.reduce((a, b) => (fightNotability(b) > fightNotability(a) ? b : a));
  if (!alreadyRecorded.has(best.id)) {
    entries.push({
      id: rngService.uuid('hof') as HallEntryId,
      week: state.week,
      label: 'Fight of the Week',
      fightId: best.id,
    });
  }

  return entries.length > 0 ? { hallOfFame: entries } : {};
}
