import { describe, it, expect } from 'vitest';
import { buildFTUEInitialState } from '@/components/orphanage/ftueStateBuilder';
import { makeWarrior } from '@/engine/factories/warriorFactory';
import { FightingStyle } from '@/types/shared.types';
import type { GameState } from '@/types/state.types';
import type { FightPlan } from '@/types/shared.types';

const baseAttrs = { ST: 12, CN: 10, SZ: 10, WT: 12, WL: 12, SP: 12, DF: 10 };

const pw = (name: string) => ({
  name,
  style: FightingStyle.LungingAttack,
  attrs: baseAttrs,
  age: 20,
  trait: 'iron_will',
  lore: '',
  origin: '',
  potential: undefined,
});

const wA = makeWarrior('w-a' as any, 'Varak', FightingStyle.LungingAttack, baseAttrs);
const wD = makeWarrior('w-d' as any, 'Dren', FightingStyle.TotalParry, baseAttrs);

const koResult = {
  a: wA,
  d: wD,
  outcome: { winner: 'A' as const, by: 'KO', minutes: 3, log: [] },
  summary: { id: 'test-summary' as any, week: 1 } as any,
};

const minimalBaseState: Partial<GameState> = {
  week: 1,
  year: 1,
  season: 'Year 1',
  player: { id: 'player-1' as any, name: 'Owner', stableName: 'Stable', fame: 0, gold: 500 } as any,
  graveyard: [],
  retired: [],
  newsletter: [],
  gazettes: [],
  hallOfFame: [],
  arenaHistory: [],
  realmRankings: {},
  boutOffers: {},
  rivals: [],
  promoters: {},
  roster: [],
  isFTUE: true,
  ftueComplete: false,
} as any;

const SEED = 42;
const threeWarriors = [pw('Varak'), pw('Dren'), pw('Calix')];

const customPlan: FightPlan = {
  style: FightingStyle.LungingAttack,
  OE: 3,
  AL: 8,
  killDesire: 2,
  offensiveTactic: 'Slash',
  defensiveTactic: 'Riposte',
};

describe('buildFTUEInitialState — playerPlan persistence', () => {
  it('warrior[0] OE matches the passed-in playerPlan', () => {
    const { aliveWarriors } = buildFTUEInitialState(
      minimalBaseState as GameState,
      threeWarriors,
      koResult,
      SEED,
      customPlan
    );
    const first = aliveWarriors.find((w) => w.name === 'Varak');
    expect(first?.plan?.OE).toBe(3);
  });

  it('warrior[0] AL matches the passed-in playerPlan', () => {
    const { aliveWarriors } = buildFTUEInitialState(
      minimalBaseState as GameState,
      threeWarriors,
      koResult,
      SEED,
      customPlan
    );
    const first = aliveWarriors.find((w) => w.name === 'Varak');
    expect(first?.plan?.AL).toBe(8);
  });

  it('warrior[0] killDesire matches the passed-in playerPlan', () => {
    const { aliveWarriors } = buildFTUEInitialState(
      minimalBaseState as GameState,
      threeWarriors,
      koResult,
      SEED,
      customPlan
    );
    const first = aliveWarriors.find((w) => w.name === 'Varak');
    expect(first?.plan?.killDesire).toBe(2);
  });

  it('warrior[0] offensiveTactic matches the passed-in playerPlan', () => {
    const { aliveWarriors } = buildFTUEInitialState(
      minimalBaseState as GameState,
      threeWarriors,
      koResult,
      SEED,
      customPlan
    );
    const first = aliveWarriors.find((w) => w.name === 'Varak');
    expect(first?.plan?.offensiveTactic).toBe('Slash');
  });

  it('warrior[1] uses its own default plan, not playerPlan', () => {
    const { aliveWarriors } = buildFTUEInitialState(
      minimalBaseState as GameState,
      threeWarriors,
      koResult,
      SEED,
      customPlan
    );
    const second = aliveWarriors.find((w) => w.name === 'Dren');
    expect(second?.plan?.OE).not.toBe(3);
  });

  it('when playerPlan is null, warrior[0] falls back to defaultPlanForWarrior', () => {
    const { aliveWarriors: withNull } = buildFTUEInitialState(
      minimalBaseState as GameState,
      threeWarriors,
      koResult,
      SEED,
      null
    );
    const { aliveWarriors: withUndefined } = buildFTUEInitialState(
      minimalBaseState as GameState,
      threeWarriors,
      koResult,
      SEED,
      undefined
    );
    const fromNull = withNull.find((w) => w.name === 'Varak');
    const fromUndefined = withUndefined.find((w) => w.name === 'Varak');
    expect(fromNull?.plan?.OE).toBeDefined();
    expect(fromUndefined?.plan?.OE).toBeDefined();
    expect(fromNull?.plan?.OE).toBe(fromUndefined?.plan?.OE);
  });
});
