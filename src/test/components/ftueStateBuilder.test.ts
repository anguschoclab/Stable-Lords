import { describe, it, expect } from 'vitest';
import { buildFTUEInitialState } from '@/components/orphanage/ftueStateBuilder';
import type { GameState } from '@/types/state.types';
import {
  makeFtueResult,
  FTUE_KO_RESULT as koResult,
  FTUE_MINIMAL_BASE_STATE as minimalBaseState,
  FTUE_TWO_WARRIORS as twoWarriors,
  FTUE_THREE_WARRIORS as threeWarriors,
  FTUE_SEED as SEED,
} from '@/test/_fixtures/ftue';

const ZERO_CAREER = { wins: 0, losses: 0, kills: 0 };

const killResult = makeFtueResult(
  { winner: 'A', by: 'Kill', minutes: 5, log: [] },
  'test-kill-summary'
);

const flashyResult = makeFtueResult(
  { winner: 'A', by: 'KO', minutes: 3, log: [], post: { tags: ['Flashy'] } },
  'test-flashy-summary'
);

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
