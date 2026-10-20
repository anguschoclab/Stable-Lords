import { describe, it, expect } from 'vitest';
import { processRecruitment } from '@/engine/ai/workers/recruitmentWorker';
import { SeededRNG } from '@/utils/random';
import { makeTestRecruit, makeMinimalRival, makeWarrior } from '@/test/_fixtures/factories';
import { aiRosterMax } from '@/constants/ai';
import { AI_GENERATED_RECRUIT_COST } from '@/constants/world';

const makePoolWarrior = makeTestRecruit;

describe('processRecruitment — warrior field propagation (Bug 1)', () => {
  it('drafted warrior inherits traits from the pool recruit', () => {
    const rival = makeMinimalRival();
    const recruit = makePoolWarrior({ traits: ['IronWill', 'Relentless'] });
    const rng = new SeededRNG(42);

    const { updatedRival } = processRecruitment({
      rival: rival,
      pool: [recruit],
      week: 2,
      rng: rng,
      isMajorDraftWeek: true,
    });

    expect(updatedRival.roster.length).toBe(1);
    expect(updatedRival.roster[0]?.traits).toEqual(['IronWill', 'Relentless']);
  });

  it('drafted warrior does not have empty traits when recruit had traits', () => {
    const rival = makeMinimalRival();
    const recruit = makePoolWarrior({ traits: ['Brawler'] });
    const rng = new SeededRNG(42);

    const { updatedRival } = processRecruitment({
      rival: rival,
      pool: [recruit],
      week: 2,
      rng: rng,
      isMajorDraftWeek: true,
    });

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
    const rng = new SeededRNG(42);

    const { updatedRival } = processRecruitment({
      rival: rival,
      pool: [recruit],
      week: 2,
      rng: rng,
      isMajorDraftWeek: true,
    });

    expect(updatedRival.roster[0]?.favorites).toEqual(favorites);
  });

  it('drafted warrior has favorites defined (not undefined)', () => {
    const rival = makeMinimalRival();
    const recruit = makePoolWarrior();
    const rng = new SeededRNG(42);

    const { updatedRival } = processRecruitment({
      rival: rival,
      pool: [recruit],
      week: 2,
      rng: rng,
      isMajorDraftWeek: true,
    });

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
    const rng = new SeededRNG(42);

    const { updatedRival } = processRecruitment({
      rival: rival,
      pool: [recruit],
      week: 2,
      rng: rng,
      isMajorDraftWeek: true,
    });
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
    const rng = new SeededRNG(42);

    const { updatedRival } = processRecruitment({
      rival: rival,
      pool: [recruit],
      week: 2,
      rng: rng,
      isMajorDraftWeek: true,
    });
    const signed = updatedRival.roster[0];

    expect(signed?.id).not.toBe('pw-ordinary');
    expect(signed?.fame).toBe(10);
    expect(signed?.career).toEqual({ wins: 0, losses: 0, kills: 0 });
  });
});

describe('processRecruitment — cap and funnel invariants', () => {
  it('a roster already at aiRosterMax produces no signing even with candidates and budget', () => {
    const personality = 'Pragmatic';
    const maxRoster = aiRosterMax(personality);
    const rival = makeMinimalRival({
      owner: { ...makeMinimalRival().owner, personality },
      treasury: 10000,
      roster: Array.from({ length: maxRoster }, (_, i) => makeWarrior({ id: `wr-${i}` as never })),
      needsRecruit: true,
    });
    const recruit = makePoolWarrior({ id: 'pw-cap' });
    const rng = new SeededRNG(42);

    const { updatedRival, updatedPool } = processRecruitment({
      rival,
      pool: [recruit],
      week: 2,
      rng,
      isMajorDraftWeek: true,
    });

    expect(updatedRival.roster).toHaveLength(maxRoster);
    expect(updatedRival.roster.every((w) => w.id !== 'pw-cap')).toBe(true);
    expect(updatedPool.map((w) => w.id)).toEqual(['pw-cap']);
  });

  it('generated-fallback signing leaves the undrafted pool untouched (not emptied)', () => {
    // An astronomically-priced recruit fails the budget gate so signings === 0,
    // which triggers the generated-recruit fallback — the undrafted recruit
    // must stay on the shelf.
    const rival = makeMinimalRival({ treasury: 5000, needsRecruit: true, roster: [] });
    const unaffordable = makePoolWarrior({ id: 'pw-pricey', cost: 999_999 });
    const rng = new SeededRNG(42);

    const { updatedRival, updatedPool } = processRecruitment({
      rival,
      pool: [unaffordable],
      week: 2,
      rng,
      isMajorDraftWeek: false,
    });

    // The fallback always signs here — generateAIRecruit cannot return null
    // and 60g clears the reserve-adjusted budget.
    expect(updatedRival.roster).toHaveLength(1);
    expect(updatedRival.roster[0]?.id).not.toBe('pw-pricey');
    expect(updatedRival.treasury).toBe(5000 - AI_GENERATED_RECRUIT_COST);
    expect(updatedRival.needsRecruit).toBe(false);
    expect(updatedPool.map((w) => w.id)).toEqual(['pw-pricey']);
    expect(AI_GENERATED_RECRUIT_COST).toBe(60);
  });
});
