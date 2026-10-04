import { GameState, Warrior, RivalStableData } from '@/types/state.types';
import { makeWarrior } from '@/engine/factories/warriorFactory';
import { FightingStyle } from '@/types/shared.types';
import type { WarriorId } from '@/types/shared.types';
import { makeComputedWarrior } from '@/test/_fixtures/factories';

/**
 * Populates a GameState with a realistic number of warriors for testing.
 */
export function populateTestState(state: GameState): GameState {
  const newState = { ...state };
  const styles = Object.values(FightingStyle);

  // 1. Add to player roster (10 warriors)
  for (let i = 0; i < 10; i++) {
    newState.roster.push(
      makeWarrior(
        { id: `p_w_${i}` as any, name: `Player Warrior ${i}`, style: styles[i % styles.length] || FightingStyle.StrikingAttack, attrs: { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 }, overrides: { fame: 50 + i * 10 } }
      )
    );
  }

  // 2. Add Rivals (10 rivals, 20 warriors each)
  for (let r = 0; r < 10; r++) {
    const rivalWorkers: Warrior[] = [];
    for (let w = 0; w < 20; w++) {
      rivalWorkers.push(
        makeWarrior(
          { id: `r_${r}_w_${w}` as any, name: `Rival ${r} Warrior ${w}`, style: styles[(r + w) % styles.length] || FightingStyle.StrikingAttack, attrs: { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 }, overrides: { fame: 50 + r * 10 + w * 5 } }
        )
      );
    }

    newState.rivals.push({
      id: `rival_stable_${r}`,
      owner: {
        id: `rival_owner_${r}`,
        name: `Rival Owner ${r}`,
        stableName: `Rival Stable ${r}`,
        fame: 100,
        renown: 50,
        titles: 0,
        personality: 'Pragmatic',
      },
      fame: 100,
      roster: rivalWorkers,
      treasury: 1000,
      tier: 'Established',
    } as RivalStableData);
  }

  // 3. Add Promoters
  newState.promoters = {
    p_local: {
      id: 'p_local' as any,
      name: 'Local Joe',
      age: 45,
      personality: 'Flashy',
      tier: 'Local',
      capacity: 5,
      biases: [FightingStyle.BashingAttack],
      history: { totalPursePaid: 0, notableBouts: [], legacyFame: 0 },
    },
    p_legendary: {
      id: 'p_legendary' as any,
      name: 'Don Kingpin',
      age: 65,
      personality: 'Greedy',
      tier: 'Legendary',
      capacity: 2,
      biases: [FightingStyle.StrikingAttack],
      history: { totalPursePaid: 0, notableBouts: [], legacyFame: 100 },
    },
  } as any;

  return newState;
}

/**
 *
 */
export function makeAutosimWarrior(
  id: string,
  name: string,
  overrides?: Partial<Warrior>
): Warrior {
  return makeComputedWarrior(
    { ST: 12, CN: 12, SZ: 12, WT: 12, WL: 12, SP: 12, DF: 12 },
    FightingStyle.StrikingAttack,
    { id: id as WarriorId, name, fame: 0, age: 20, ...overrides }
  );
}
