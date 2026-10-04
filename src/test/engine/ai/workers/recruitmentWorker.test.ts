import { describe, it, expect } from 'vitest';
import { processRecruitment } from '@/engine/ai/workers/recruitmentWorker';
import { SeededRNGService } from '@/utils/random';
import type { RivalStableData } from '@/types/state.types';
import type { PoolWarrior } from '@/engine/recruitment/recruitment';
import { makeTestRecruit, makeRival, makeOwner } from '@/test/_fixtures/factories';

function makeMinimalRival(overrides: Partial<RivalStableData> = {}): RivalStableData {
  return makeRival({
    id: 'rival_test' as any,
    owner: makeOwner({
      id: 'owner_test' as any,
      name: 'Test Owner',
      stableName: 'Test Stable',
      fame: 50,
      renown: 10,
    }),
    fame: 50,
    tier: 'Established',
    ...overrides,
  });
}

function makePoolWarrior(overrides: Partial<PoolWarrior> = {}): PoolWarrior {
  return makeTestRecruit(overrides);
}

describe('processRecruitment — warrior field propagation (Bug 1)', () => {
  it('drafted warrior inherits traits from the pool recruit', () => {
    const rival = makeMinimalRival();
    const recruit = makePoolWarrior({ traits: ['IronWill', 'Relentless'] });
    const rng = new SeededRNGService(42);

    const { updatedRival } = processRecruitment({ rival: rival, pool: [recruit], week: 2, rng: rng, isMajorDraftWeek: true });

    expect(updatedRival.roster.length).toBe(1);
    expect(updatedRival.roster[0]?.traits).toEqual(['IronWill', 'Relentless']);
  });

  it('drafted warrior does not have empty traits when recruit had traits', () => {
    const rival = makeMinimalRival();
    const recruit = makePoolWarrior({ traits: ['Brawler'] });
    const rng = new SeededRNGService(42);

    const { updatedRival } = processRecruitment({ rival: rival, pool: [recruit], week: 2, rng: rng, isMajorDraftWeek: true });

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

    const { updatedRival } = processRecruitment({ rival: rival, pool: [recruit], week: 2, rng: rng, isMajorDraftWeek: true });

    expect(updatedRival.roster[0]?.favorites).toEqual(favorites);
  });

  it('drafted warrior has favorites defined (not undefined)', () => {
    const rival = makeMinimalRival();
    const recruit = makePoolWarrior();
    const rng = new SeededRNGService(42);

    const { updatedRival } = processRecruitment({ rival: rival, pool: [recruit], week: 2, rng: rng, isMajorDraftWeek: true });

    expect(updatedRival.roster[0]?.favorites).toBeDefined();
  });
});

describe('processRecruitment — veteran free agency', () => {
  const veteranSnapshot = {
    fame: 120,
    popularity: 60,
    career: { wins: 9, losses: 3, kills: 1 },
    titles: ['arena_champion'],
  };

  it('preserves identity, fame, and career when signing a veteran', () => {
    const rival = makeMinimalRival();
    const recruit = makePoolWarrior({ id: 'w-vet', veteran: veteranSnapshot });
    const rng = new SeededRNGService(42);

    const { updatedRival } = processRecruitment({ rival: rival, pool: [recruit], week: 2, rng: rng, isMajorDraftWeek: true });
    const signed = updatedRival.roster[0];

    expect(signed?.id).toBe('w-vet');
    expect(signed?.fame).toBe(120);
    expect(signed?.popularity).toBe(60);
    expect(signed?.career).toEqual({ wins: 9, losses: 3, kills: 1 });
    expect(signed?.titles).toEqual(['arena_champion']);
    expect(signed?.stableId).toBe(updatedRival.id);
    expect(signed?.status).toBe('Active');
  });

  it('re-mints identity for ordinary pool recruits (control)', () => {
    const rival = makeMinimalRival();
    const recruit = makePoolWarrior({ id: 'pw-ordinary' });
    const rng = new SeededRNGService(42);

    const { updatedRival } = processRecruitment({ rival: rival, pool: [recruit], week: 2, rng: rng, isMajorDraftWeek: true });
    const signed = updatedRival.roster[0];

    expect(signed?.id).not.toBe('pw-ordinary');
    expect(signed?.fame).toBe(10);
    expect(signed?.career).toEqual({ wins: 0, losses: 0, kills: 0 });
  });
});
