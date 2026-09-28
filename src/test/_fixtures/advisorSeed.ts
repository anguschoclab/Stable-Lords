import { createFreshState } from '@/engine/factories/gameStateFactory';
import { makeWarrior } from '@/engine/factories/warriorFactory';
import { FightingStyle } from '@/types/shared.types';
import type { GameState } from '@/types/state.types';
import { useGameStore } from '@/state/useGameStore';

export const ADVISOR_BASE_ATTRS = { ST: 14, CN: 14, SZ: 11, WT: 12, WL: 11, SP: 14, DF: 11 };

/**
 * Week-5 seeded scenario shared by advisor/widget tests: one player warrior
 * (Aulus, AimedBlow) + one rival (Brutus, WallOfSteel).
 */
export function seedAdvisorScenario(over: Partial<GameState> = {}) {
  const fresh = createFreshState('test-seed');
  const w1 = makeWarrior('w1' as any, 'Aulus', FightingStyle.AimedBlow, ADVISOR_BASE_ATTRS);
  const rival = makeWarrior('r1' as any, 'Brutus', FightingStyle.WallOfSteel, ADVISOR_BASE_ATTRS);
  fresh.roster = [w1];
  fresh.rivals = [{ id: 'rs', roster: [rival], owner: { stableName: 'Rivals' } } as any];
  fresh.week = 5;
  fresh.absoluteWeek = 5;
  fresh.year = 1;
  fresh.season = 'Spring';
  fresh.weather = 'Clear';
  fresh.realmRankings = {};
  fresh.boutOffers = {};
  fresh.trainingAssignments = [];
  fresh.treasury = 500;
  Object.assign(fresh, over);
  useGameStore.getState().loadGame('test-slot', fresh as GameState);
  return { w1, rival };
}
