import {
  type GameState,
  type AnnualAward,
  type HallEntry,
  type RivalStableData,
} from '@/types/state.types';
import type { Warrior } from '@/types/warrior.types';
import type { FightSummary } from '@/types/combat.types';
import {
  FightingStyle,
  type WarriorId,
  type StableId,
  type HallEntryId,
} from '@/types/shared.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { resolveRng } from '@/utils/random';
import { StateImpact } from '@/engine/impacts';
import { getFightsForWeek } from '@/engine/core/historyUtils';
import { warriorDisplayName } from '@/utils/warriorDisplay';
import { groupBy } from '@/utils/collections';

interface WarriorStats {
  w: Warrior;
  wins: number;
  kills: number;
  fame: number;
  medals: { gold: number; silver: number; bronze: number };
}

/** Award bookkeeping bundle: per-warrior update maps + stable-level fame. */
interface AwardLedger {
  rosterUpdates: Map<WarriorId, Partial<Warrior>>;
  rivalsUpdates: Map<StableId, Partial<RivalStableData>>;
  rivalWarriorPatches: Map<WarriorId, Partial<Warrior>>;
  awards: AnnualAward[];
  hofNews: string[];
  fameDelta: number;
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
    const snapMedals = snapshot.medals;
    eligible.push({
      w,
      wins: Math.max(0, wins),
      kills: Math.max(0, kills),
      fame: Math.max(0, fameGain),
      medals: {
        gold: Math.max(0, (w.career?.medals?.gold ?? 0) - (snapMedals?.gold ?? 0)),
        silver: Math.max(0, (w.career?.medals?.silver ?? 0) - (snapMedals?.silver ?? 0)),
        bronze: Math.max(0, (w.career?.medals?.bronze ?? 0) - (snapMedals?.bronze ?? 0)),
      },
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
    if (
      score(curr) > score(best) ||
      (score(curr) === score(best) && tiebreak(curr) > tiebreak(best))
    ) {
      best = curr;
    }
  }
  return best;
}

/**
 * Applies an award's fame bump and records the updated warrior in the
 * player-roster update map or the rival per-warrior patch map. Multiple
 * awards to the same warrior fold onto the prior pending update so every
 * bump + award record survives; rival warriors go through
 * `rivalWarriorPatches` so same-tick whole-roster replaces (yearly
 * snapshots, seasonal churn) can't erase the award.
 */
function recordAward(
  state: GameState,
  recipient: WarriorStats,
  award: AnnualAward,
  fameBonus: number,
  ledger: AwardLedger
): void {
  if (recipient.w.stableId === state.player.id) {
    const base = (ledger.rosterUpdates.get(recipient.w.id) as Warrior | undefined) ?? recipient.w;
    ledger.rosterUpdates.set(recipient.w.id, applyAward(base, award, fameBonus).updatedWarrior);
  } else if (recipient.w.stableId) {
    const base =
      (ledger.rivalWarriorPatches.get(recipient.w.id) as Warrior | undefined) ?? recipient.w;
    ledger.rivalWarriorPatches.set(recipient.w.id, applyAward(base, award, fameBonus).updatedWarrior);
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
    rivalWarriorPatches: new Map<WarriorId, Partial<Warrior>>(),
    awards: [],
    hofNews: [],
    fameDelta: 0,
  };

  const eligible = collectEligible(state, completedYear);
  if (eligible.length === 0) return {};

  awardTopHonors(state, eligible, completedYear, ledger);
  awardClassMvps(state, eligible, completedYear, ledger);
  awardStableOfYear(state, eligible, completedYear, ledger);
  awardTournamentRank(state, eligible, completedYear, ledger);

  const impact: StateImpact = {
    awards: [...(state.awards || []), ...ledger.awards],
    rosterUpdates: ledger.rosterUpdates,
    rivalsUpdates: ledger.rivalsUpdates,
    rivalWarriorPatches: ledger.rivalWarriorPatches,
  };
  if (ledger.fameDelta !== 0) {
    impact.fameDelta = (impact.fameDelta ?? 0) + ledger.fameDelta;
  }

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

/** Warrior of the Year + Killer of the Year headline awards. */
function awardTopHonors(
  state: GameState,
  eligible: ReturnType<typeof collectEligible>,
  completedYear: number,
  ledger: AwardLedger
): void {
  const woty = pickBest(
    eligible,
    (e) => e.wins,
    (e) => e.fame
  );
  if (woty && woty.wins > 0) {
    recordAward(
      state,
      woty,
      {
        year: completedYear,
        type: 'WARRIOR_OF_YEAR',
        warriorId: woty.w.id,
        warriorName: woty.w.name,
        stableId: woty.w.stableId,
        value: woty.wins,
        reason: `Recorded ${woty.wins} victories in Year ${completedYear}`,
      },
      50,
      ledger
    );
    ledger.hofNews.push(
      `🏛️ WARRIOR OF THE YEAR: ${warriorDisplayName(woty.w)} is the champion of Year ${completedYear} with ${woty.wins} wins!`
    );
  }

  const koty = pickBest(
    eligible,
    (e) => e.kills,
    (e) => e.wins
  );
  if (koty && koty.kills > 0) {
    recordAward(
      state,
      koty,
      {
        year: completedYear,
        type: 'KILLER_OF_YEAR',
        warriorId: koty.w.id,
        warriorName: koty.w.name,
        stableId: koty.w.stableId,
        value: koty.kills,
        reason: `Claimed ${koty.kills} lives in Year ${completedYear}`,
      },
      50,
      ledger
    );
    ledger.hofNews.push(
      `💀 KILLER OF THE YEAR: ${warriorDisplayName(koty.w)} earned the 'Reaper's Gaze' with ${koty.kills} kills.`
    );
  }
}

/** Per-style MVP awards — leading specialist of each class. */
function awardClassMvps(
  state: GameState,
  eligible: ReturnType<typeof collectEligible>,
  completedYear: number,
  ledger: AwardLedger
): void {
  // One grouping pass — buckets preserve eligible order, so each style's
  // pickBest argmax is identical to filtering per style.
  const eligibleByStyle = groupBy(eligible, (e) => e.w.style);
  for (const style of Object.values(FightingStyle)) {
    const styleEligible = eligibleByStyle.get(style) ?? [];
    const mvp = pickBest(
      styleEligible,
      (e) => e.wins,
      (e) => e.fame
    );
    if (mvp && mvp.wins > 0) {
      recordAward(
        state,
        mvp,
        {
          year: completedYear,
          type: 'CLASS_MVP',
          warriorId: mvp.w.id,
          warriorName: mvp.w.name,
          stableId: mvp.w.stableId,
          style,
          value: mvp.wins,
          reason: `Leading ${style} specialist in Year ${completedYear}`,
        },
        20,
        ledger
      );
      ledger.hofNews.push(
        `⚔️ ${style.toUpperCase()} MVP: ${warriorDisplayName(mvp.w)} honored as the elite of their class.`
      );
    }
  }
}

/**
 * Stable of the Year — the stable whose roster posted the most wins in the
 * completed year. Stable-level award: no warriorId; the +30 fame bump lands
 * on the stable itself (player fameDelta or a rival-stable fame patch).
 */
function awardStableOfYear(
  state: GameState,
  eligible: ReturnType<typeof collectEligible>,
  completedYear: number,
  ledger: AwardLedger
): void {
  const winsByStable = new Map<StableId, number>();
  for (const e of eligible) {
    const sid = e.w.stableId;
    if (!sid) continue;
    winsByStable.set(sid, (winsByStable.get(sid) ?? 0) + e.wins);
  }

  let bestId: StableId | undefined;
  let bestWins = 0;
  for (const [id, wins] of winsByStable) {
    if (wins > bestWins || (wins === bestWins && wins > 0 && bestId !== undefined && id < bestId)) {
      bestId = id;
      bestWins = wins;
    } else if (wins === bestWins && wins > 0 && bestId === undefined) {
      bestId = id;
    }
  }
  if (!bestId || bestWins <= 0) return;

  const isPlayer = bestId === state.player.id;
  const stableName = isPlayer
    ? state.player.stableName
    : (state.rivalMap?.get(bestId)?.owner?.stableName ??
      state.rivals.find((r) => r.id === bestId)?.owner?.stableName ??
      bestId);

  ledger.awards.push({
    year: completedYear,
    type: 'STABLE_OF_YEAR',
    stableId: bestId,
    stableName,
    value: bestWins,
    reason: `Posted ${bestWins} stable victories in Year ${completedYear}`,
  });

  const SOTY_FAME = 30;
  if (isPlayer) {
    ledger.fameDelta += SOTY_FAME;
  } else {
    const current = ledger.rivalsUpdates.get(bestId) ?? {};
    const baseFame =
      current.fame ??
      state.rivalMap?.get(bestId)?.fame ??
      state.rivals.find((r) => r.id === bestId)?.fame ??
      0;
    ledger.rivalsUpdates.set(bestId, { ...current, fame: baseFame + SOTY_FAME });
  }

  ledger.hofNews.push(
    `🛡️ STABLE OF THE YEAR: ${stableName} leads all stables with ${bestWins} victories in Year ${completedYear}!`
  );
}

/**
 * Tournament Rank — the year's most decorated tournament fighter, scored
 * 3/2/1 on gold/silver/bronze medal deltas. Only lands when somebody
 * actually medaled that year.
 */
function awardTournamentRank(
  state: GameState,
  eligible: ReturnType<typeof collectEligible>,
  completedYear: number,
  ledger: AwardLedger
): void {
  const medalScore = (e: WarriorStats) =>
    e.medals.gold * 3 + e.medals.silver * 2 + e.medals.bronze;

  const best = pickBest(
    eligible,
    (e) => medalScore(e),
    (e) => e.fame
  );
  const score = best ? medalScore(best) : 0;
  if (!best || score <= 0) return;

  recordAward(
    state,
    best,
    {
      year: completedYear,
      type: 'TOURNAMENT_RANK',
      warriorId: best.w.id,
      warriorName: best.w.name,
      stableId: best.w.stableId,
      value: score,
      reason: `Top tournament medalist of Year ${completedYear} (${score} medal points)`,
    },
    25,
    ledger
  );
  ledger.hofNews.push(
    `🏅 TOURNAMENT RANK: ${warriorDisplayName(best.w)} is the year's most decorated tournament fighter.`
  );
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
    // The award record itself must live on the warrior — the legacy-founder
    // gate and the Chronicle tab read `warrior.awards`, not `flair`.
    awards: [...(warrior.awards ?? []), award],
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

  state.roster.forEach((w: Warrior) => {
    const career = w.career || { wins: 0, losses: 0, kills: 0 };
    rosterUpdates.set(w.id, {
      yearlySnapshots: {
        ...(w.yearlySnapshots || {}),
        [currentYear]: { ...career, fame: w.fame || 0 },
      },
    });
  });

  // Rival warriors go through per-warrior patches — whole-roster
  // `rivalsUpdates` writes from same-tick writers (award rosters, seasonal
  // churn's evolved rivals) would otherwise erase the snapshot write.
  const rivalWarriorPatches = new Map<WarriorId, Partial<Warrior>>();
  state.rivals.forEach((r) => {
    r.roster.forEach((w: Warrior) => {
      const career = w.career || { wins: 0, losses: 0, kills: 0 };
      rivalWarriorPatches.set(w.id, {
        yearlySnapshots: {
          ...(w.yearlySnapshots || {}),
          [currentYear]: { ...career, fame: w.fame || 0 },
        },
      });
    });
  });

  return { rosterUpdates, rivalWarriorPatches };
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
