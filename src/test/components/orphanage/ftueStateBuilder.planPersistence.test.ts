import { describe, it, expect } from 'vitest';
import { buildFTUEInitialState } from '@/components/orphanage/ftueStateBuilder';
import { FightingStyle } from '@/types/shared.types';
import type { GameState } from '@/types/state.types';
import type { FightPlan } from '@/types/shared.types';
import {
  FTUE_KO_RESULT as koResult,
  FTUE_MINIMAL_BASE_STATE as minimalBaseState,
  FTUE_THREE_WARRIORS as threeWarriors,
  FTUE_SEED as SEED,
} from '@/test/_fixtures/ftue';

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
