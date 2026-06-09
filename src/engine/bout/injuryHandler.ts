import type { GameState, RivalStableData, RestState } from '@/types/state.types';
import type { WarriorId, StableId } from '@/types/shared.types';
import type { Warrior } from '@/types/warrior.types';
import type { FightOutcome } from '@/types/combat.types';
import { generateInjury } from '@/engine/injuries';
import { addRestState } from '@/engine/matchmaking/historyLogic';
import { updateEntityInList } from '@/utils/stateUtils';
import { StateImpact } from '@/engine/impacts'; /**
 * Handle injuries.
 * @param s - S.
 * @param wA - W a.
 * @param wD - W d.
 * @param outcome - Outcome.
 * @param week - Week.
 * @param rivalStableId - Rival stable id. (optional)
 * @param seed - Seed. (optional)
 * @returns The result.
 */

/**
 * Handle injuries.
 * @param s - S.
 * @param wA - W a.
 * @param wD - W d.
 * @param outcome - Outcome.
 * @param week - Week.
 * @param rivalStableId - Rival stable id. (optional)
 * @param seed - Seed. (optional)
 * @returns The result.
 */
export function handleInjuries(
  s: GameState,
  wA: Warrior,
  wD: Warrior,
  outcome: FightOutcome,
  week: number,
  rivalStableId?: string,
  seed?: number
) {
  let injured = false;
  const names: string[] = [];
  const rosterUpdates = new Map<WarriorId, Partial<Warrior>>();
  const rivalsUpdates = new Map<StableId, Partial<RivalStableData>>();
  const restStates: RestState[] = [];

  if (outcome.by === 'KO') {
    const victimId = outcome.winner === 'A' ? wD.id : wA.id;
    restStates.push(...addRestState([], victimId, 'KO', week));
  }

  // 1. Process Warrior A
  const injA = generateInjury(wA, outcome, 'A', seed);
  if (injA) {
    injured = true;
    names.push(wA.name);
    const isPlayer = s.roster.some((w) => w.id === wA.id);
    if (isPlayer) {
      const existing = rosterUpdates.get(wA.id) || wA;
      rosterUpdates.set(wA.id, { ...existing, injuries: [...(existing.injuries || []), injA] });
    } else if (rivalStableId) {
      // rivalStableId is set from `rival.id` (StableId) by pairings/world bouts,
      // not owner.id. Looking up by owner.id silently dropped every rival
      // injury — they remained completely unmaimed across the whole sim.
      const rival = s.rivalMap?.get(rivalStableId as StableId);
      if (rival) {
        const updatedRoster = updateEntityInList(rival.roster, wA.id, (w) => ({
          ...w,
          injuries: [...(w.injuries || []), injA],
        }));
        rivalsUpdates.set(rivalStableId as StableId, { roster: updatedRoster });
      }
    }
  }

  // 2. Process Warrior D
  const injD = generateInjury(wD, outcome, 'D', seed ? seed + 1 : undefined);
  if (injD) {
    injured = true;
    names.push(wD.name);
    const isPlayer = s.roster.some((w) => w.id === wD.id);
    if (isPlayer) {
      const existing = rosterUpdates.get(wD.id) || wD;
      rosterUpdates.set(wD.id, { ...existing, injuries: [...(existing.injuries || []), injD] });
    } else if (rivalStableId) {
      // rivalStableId is set from `rival.id` (StableId) by pairings/world bouts,
      // not owner.id. Looking up by owner.id silently dropped every rival
      // injury — they remained completely unmaimed across the whole sim.
      const rival = s.rivalMap?.get(rivalStableId as StableId);
      if (rival) {
        const updatedRoster = updateEntityInList(rival.roster, wD.id, (w) => ({
          ...w,
          injuries: [...(w.injuries || []), injD],
        }));
        rivalsUpdates.set(rivalStableId as StableId, { roster: updatedRoster });
      }
    }
  }

  const impact: StateImpact = {
    rosterUpdates,
    rivalsUpdates,
    restStates,
  };

  return { impact, injured, injuredNames: names };
}
