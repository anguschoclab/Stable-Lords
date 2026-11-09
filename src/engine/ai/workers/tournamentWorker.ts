/**
 * Tournament worker — TOURNAMENT_CAMPAIGN preparation shaping.
 *
 * Preparation only: the season's top-2 fame warriors get rest ('recovery')
 * training assignments, which suppress their bout bids through the same
 * isBookable gate every other assignment uses. Committee
 * selection stays rank-based — this worker cannot influence entry, only
 * how fresh the stable's contenders are when the bracket lands.
 */
import type { RivalStableData } from '@/types/state.types';
import { logAgentAction } from '../agentCore';
import { isActive } from '@/engine/warrior/warriorStatus';
import { weeksUntilNextSeasonalTournament } from '@/engine/core/absoluteWeek';
import {
  TOURNAMENT_CLASSES,
  TOURNAMENT_FREEZE_OFFSET,
  STABLE_CLASS_ENTRY_CAP,
  classAtFreeze,
} from '@/engine/matchmaking/tournamentSelection/classes';
import { fightEquivalentsOf } from '@/engine/warrior/careerUpdate';
import type { TournamentCycle } from '@/types/state.types';
import type { WarriorId } from '@/types/shared.types';

/** Contenders rested per campaign week — the stable's tournament core. */
const CAMPAIGN_REST_COUNT = 2;

/** Weeks-out window where taper prep applies (freeze week + post-freeze). */
const PREP_WINDOW = TOURNAMENT_FREEZE_OFFSET;

/**
 * Weekly TOURNAMENT_CAMPAIGN prep: assign 'recovery' training to the stable's
 * top-fame active warriors so they enter the bracket rested. No-op for any
 * other intent or when every contender is already resting.
 */
export function processTournamentPrep(
  rival: RivalStableData,
  week: number,
  _state?: unknown
): { updatedRival: RivalStableData; gazetteItems: string[] } {
  const gazetteItems: string[] = [];
  if (rival.strategy?.intent !== 'TOURNAMENT_CAMPAIGN') {
    return { updatedRival: rival, gazetteItems };
  }

  // Calendar gate: taper only inside the freeze window. Off-season weeks leave
  // the stable's normal training load alone — prep is cheap, not free.
  if (weeksUntilNextSeasonalTournament(week) > PREP_WINDOW) {
    return { updatedRival: rival, gazetteItems };
  }

  const contenders = rival.roster
    .filter(isActive)
    .sort((a, b) => (b.fame ?? 0) - (a.fame ?? 0))
    .slice(0, CAMPAIGN_REST_COUNT);
  if (contenders.length === 0) {
    return { updatedRival: rival, gazetteItems };
  }

  const alreadyRested = new Set(rival.trainingAssignments.map((a) => a.warriorId));
  const newAssignments = contenders
    .filter((w) => !alreadyRested.has(w.id))
    .map((w) => ({ warriorId: w.id, type: 'recovery' as const }));

  // Breakpoint holdouts — the article's sandbag: on the freeze week, sit
  // warriors at/within-1 of a class ceiling so they lock in at the band top
  // instead of crossing one bout before the snapshot. Post-freeze weeks
  // (weeksUntil < FREEZE_OFFSET) release them — the exploit is locked in.
  if (weeksUntilNextSeasonalTournament(week) === TOURNAMENT_FREEZE_OFFSET) {
    const rested = new Set(newAssignments.map((a) => a.warriorId));
    for (const w of rival.roster) {
      if (!isActive(w) || rested.has(w.id) || alreadyRested.has(w.id)) continue;
      const fe = fightEquivalentsOf(w);
      const spec = TOURNAMENT_CLASSES.find((c) => fe >= c.minFE && fe <= c.maxFE);
      if (spec && Number.isFinite(spec.maxFE) && fe >= spec.maxFE - 1) {
        newAssignments.push({ warriorId: w.id, type: 'recovery' as const });
        rested.add(w.id);
      }
    }
  }

  if (newAssignments.length === 0) {
    return { updatedRival: rival, gazetteItems };
  }

  let updatedRival: RivalStableData = {
    ...rival,
    trainingAssignments: [...rival.trainingAssignments, ...newAssignments],
  };
  updatedRival = logAgentAction({
    rival: updatedRival,
    type: 'ROSTER',
    description: `Resting ${newAssignments.length} contender(s) for the tournament bracket.`,
    riskTier: 'Low',
    week: week,
    cause: 'TOURNAMENT_PREP',
  });
  gazetteItems.push(
    `🏆 ${updatedRival.owner.stableName} rests its top contenders ahead of the tournament.`
  );

  return { updatedRival, gazetteItems };
}

