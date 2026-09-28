import { makeWarrior } from '@/engine/factories/warriorFactory';
import { FightingStyle } from '@/types/shared.types';
import type { GameState } from '@/types/state.types';
import { makeGameState } from '@/test/_fixtures/factories';

export const FTUE_BASE_ATTRS = { ST: 12, CN: 10, SZ: 10, WT: 12, WL: 12, SP: 12, DF: 10 };

export const makePlanWarrior = (name: string) => ({
  name,
  style: FightingStyle.LungingAttack,
  attrs: FTUE_BASE_ATTRS,
  age: 20,
  trait: 'iron_will',
  lore: '',
  origin: '',
  potential: undefined,
});

export const FTUE_W_A = makeWarrior('w-a' as any, 'Varak', FightingStyle.LungingAttack, FTUE_BASE_ATTRS);
export const FTUE_W_D = makeWarrior('w-d' as any, 'Dren', FightingStyle.TotalParry, FTUE_BASE_ATTRS);

export const makeFtueResult = (
  outcome: {
    winner: 'A' | 'D';
    by: string;
    minutes: number;
    log?: unknown[];
    post?: { tags?: string[] };
  },
  summaryId: string
) => ({
  a: FTUE_W_A,
  d: FTUE_W_D,
  outcome,
  summary: { id: summaryId as any, week: 1 } as any,
});

export const FTUE_KO_RESULT = makeFtueResult(
  { winner: 'A', by: 'KO', minutes: 3, log: [] },
  'test-summary'
);

export const FTUE_MINIMAL_BASE_STATE: Partial<GameState> = makeGameState({
  season: 'Year 1',
  player: { id: 'player-1' as any, name: 'Owner', stableName: 'Stable', fame: 0, gold: 500 } as any,
  rivals: [],
});

export const FTUE_TWO_WARRIORS = [makePlanWarrior('Varak'), makePlanWarrior('Dren')];
export const FTUE_THREE_WARRIORS = [makePlanWarrior('Varak'), makePlanWarrior('Dren'), makePlanWarrior('Calix')];

export const FTUE_SEED = 42;
