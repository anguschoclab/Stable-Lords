import { describe, it, expect } from 'vitest';
import { processRecruitment } from '@/engine/ai/workers/recruitmentWorker';
import { SeededRNGService } from '@/engine/core/rng/SeededRNGService';
import { FightingStyle } from '@/types/shared.types';
import type { RivalStableData } from '@/types/state.types';
import type { PoolWarrior } from '@/engine/recruitment';

function makeMinimalRival(overrides: Partial<RivalStableData> = {}): RivalStableData {
  return {
    id: 'rival_test',
    owner: {
      id: 'owner_test',
      name: 'Test Owner',
      stableName: 'Test Stable',
      fame: 50,
      renown: 10,
      titles: 0,
      personality: 'Pragmatic',
    },
    fame: 50,
    roster: [],
    treasury: 1000,
    tier: 'Established',
    actionHistory: [],
    ...overrides,
  } as any as RivalStableData;
}

function makePoolWarrior(overrides: Partial<PoolWarrior> = {}): PoolWarrior {
  return {
    id: 'recruit_test',
    name: 'Test Recruit',
    style: FightingStyle.StrikingAttack,
    attributes: { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
    potential: { ST: 15, CN: 15, SZ: 15, WT: 15, WL: 15, SP: 15, DF: 15 },
    baseSkills: { ATT: 5, PAR: 5, DEF: 5, INI: 5, RIP: 5, DEC: 5 },
    derivedStats: { hp: 100, endurance: 100, damage: 5, encumbrance: 12 },
    tier: 'Promising',
    cost: 100,
    age: 18,
    lore: 'A test recruit.',
    traits: ['IronWill'],
    addedWeek: 1,
    favorites: {
      weaponId: 'longsword',
      rhythm: { oe: 7, al: 5 },
      discovered: { weapon: true, rhythm: false, weaponHints: 1, rhythmHints: 0 },
    },
    lineage: { generation: 1, pedigree: 'Commoner' },
    ...overrides,
  };
}

describe('processRecruitment — warrior field propagation (Bug 1)', () => {
  it('drafted warrior inherits traits from the pool recruit', () => {
    const rival = makeMinimalRival();
    const recruit = makePoolWarrior({ traits: ['IronWill', 'Relentless'] });
    const rng = new SeededRNGService(42);

    const { updatedRival } = processRecruitment(rival, [recruit], 2, rng, true);

    expect(updatedRival.roster.length).toBe(1);
    expect(updatedRival.roster[0]?.traits).toEqual(['IronWill', 'Relentless']);
  });

  it('drafted warrior does not have empty traits when recruit had traits', () => {
    const rival = makeMinimalRival();
    const recruit = makePoolWarrior({ traits: ['Brawler'] });
    const rng = new SeededRNGService(42);

    const { updatedRival } = processRecruitment(rival, [recruit], 2, rng, true);

    expect(updatedRival.roster[0]?.traits).not.toEqual([]);
  });

  it('drafted warrior inherits favorites from the pool recruit', () => {
    const rival = makeMinimalRival();
    const favorites = {
      weaponId: 'broadsword',
      rhythm: { oe: 6, al: 4 },
      discovered: { weapon: true, rhythm: true, weaponHints: 2, rhythmHints: 1 },
    };
    const recruit = makePoolWarrior({ favorites });
    const rng = new SeededRNGService(42);

    const { updatedRival } = processRecruitment(rival, [recruit], 2, rng, true);

    expect(updatedRival.roster[0]?.favorites).toEqual(favorites);
  });

  it('drafted warrior has favorites defined (not undefined)', () => {
    const rival = makeMinimalRival();
    const recruit = makePoolWarrior();
    const rng = new SeededRNGService(42);

    const { updatedRival } = processRecruitment(rival, [recruit], 2, rng, true);

    expect(updatedRival.roster[0]?.favorites).toBeDefined();
  });
});
