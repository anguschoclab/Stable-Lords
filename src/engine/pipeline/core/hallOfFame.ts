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
  const hofNews: string[] = [];
  const rosterUpdates = new Map<WarriorId, Partial<Warrior>>();
  const rivalsUpdates = new Map<StableId, Partial<RivalStableData>>();
  const awards: AnnualAward[] = [];

  interface WarriorStats {
    w: Warrior;
    wins: number;
    kills: number;
    fame: number;
  }
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

  if (eligible.length === 0) return {};

  // ⚡ Bolt Optimization: Using single-pass loop instead of .reduce() to avoid redundant score evaluations.
  let woty = eligible[0];
  if (!woty) return {};
  for (let i = 1; i < eligible.length; i++) {
    const curr = eligible[i];
    if (!curr) continue;
    if (curr.wins > woty.wins || (curr.wins === woty.wins && curr.fame > woty.fame)) {
      woty = curr;
    }
  }
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
    const { updatedWarrior } = applyAward(woty.w, award, 50);
    if (woty.w.stableId === state.player.id) {
      rosterUpdates.set(woty.w.id, updatedWarrior);
    } else if (woty.w.stableId) {
      const stableId = woty.w.stableId;
      const currentRoster =
        rivalsUpdates.get(stableId)?.roster || state.rivalMap?.get(stableId)?.roster || [];
      const updatedRoster = [...currentRoster];
      const index = updatedRoster.findIndex((w: Warrior) => w.id === woty.w.id);
      if (index !== -1) {
        updatedRoster[index] = updatedWarrior;
      } else {
        updatedRoster.push(updatedWarrior);
      }
      rivalsUpdates.set(stableId, { roster: updatedRoster });
    }
    awards.push(award);
    hofNews.push(
      `🏛️ WARRIOR OF THE YEAR: ${woty.w.name} is the champion of Year ${completedYear} with ${woty.wins} wins!`
    );
  }

  // ⚡ Bolt Optimization: Using single-pass loop instead of .reduce() to avoid redundant score evaluations.
  let koty = eligible[0];
  if (!koty) return {};
  for (let i = 1; i < eligible.length; i++) {
    const curr = eligible[i];
    if (!curr) continue;
    if (curr.kills > koty.kills || (curr.kills === koty.kills && curr.wins > koty.wins)) {
      koty = curr;
    }
  }
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
    const { updatedWarrior } = applyAward(koty.w, award, 50);
    if (koty.w.stableId === state.player.id) {
      rosterUpdates.set(koty.w.id, updatedWarrior);
    } else if (koty.w.stableId) {
      const existingRoster = rivalsUpdates.get(koty.w.stableId)?.roster || [];
      const updatedRoster = [...existingRoster];
      const index = updatedRoster.findIndex((w) => w.id === koty.w.id);
      if (index !== -1) {
        updatedRoster[index] = updatedWarrior;
      } else {
        updatedRoster.push(updatedWarrior);
      }
      rivalsUpdates.set(koty.w.stableId, { roster: updatedRoster });
    }
    awards.push(award);
    hofNews.push(
      `💀 KILLER OF THE YEAR: ${koty.w.name} earned the 'Reaper's Gaze' with ${koty.kills} kills.`
    );
  }

  Object.values(FightingStyle).forEach((style) => {
    const styleEligible = eligible.filter((e) => e.w.style === style);
    // ⚡ Bolt Optimization: Using single-pass loop instead of .reduce() to avoid redundant score evaluations.
    const firstStyle = styleEligible[0];
    if (!firstStyle) return;
    let mvp = firstStyle;
    for (let i = 1; i < styleEligible.length; i++) {
      const curr = styleEligible[i];
      if (!curr) continue;
      if (curr.wins > mvp.wins || (curr.wins === mvp.wins && curr.fame > mvp.fame)) {
        mvp = curr;
      }
    }
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
      const { updatedWarrior } = applyAward(mvp.w, award, 20);
      if (mvp.w.stableId === state.player.id) {
        rosterUpdates.set(mvp.w.id, updatedWarrior);
      } else if (mvp.w.stableId) {
        const existingRoster = rivalsUpdates.get(mvp.w.stableId)?.roster || [];
        const updatedRoster = [...existingRoster];
        const index = updatedRoster.findIndex((w) => w.id === mvp.w.id);
        if (index !== -1) {
          updatedRoster[index] = updatedWarrior;
        } else {
          updatedRoster.push(updatedWarrior);
        }
        rivalsUpdates.set(mvp.w.stableId, { roster: updatedRoster });
      }
      awards.push(award);
      hofNews.push(
        `⚔️ ${style.toUpperCase()} MVP: ${mvp.w.name} honored as the elite of their class.`
      );
    }
  });

  const impact: StateImpact = {
    awards: [...(state.awards || []), ...awards],
    rosterUpdates,
    rivalsUpdates,
  };

  if (hofNews.length > 0) {
    impact.newsletterItems = [
      {
        id: rngService.uuid(),
        week: newWeek,
        title: 'Hall of Fame Inductions',
        items: hofNews,
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
