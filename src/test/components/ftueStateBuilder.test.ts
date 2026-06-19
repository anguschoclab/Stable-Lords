import { describe, it, expect } from 'vitest';
import { buildFTUEInitialState } from '@/components/orphanage/ftueStateBuilder';
import { makeWarrior } from '@/engine/factories/warriorFactory';
import { FightingStyle } from '@/types/shared.types';
import type { GameState } from '@/types/state.types';

const ZERO_CAREER = { wins: 0, losses: 0, kills: 0 };

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

const killResult = {
  a: wA,
  d: wD,
  outcome: { winner: 'A' as const, by: 'Kill', minutes: 5, log: [] },
  summary: { id: 'test-kill-summary' as any, week: 1 } as any,
};

const flashyResult = {
  a: wA,
  d: wD,
  outcome: { winner: 'A' as const, by: 'KO', minutes: 3, log: [], post: { tags: ['Flashy'] } },
  summary: { id: 'test-flashy-summary' as any, week: 1 } as any,
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

const twoWarriors = [pw('Varak'), pw('Dren')];
const threeWarriors = [pw('Varak'), pw('Dren'), pw('Calix')];

const SEED = 42;

describe('buildFTUEInitialState — career record', () => {
  it('winner career is 0-0-0 (not 1-0-0)', () => {
    const { aliveWarriors } = buildFTUEInitialState(
      minimalBaseState as GameState,
      twoWarriors,
      koResult,
      SEED
    );
    const winner = aliveWarriors.find((w) => w.name === 'Varak');
    expect(winner).toBeDefined();
    expect(winner!.career).toEqual(ZERO_CAREER);
  });

  it('loser career is 0-0-0 (not 0-1-0)', () => {
    const { aliveWarriors } = buildFTUEInitialState(
      minimalBaseState as GameState,
      twoWarriors,
      koResult,
      SEED
    );
    const loser = aliveWarriors.find((w) => w.name === 'Dren');
    expect(loser).toBeDefined();
    expect(loser!.career).toEqual(ZERO_CAREER);
  });

  it('winner still gets fame=1 and popularity=1', () => {
    const { aliveWarriors } = buildFTUEInitialState(
      minimalBaseState as GameState,
      twoWarriors,
      koResult,
      SEED
    );
    const winner = aliveWarriors.find((w) => w.name === 'Varak');
    expect(winner!.fame).toBe(1);
    expect(winner!.popularity).toBe(1);
  });

  it('loser has fame=0 and popularity=0', () => {
    const { aliveWarriors } = buildFTUEInitialState(
      minimalBaseState as GameState,
      twoWarriors,
      koResult,
      SEED
    );
    const loser = aliveWarriors.find((w) => w.name === 'Dren');
    expect(loser!.fame).toBe(0);
    expect(loser!.popularity).toBe(0);
  });

  it('Kill bout: killer career is still 0-0-0 (not kills:1)', () => {
    const { aliveWarriors } = buildFTUEInitialState(
      minimalBaseState as GameState,
      twoWarriors,
      killResult,
      SEED
    );
    const killer = aliveWarriors.find((w) => w.name === 'Varak');
    expect(killer).toBeDefined();
    expect(killer!.career).toEqual(ZERO_CAREER);
  });

  it('Kill bout: dead warrior goes to graveyard, not aliveWarriors', () => {
    const { aliveWarriors, deadWarriors } = buildFTUEInitialState(
      minimalBaseState as GameState,
      twoWarriors,
      killResult,
      SEED
    );
    expect(deadWarriors).toHaveLength(1);
    expect(deadWarriors[0]!.name).toBe('Dren');
    expect(aliveWarriors.find((w) => w.name === 'Dren')).toBeUndefined();
  });

  it('non-combatant (3rd warrior) has 0-0-0 career', () => {
    const { aliveWarriors } = buildFTUEInitialState(
      minimalBaseState as GameState,
      threeWarriors,
      koResult,
      SEED
    );
    const bystander = aliveWarriors.find((w) => w.name === 'Calix');
    expect(bystander).toBeDefined();
    expect(bystander!.career).toEqual(ZERO_CAREER);
  });

  it('no boutResult: all warriors have 0-0-0 career', () => {
    const { aliveWarriors } = buildFTUEInitialState(
      minimalBaseState as GameState,
      twoWarriors,
      null,
      SEED
    );
    for (const w of aliveWarriors) {
      expect(w.career).toEqual(ZERO_CAREER);
    }
  });

  it('arenaHistory still recorded when boutResult provided', () => {
    const { arenaHistory } = buildFTUEInitialState(
      minimalBaseState as GameState,
      twoWarriors,
      koResult,
      SEED
    );
    expect(arenaHistory).toHaveLength(1);
  });

  it('arenaHistory is empty when no boutResult', () => {
    const { arenaHistory } = buildFTUEInitialState(
      minimalBaseState as GameState,
      twoWarriors,
      null,
      SEED
    );
    expect(arenaHistory).toHaveLength(0);
  });

  it('winner gets Flashy flair when post.tags includes Flashy', () => {
    const { aliveWarriors } = buildFTUEInitialState(
      minimalBaseState as GameState,
      twoWarriors,
      flashyResult,
      SEED
    );
    const winner = aliveWarriors.find((w) => w.name === 'Varak');
    expect(winner!.flair).toContain('Flashy');
  });

  it('loser does NOT get Flashy flair even when post.tags includes Flashy', () => {
    const { aliveWarriors } = buildFTUEInitialState(
      minimalBaseState as GameState,
      twoWarriors,
      flashyResult,
      SEED
    );
    const loser = aliveWarriors.find((w) => w.name === 'Dren');
    expect(loser!.flair).not.toContain('Flashy');
  });
});
