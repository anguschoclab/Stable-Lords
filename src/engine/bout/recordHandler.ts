import type { GameState } from '@/types/state.types';
import type { WarriorId } from '@/types/shared.types';
import type { Warrior } from '@/types/warrior.types';
import type { FightOutcome } from '@/types/combat.types';
import { isPlayerOwned, patchRivalWarrior } from './warriorRouting';
import { StateImpact, type WarriorEpithetAward } from '@/engine/impacts';
import { updateWarriorAfterBout } from './warriorStateUpdater';

/** Check if a warrior is a participant in any active tournament */
function isTournamentParticipant(state: GameState, warriorId: string): boolean {
  if (!state.isTournamentWeek || !state.tournaments) return false;
  return state.tournaments.some(
    (t) => !t.completed && t.participants?.some((p) => p.id === warriorId)
  );
}

/**
 * Apply records.
 * @param s -
 * @param wA -
 * @param wD -
 * @param outcome -
 * @param tags -
 * @param fameA -
 * @param popA -
 * @param fameD -
 * @param popD -
 * @param _rivalStableId - unused; ownership is resolved per warrior
 * @param arenaId -
 */
export function applyRecords(
  s: GameState,
  wA: Warrior,
  wD: Warrior,
  outcome: FightOutcome,
  tags: string[],
  fameA: number,
  popA: number,
  fameD: number,
  popD: number,
  _rivalStableId?: string,
  arenaId?: string
): StateImpact {
  const rosterUpdates = new Map<WarriorId, Partial<Warrior>>();
  const rivalWarriorPatches = new Map<WarriorId, Partial<Warrior>>();
  const epithetAwards: WarriorEpithetAward[] = [];
  const queueEpithet = (before: Warrior, after: Warrior) => {
    if (after.epithet && after.epithet !== before.epithet) {
      epithetAwards.push({ warriorId: after.id, epithet: after.epithet });
    }
  };

  // 🔒 Tournament fatigue exemption: Check if warriors are tournament participants
  const skipFatigueA = isTournamentParticipant(s, wA.id);
  const skipFatigueD = isTournamentParticipant(s, wD.id);

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
      const updated = updateWarriorAfterBout(
        side.w,
        side.fame,
        side.pop,
        side.won,
        isKill,
        tags,
        side.skip,
        arenaId
      );
      queueEpithet(side.w, updated);
      rosterUpdates.set(side.w.id, updated);
    } else {
      // Rivals track no popularity from bouts (unchanged from the prior D-side path).
      const updated = updateWarriorAfterBout(
        side.w,
        side.fame,
        0,
        side.won,
        isKill,
        tags,
        side.skip,
        arenaId
      );
      queueEpithet(side.w, updated);
      patchRivalWarrior(rivalWarriorPatches, side.w, updated);
    }
  }

  const impact: StateImpact = { rosterUpdates, rivalWarriorPatches };
  if (epithetAwards.length > 0) impact.warriorEpithets = epithetAwards;
  return impact;
}
