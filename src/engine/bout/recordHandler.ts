import type { GameState } from '@/types/state.types';
import type { WarriorId } from '@/types/shared.types';
import type { Warrior } from '@/types/warrior.types';
import type { FightOutcome } from '@/types/combat.types';
import { isPlayerOwned, patchRivalWarrior } from './warriorRouting';
import { StateImpact, type WarriorEpithetAward } from '@/engine/impacts';
import { updateWarriorAfterBout } from './warriorStateUpdater';

/** Participant ids across all active tournaments — built once per bout. */
function tournamentParticipantIds(state: GameState): Set<string> {
  const ids = new Set<string>();
  if (!state.isTournamentWeek || !state.tournaments) return ids;
  for (const t of state.tournaments) {
    if (t.completed) continue;
    for (const p of t.participants ?? []) ids.add(p.id);
  }
  return ids;
}

/**
 *
 */
interface ApplyRecordsArgs {
  s: GameState;
  wA: Warrior;
  wD: Warrior;
  outcome: FightOutcome;
  tags: string[];
  fameA: number;
  popA: number;
  fameD: number;
  popD: number;
  arenaId?: string;
}

/**
 * Apply records.
 * @param args.s -
 * @param args.wA -
 * @param args.wD -
 * @param args.outcome -
 * @param args.tags -
 * @param args.fameA -
 * @param args.popA -
 * @param args.fameD -
 * @param args.popD -
 * @param args.arenaId -
 */
export function applyRecords(args: ApplyRecordsArgs): StateImpact {
  const { s, wA, wD, outcome, tags } = args;
  const { fameA, popA, fameD, popD } = args;
  const { arenaId } = args;
  const rosterUpdates = new Map<WarriorId, Partial<Warrior>>();
  const rivalWarriorPatches = new Map<WarriorId, Partial<Warrior>>();
  const epithetAwards: WarriorEpithetAward[] = [];
  const queueEpithet = (before: Warrior, after: Warrior) => {
    if (after.epithet && after.epithet !== before.epithet) {
      epithetAwards.push({ warriorId: after.id, epithet: after.epithet });
    }
  };

  // 🔒 Tournament fatigue exemption: Check if warriors are tournament participants
  const participantIds = tournamentParticipantIds(s);
  const skipFatigueA = participantIds.has(wA.id);
  const skipFatigueD = participantIds.has(wD.id);

  // Either side may be player- or rival-owned (world bouts are rival vs
  // rival). Player warriors keep the rosterUpdates path; rival warriors get a
  // per-warrior patch — previously side A of a world bout was written to the
  // player roster (a no-op) and side D's roster write was clobbered later.
  const sides = [
    { w: wA, won: outcome.winner === 'A', fame: fameA, pop: popA, skip: skipFatigueA },
    { w: wD, won: outcome.winner === 'D', fame: fameD, pop: popD, skip: skipFatigueD },
  ];
  for (const side of sides) {
    const isKill = side.won && outcome.by === 'Kill';
    if (isPlayerOwned(s, side.w)) {
      const updated = updateWarriorAfterBout({
        warrior: side.w,
        fameDelta: side.fame,
        popularityDelta: side.pop,
        isWinner: side.won,
        wasKilled: isKill,
        tags: tags,
        skipFatigue: side.skip,
        arenaId: arenaId,
      });
      queueEpithet(side.w, updated);
      rosterUpdates.set(side.w.id, updated);
    } else {
      // Rivals track no popularity from bouts (unchanged from the prior D-side path).
      const updated = updateWarriorAfterBout({
        warrior: side.w,
        fameDelta: side.fame,
        popularityDelta: 0,
        isWinner: side.won,
        wasKilled: isKill,
        tags: tags,
        skipFatigue: side.skip,
        arenaId: arenaId,
      });
      queueEpithet(side.w, updated);
      patchRivalWarrior(rivalWarriorPatches, side.w, updated);
    }
  }

  const impact: StateImpact = { rosterUpdates, rivalWarriorPatches };
  if (epithetAwards.length > 0) impact.warriorEpithets = epithetAwards;
  return impact;
}
