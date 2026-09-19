import type { GameState } from '@/types/state.types';
import type { FightSummary } from '@/types/combat.types';
import type { Warrior } from '@/types/warrior.types';

/**
 * Per-array caps applied by {@link truncateState}. Exported so long-running
 * consumers (autosim, the simulation harness) can tune bounds without
 * forking the truncation logic.
 */
export const TRUNCATION_CAPS = {
  arenaHistory: 500,
  arenaHistoryTranscripts: 20,
  newsletter: 100,
  newsletterItems: 200,
  ledger: 500,
  matchHistory: 500,
  moodHistory: 50,
  graveyard: 200,
  retired: 200,
  tournaments: 100,
  scoutReports: 100,
  hallOfFame: 100,
  rivalries: 100,
  ownerGrudges: 100,
  seasonalGrowth: 500,
  insightTokens: 500,
  playerChallenges: 100,
  playerAvoids: 100,
  trainingAssignments: 200,
  gazettes: 50,
  coachDismissed: 100,
  restStates: 500,
  hiringPool: 20,
  recruitPool: 50,
  trainers: 50,
  rivals: 50,
  rivalLedger: 500,
  promoterNotableBouts: 10,
  unacknowledgedDeaths: 100,
  deferredBoutLogs: 200,
  awards: 100,
  warriorTitles: 50,
  warriorFlair: 50,
  warriorAwards: 50,
  warriorYearlySnapshots: 10,
} as const;

/**
 * Optional per-call overrides for {@link TRUNCATION_CAPS}.
 */
export type TruncationCaps = Partial<Record<keyof typeof TRUNCATION_CAPS, number>>;

type ResolvedCaps = Record<keyof typeof TRUNCATION_CAPS, number>;

/**
 * Defensive caps on per-warrior historical arrays (titles, flair, awards,
 * yearlySnapshots). These grow ~1/year so they are low-risk, but capping is
 * cheap insurance for very long sims. Warriors under every cap are returned
 * by reference so truncation stays allocation-free for the common case.
 * Functional arrays (injuries, traits, career) are never touched.
 */
function capWarriorHistory(w: Warrior, caps: ResolvedCaps): Warrior {
  const snapshots = w.yearlySnapshots;
  const snapshotOverflow = snapshots
    ? Object.keys(snapshots).length - caps.warriorYearlySnapshots
    : 0;

  const needsTitles = (w.titles?.length ?? 0) > caps.warriorTitles;
  const needsFlair = (w.flair?.length ?? 0) > caps.warriorFlair;
  const needsAwards = (w.awards?.length ?? 0) > caps.warriorAwards;

  if (!needsTitles && !needsFlair && !needsAwards && snapshotOverflow <= 0) return w;

  const trimmed: Warrior = { ...w };
  if (needsTitles) trimmed.titles = (w.titles || []).slice(-caps.warriorTitles);
  if (needsFlair) trimmed.flair = (w.flair || []).slice(-caps.warriorFlair);
  if (needsAwards) trimmed.awards = (w.awards || []).slice(-caps.warriorAwards);
  if (snapshotOverflow > 0 && snapshots) {
    const keys = Object.keys(snapshots)
      .map(Number)
      .sort((a, b) => a - b)
      .slice(-caps.warriorYearlySnapshots);
    const kept: NonNullable<Warrior['yearlySnapshots']> = {};
    for (const k of keys) {
      const snap = snapshots[k];
      if (snap) kept[k] = snap;
    }
    trimmed.yearlySnapshots = kept;
  }
  return trimmed;
}

/**
 * Caps historical arrays on each warrior; returns the original array
 * (same reference) when no warrior exceeded the caps.
 */
function capWarriors(warriors: Warrior[] | undefined, caps: ResolvedCaps): Warrior[] {
  if (!warriors) return [];
  let changed = false;
  const out = warriors.map((w) => {
    const nw = capWarriorHistory(w, caps);
    if (nw !== w) changed = true;
    return nw;
  });
  return changed ? out : warriors;
}

