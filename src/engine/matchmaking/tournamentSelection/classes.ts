import { weeksUntilNextSeasonalTournament } from '@/engine/core/absoluteWeek';

/**
 * Tournament classes — the Duel2 canon FE (fight-equivalency) bands.
 * One arena bout = 1 FE; a tournament bout grants 1 FE per odd round fought
 * (rounds 1/3/5 in a six-round bracket — byes, forfeits, and the round-6
 * bronze playoff accrue nothing). Class membership is locked by the warrior's
 * FE at the freeze snapshot, so post-freeze fights stack experience on top of
 * the locked class without moving the warrior up.
 */
export type TournamentClassId = 'rookies' | 'apprentices' | 'initiates' | 'adepts' | 'champions';

/** A single FE-banded tournament class: bracket size, purse, and fill policy. */
export interface TournamentClassSpec {
  id: TournamentClassId;
  name: string;
  minFE: number;
  maxFE: number;
  fieldCap: number;
  minField: number;
  purse: number;
  /** Freelancer attribute budget when padding a short field. */
  freelancerPool: number;
}

export const TOURNAMENT_CLASSES: readonly TournamentClassSpec[] = [
  {
    id: 'rookies',
    name: 'Rookie Open',
    minFE: 0,
    maxFE: 0,
    fieldCap: 64,
    minField: 8,
    purse: 600,
    freelancerPool: 70,
  },
  {
    id: 'apprentices',
    name: 'Apprentice Lists',
    minFE: 1,
    maxFE: 4,
    fieldCap: 64,
    minField: 8,
    purse: 1200,
    freelancerPool: 85,
  },
  {
    id: 'initiates',
    name: 'Initiate Trials',
    minFE: 5,
    maxFE: 10,
    fieldCap: 64,
    minField: 8,
    purse: 2500,
    freelancerPool: 100,
  },
  {
    id: 'adepts',
    name: 'Adept Invitational',
    minFE: 11,
    maxFE: 20,
    fieldCap: 48,
    minField: 8,
    purse: 5000,
    freelancerPool: 110,
  },
  {
    id: 'champions',
    name: 'Champions Class',
    minFE: 21,
    maxFE: Number.POSITIVE_INFINITY,
    fieldCap: 32,
    minField: 8,
    purse: 8000,
    freelancerPool: 125,
  },
] as const;

/** Weeks before a seasonal tournament when the class roster freezes. */
export const TOURNAMENT_FREEZE_OFFSET = 2;

/** Committee auto-invites per class — top ranked warriors in each band. */
export const CLASS_INVITE_COUNT = 16;

/** Max declared entries a single stable may hold in one class. */
export const STABLE_CLASS_ENTRY_CAP = 4;

/** The FE-banded class a warrior belongs to for the given fight-equivalents. */
export function classForFE(fe: number): TournamentClassId {
  for (const spec of TOURNAMENT_CLASSES) {
    if (fe >= spec.minFE && fe <= spec.maxFE) return spec.id;
  }
  return 'champions';
}

/**
 * The class a warrior fights in this cycle — the FROZEN snapshot class when
 * a cycle is live (post-freeze FE growth never moves a warrior up), live FE
 * otherwise. This is the consumer-facing authority for class membership;
 * `classForFE(fightEquivalentsOf(w))` alone would un-freeze the exploit.
 */
export function classAtFreeze(
  state: { tournamentCycle?: { forWeek: number; feByWarrior: Record<string, number> } },
  warriorId: string,
  liveFE: number
): TournamentClassId {
  const frozen = state.tournamentCycle?.feByWarrior[warriorId];
  return classForFE(frozen ?? liveFE);
}

/**
 * Display-week predicate: is this week the freeze point for the next
 * seasonal tournament? Freeze lands TOURNAMENT_FREEZE_OFFSET display weeks
 * before the bracket — weeks 8/18/28/40 for the 10/20/30/42 seasonals.
 */
export function isTournamentFreezeWeek(week: number): boolean {
  return weeksUntilNextSeasonalTournament(week) === TOURNAMENT_FREEZE_OFFSET;
}
