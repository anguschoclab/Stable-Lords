import { describe, it, expect } from 'vitest';
import { isLegacyFounderCaliber, collectCrownedWarriorIds } from '@/engine/ai/legacyFounder';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import { makeWarrior } from '@/engine/factories/warriorFactory';
import { FightingStyle } from '@/types/shared.types';
import { ATTRS_10 } from '@/test/_fixtures/factories';
import type { WarriorId } from '@/types/shared.types';
import {
  LEGACY_FOUNDER_FAME_MIN,
  LEGACY_FOUNDER_WINS_MIN,
  LEGACY_FOUNDER_KILLS_MIN,
} from '@/constants/world';
import type { ArenaTitle } from '@/types/state.types';

const journeyman = () =>
  makeWarrior(undefined, 'Journeyman', FightingStyle.StrikingAttack, ATTRS_10, {
    career: { wins: 8, losses: 12, kills: 0 },
    fame: 10,
  });

const titleWithReigns = (championId: string | null, historyIds: string[]): ArenaTitle =>
  ({
    champion: championId
      ? {
          warriorId: championId as WarriorId,
          reignStartWeek: 10,
          defenses: 0,
          lastActivityWeek: 10,
        }
      : null,
    history: historyIds.map((id) => ({
      warriorId: id as WarriorId,
      reignStartWeek: 1,
      reignEndWeek: 9,
      defenses: 0,
      endedBy: 'defeated',
    })),
  }) as unknown as ArenaTitle;

describe('isLegacyFounderCaliber', () => {
  it('rejects an unremarkable journeyman', () => {
    expect(isLegacyFounderCaliber(journeyman(), new Set())).toBe(false);
  });

  it('admits any past or present crown-holder regardless of stats', () => {
    const w = journeyman();
    expect(isLegacyFounderCaliber(w, new Set([w.id]))).toBe(true);
  });

  it('admits elite careers at the recalibrated ceilings', () => {
    const wins = journeyman();
    wins.career = { wins: LEGACY_FOUNDER_WINS_MIN, losses: 40, kills: 0 };
    wins.fame = 0;
    expect(isLegacyFounderCaliber(wins, new Set())).toBe(true);

    const killer = journeyman();
    killer.career = { wins: 10, losses: 10, kills: LEGACY_FOUNDER_KILLS_MIN };
    expect(isLegacyFounderCaliber(killer, new Set())).toBe(true);

    const famous = journeyman();
    famous.fame = LEGACY_FOUNDER_FAME_MIN;
    expect(isLegacyFounderCaliber(famous, new Set())).toBe(true);
  });

  it('rejects careers just below each ceiling', () => {
    const w = journeyman();
    w.career = {
      wins: LEGACY_FOUNDER_WINS_MIN - 1,
      losses: 30,
      kills: LEGACY_FOUNDER_KILLS_MIN - 1,
    };
    w.fame = LEGACY_FOUNDER_FAME_MIN - 1;
    expect(isLegacyFounderCaliber(w, new Set())).toBe(false);
  });

  it('admits headline annual award winners', () => {
    const w = journeyman();
    w.awards = [
      {
        year: 1,
        type: 'WARRIOR_OF_YEAR',
        warriorId: w.id,
        warriorName: w.name,
        value: 20,
        reason: 'x',
      },
    ];
    expect(isLegacyFounderCaliber(w, new Set())).toBe(true);
  });
});

describe('collectCrownedWarriorIds', () => {
  it('collects current champions and historical reigns', () => {
    const state = createFreshState('test-seed');
    state.arenaChampions = {
      arena_a: titleWithReigns('w-current', ['w-old1', 'w-old2']),
      arena_b: titleWithReigns(null, ['w-old3']),
    };
    const ids = collectCrownedWarriorIds(state);
    expect(ids).toEqual(new Set(['w-current', 'w-old1', 'w-old2', 'w-old3']));
  });

  it('returns an empty set with no titles', () => {
    const state = createFreshState('test-seed');
    state.arenaChampions = {};
    expect(collectCrownedWarriorIds(state).size).toBe(0);
  });
});