/**
 * V27 tourney metagame: file the stable's declarations for the upcoming
 * seasonal. Gated to the entry window (freeze week through tournament week —
 * `weeksUntil <= TOURNAMENT_FREEZE_OFFSET` on the upcoming week), then
 * class-buckets the active roster on FROZEN FE and files the strongest
 * `STABLE_CLASS_ENTRY_CAP` warriors per class into `tournamentEntryIds`.
 * Deterministic by construction — sorts only, no rng draws (shard parity).
 */
export function planTournamentEntries(
  rival: RivalStableData,
  nextWeek: number,
  state?: unknown
): { updatedRival: RivalStableData; gazetteItems: string[] } {
  // Entry window: the freeze has dropped (or drops this week) and brackets
  // haven't run — outside it, declarations are meaningless paperwork.
  if (weeksUntilNextSeasonalTournament(nextWeek) > TOURNAMENT_FREEZE_OFFSET) {
    return { updatedRival: rival, gazetteItems: [] };
  }

  // RECOVERY/SURVIVAL stables pull out of the cycle entirely — scratched
  // invites read at emission instead of an emit-time decline.
  const intent = rival.strategy?.intent;
  if (intent === 'RECOVERY' || intent === 'SURVIVAL') {
    const pulled = rival.roster.filter(isActive).map((w) => w.id);
    return {
      updatedRival: { ...rival, tournamentEntryIds: [], tournamentScratchIds: pulled },
      gazetteItems: pulled.length
        ? [`🏳️ ${rival.owner.stableName} withdraws its roster from the tournament cycle.`]
        : [],
    };
  }

  const cycle = (state as { tournamentCycle?: TournamentCycle } | undefined)?.tournamentCycle;
  const scratched = new Set<WarriorId>((cycle?.scratched ?? []) as WarriorId[]);
  const alreadyInvited = new Set<WarriorId>(
    Object.values(cycle?.invited ?? {}).flat() as WarriorId[]
  );

  // Deterministic class buckets: fame desc, id asc as the stable tiebreak.
  const eligible = rival.roster
    .filter((w) => isActive(w) && !scratched.has(w.id) && !alreadyInvited.has(w.id))
    .sort((a, b) => (b.fame ?? 0) - (a.fame ?? 0) || (a.id < b.id ? -1 : 1));

  const picks: WarriorId[] = [];
  const taken = new Map<string, number>();
  for (const spec of TOURNAMENT_CLASSES) {
    for (const w of eligible) {
      if (taken.get(spec.id) ?? 0 >= STABLE_CLASS_ENTRY_CAP) break;
      if (classAtFreeze({ tournamentCycle: cycle }, w.id, fightEquivalentsOf(w)) !== spec.id) {
        continue;
      }
      picks.push(w.id);
      taken.set(spec.id, (taken.get(spec.id) ?? 0) + 1);
    }
  }

  if (picks.length === 0) {
    return { updatedRival: { ...rival, tournamentEntryIds: [] }, gazetteItems: [] };
  }
  return {
    updatedRival: { ...rival, tournamentEntryIds: picks },
    gazetteItems: [
      `🎟️ ${rival.owner.stableName} files ${picks.length} tournament declaration${picks.length === 1 ? '' : 's'} for the seasonal.`,
    ],
  };
}
