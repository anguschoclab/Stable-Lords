import type { GameState, RestState } from '@/types/state.types';
import type { WarriorId } from '@/types/shared.types';
import type { Warrior } from '@/types/warrior.types';
import type { FightOutcome } from '@/types/combat.types';
import { generateInjury } from '@/engine/injuries';
import { addRestState } from '@/engine/matchmaking/historyLogic';
import { patchRivalWarrior } from './warriorRouting';
import { StateImpact } from '@/engine/impacts';

/**
 *
 */
export interface HandleInjuriesArgs {
  s: GameState;
  wA: Warrior;
  wD: Warrior;
  outcome: FightOutcome;
  week: number;
  seed?: number;
}

/**
 * Handle injuries.
 * @param args.s -
 * @param args.wA -
 * @param args.wD -
 * @param args.outcome -
 * @param args.week -
 * @param args.seed -
 */
export function handleInjuries(args: HandleInjuriesArgs) {
  const { s, wA, wD, outcome, week } = args;
  const {seed } = args;
  let injured = false;
  const names: string[] = [];
  const rosterUpdates = new Map<WarriorId, Partial<Warrior>>();
  const rivalWarriorPatches = new Map<WarriorId, Partial<Warrior>>();
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
    if (s.roster.some((w) => w.id === wA.id)) {
      const existing = rosterUpdates.get(wA.id) || wA;
      rosterUpdates.set(wA.id, { ...existing, injuries: [...(existing.injuries || []), injA] });
    } else {
      // Rival-owned (either side of a world bout): per-warrior patch. The old
      // whole-roster rivalsUpdates write was clobbered by later bout impacts.
      patchRivalWarrior(rivalWarriorPatches, wA, {
        injuries: [...(wA.injuries || []), injA],
      });
    }
  }

  // 2. Process Warrior D
  const injD = generateInjury(wD, outcome, 'D', seed ? seed + 1 : undefined);
  if (injD) {
    injured = true;
    names.push(wD.name);
    if (s.roster.some((w) => w.id === wD.id)) {
      const existing = rosterUpdates.get(wD.id) || wD;
      rosterUpdates.set(wD.id, { ...existing, injuries: [...(existing.injuries || []), injD] });
    } else {
      // Rival-owned (either side of a world bout): per-warrior patch. The old
      // whole-roster rivalsUpdates write was clobbered by later bout impacts.
      patchRivalWarrior(rivalWarriorPatches, wD, {
        injuries: [...(wD.injuries || []), injD],
      });
    }
  }

  const impact: StateImpact = {
    rosterUpdates,
    rivalWarriorPatches,
    restStates,
  };

  return { impact, injured, injuredNames: names };
}
