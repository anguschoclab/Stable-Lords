/**
 * Stage F — retirement timing.
 * Retirement is career-aware, not pure age probability:
 *  - permanent injuries shorten careers (broken bodies exit early)
 *  - reigning champions defer retirement while defending the crown
 *    (voluntary exits flow through the relinquish path in crownWorker)
 *  - old champions still retire eventually — deferral, not immunity
 */
// @vitest-environment node
import { describe, it, expect } from 'vitest';
import {
  SeasonalRetirementService,
  retireChanceFor,
} from '@/engine/ai/seasonalRetirementService';
import {
  makeWarrior,
  makeRival,
  makeGameState,
  resetFixtureIds,
} from '@/test/_fixtures/factories';
import type { Warrior } from '@/types/warrior.types';
import type { WarriorId, InjuryId } from '@/types/shared.types';
import type { InjuryData } from '@/types/warrior.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';

const alwaysRetire: IRNGService = { next: () => 0.001 } as unknown as IRNGService;

function permanentInjury(name = 'Shattered Knee'): InjuryData {
  return {
    id: `inj-${name}` as InjuryId,
    name,
    description: 'Chronic damage',
    severity: 'Permanent',
    weeksRemaining: 999,
    penalties: {},
    permanent: true,
  };
}

function champWarrior(id: string, over: Partial<Warrior> = {}): Warrior {
  return makeWarrior({ id: id as WarriorId, age: 33, ...over });
}

describe('retireChanceFor', () => {
  it('is zero for a young healthy warrior', () => {
    expect(retireChanceFor(makeWarrior({ age: 24 }), false)).toBe(0);
  });

  it('counts permanent injuries as accelerated aging pressure', () => {
    const broken = makeWarrior({
      age: 30,
      injuries: [permanentInjury('a'), permanentInjury('b')],
    });
    // effective age 40 → guaranteed retirement
    expect(retireChanceFor(broken, false)).toBe(1);
  });

  it('a reigning champion defers retirement while the crown stands', () => {
    const w = champWarrior('champ1');
    expect(retireChanceFor(w, false)).toBeGreaterThan(0);
    expect(retireChanceFor(w, true)).toBe(0);
  });

  it('old champions still retire — deferral fades with age', () => {
    const w = champWarrior('champ2', { age: 40 });
    expect(retireChanceFor(w, true)).toBeGreaterThan(0);
  });
});

describe('processSeasonalRetirement timing', () => {
  it('retires a youngish warrior whose body is broken, while a reigning champion holds on', () => {
    const broken = makeWarrior({
      id: 'broken' as WarriorId,
      age: 33,
      injuries: [permanentInjury('x'), permanentInjury('y')],
    });
    const reigning = champWarrior('reigning', { age: 33 });
    const rival = makeRival({ roster: [broken, reigning] });
    const state = makeGameState({
      week: 13,
      rivals: [rival],
      arenaChampions: {
        standard_arena: {
          champion: {
            warriorId: 'reigning' as WarriorId,
            startedAbsoluteWeek: 1,
            defenses: 1,
            lastActivityWeek: 1,
          },
          status: 'active',
          history: [],
          refusals: 0,
          deferrals: 0,
          noContenderStreak: 0,
          declinedContenders: {},
        },
      },
    });

    const { updatedState } = SeasonalRetirementService.processSeasonalRetirement(
      state,
      alwaysRetire
    );
    const roster = updatedState.rivals[0]!.roster;
    expect(roster.find((w) => w.id === 'broken')?.status).toBe('Retired');
    expect(roster.find((w) => w.id === 'reigning')?.status).toBe('Active');
  });
});

beforeEach(() => resetFixtureIds());