/**
 * Prunes historical data to keep the save file size manageable.
 * - Keeps last 500 arena history entries.
 * - Removes transcripts from older fights (only keeps last 20).
 * - Bounds various history arrays.
 */
export function truncateState(state: GameState, overrides?: TruncationCaps): GameState {
  const caps = { ...TRUNCATION_CAPS, ...overrides };
  const arenaHistory = (state.arenaHistory || [])
    .slice(-caps.arenaHistory)
    .map((f, i, arr) => {
      // Keep transcripts only for the last N fights to save memory
      if (arr.length - i > caps.arenaHistoryTranscripts && f.transcript) {
        const { transcript: _transcript, ...rest } = f;
        return rest as FightSummary;
      }
      return f;
    });

  return {
    ...state,
    arenaHistory,
    newsletter: (state.newsletter || []).slice(-caps.newsletter).map((n) =>
      (n.items?.length ?? 0) > caps.newsletterItems
        ? { ...n, items: n.items.slice(-caps.newsletterItems) }
        : n
    ),
    ledger: (state.ledger || []).slice(-caps.ledger),
    matchHistory: (state.matchHistory || []).slice(-caps.matchHistory),
    moodHistory: (state.moodHistory || []).slice(-caps.moodHistory),
    graveyard: capWarriors((state.graveyard || []).slice(-caps.graveyard), caps),
    retired: capWarriors((state.retired || []).slice(-caps.retired), caps),
    tournaments: (state.tournaments || []).slice(-caps.tournaments),
    scoutReports: (state.scoutReports || []).slice(-caps.scoutReports),
    hallOfFame: (state.hallOfFame || []).slice(-caps.hallOfFame),
    rivalries: (state.rivalries || []).slice(-caps.rivalries),
    ownerGrudges: (state.ownerGrudges || []).slice(-caps.ownerGrudges),
    seasonalGrowth: (state.seasonalGrowth || []).slice(-caps.seasonalGrowth),
    insightTokens: (state.insightTokens || []).slice(-caps.insightTokens),
    playerChallenges: (state.playerChallenges || []).slice(-caps.playerChallenges),
    playerAvoids: (state.playerAvoids || []).slice(-caps.playerAvoids),
    trainingAssignments: (state.trainingAssignments || []).slice(-caps.trainingAssignments),
    gazettes: (state.gazettes || []).slice(-caps.gazettes),
    coachDismissed: (state.coachDismissed || []).slice(-caps.coachDismissed),
    restStates: (state.restStates || []).slice(-caps.restStates),
    hiringPool: (state.hiringPool || []).slice(-caps.hiringPool),
    recruitPool: (state.recruitPool || []).slice(-caps.recruitPool),
    trainers: (state.trainers || []).slice(-caps.trainers),
    roster: state.roster ? capWarriors(state.roster, caps) : state.roster,
    rivals: (state.rivals || []).slice(-caps.rivals).map((r) => ({
      ...r,
      roster: capWarriors(r.roster, caps),
      ledger: (r.ledger || []).slice(-caps.rivalLedger),
      seasonalGrowth: (r.seasonalGrowth || []).filter((sg) => sg.season === state.season),
    })),
    promoters: Object.fromEntries(
      Object.entries(state.promoters || {}).map(([id, p]) => [
        id,
        {
          ...p,
          history: {
            ...p.history,
            notableBouts: (p.history?.notableBouts || []).slice(-caps.promoterNotableBouts),
          },
        },
      ])
    ),
    unacknowledgedDeaths: (state.unacknowledgedDeaths || []).slice(-caps.unacknowledgedDeaths),
    deferredBoutLogs: (state.deferredBoutLogs || []).slice(-caps.deferredBoutLogs),
    awards: (state.awards || []).slice(-caps.awards),
    lastWeekBoutDisplay: undefined,
  };
}
