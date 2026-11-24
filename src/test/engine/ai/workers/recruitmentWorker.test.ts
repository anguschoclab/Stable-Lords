import { describe, it, expect } from 'vitest';
import { processRecruitment } from '@/engine/ai/workers/recruitmentWorker';
import { SeededRNG } from '@/utils/random';
import { makeTestRecruit, makeMinimalRival, makeWarrior } from '@/test/_fixtures/factories';
import { aiRosterMax, aiRosterMin } from '@/constants/ai';
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

describe('processRecruitment — vacancy-pressure valuation', () => {
  // A depleted stable bids with urgency, not leisurely valuation: under
  // roster-vacancy pressure the price penalty is quartered
  // (AI_DRAFT_URGENT_PRICE_SCALE), so the premium prospect outranks the
  // thrift pick it would lose to on price alone. Identical style/age/attrs
  // keep tier + price the only score inputs that differ.
  const premium = () =>
    makePoolWarrior({
      id: 'pw-premium',
      name: 'Premium Prospect',
      tier: 'Exceptional',
      cost: 200,
    });
  const thrift = () =>
    makePoolWarrior({ id: 'pw-thrift', name: 'Thrift Prospect', tier: 'Common', cost: 40 });

  it('a needsRecruit stable pays nearer asking and takes the premium prospect first', () => {
    const rival = makeMinimalRival({ treasury: 5000, needsRecruit: true, roster: [] });
    const rng = new SeededRNG(42);

    const { updatedRival, updatedPool } = processRecruitment({
      rival,
      pool: [thrift(), premium()],
      week: 2,
      rng,
      isMajorDraftWeek: false,
    });

    // Both slots fill — but the premium body is the FIRST signing, not the
    // cheap one leisurely Pragmatic valuation would have preferred.
    expect(updatedRival.roster.map((w) => w.name)).toEqual(['Premium Prospect', 'Thrift Prospect']);
    expect(updatedRival.treasury).toBe(5000 - 200 - 40);
    expect(updatedPool).toEqual([]);
  });

  it('below-min roster triggers urgency even without the needsRecruit flag', () => {
    const rival = makeMinimalRival({ treasury: 5000, roster: [] });
    const rng = new SeededRNG(42);

    const { updatedRival } = processRecruitment({
      rival,
      pool: [thrift(), premium()],
      week: 2,
      rng,
      isMajorDraftWeek: false,
    });

    expect(updatedRival.roster[0]?.name).toBe('Premium Prospect');
  });

  it('a comfortable stable still haggles (control — takes the thrift prospect)', () => {
    const personality = 'Pragmatic';
    const rival = makeMinimalRival({
      treasury: 5000,
      needsRecruit: false,
      roster: Array.from({ length: aiRosterMin(personality) }, (_, i) =>
        makeWarrior({ id: `wr-c${i}` as never })
      ),
    });
    const rng = new SeededRNG(42);

    const { updatedRival, updatedPool } = processRecruitment({
      rival,
      pool: [thrift(), premium()],
      week: 2,
      rng,
      isMajorDraftWeek: false,
    });

    // Full price sensitivity keeps the cheap Common ahead (and the premium
    // recruit's negative score fails the non-desperate gate), so exactly one
    // signing lands and the premium recruit stays on the shelf.
    expect(updatedRival.roster).toHaveLength(aiRosterMin(personality) + 1);
    expect(updatedRival.roster.at(-1)?.name).toBe('Thrift Prospect');
    expect(updatedPool.map((w) => w.id)).toEqual(['pw-premium']);
  });
});

describe('draft scoring — characterization (scoreCandidate pin)', () => {
  it('tourneyDraftBonus is zero outside TOURNAMENT_CAMPAIGN', async () => {
    const { tourneyDraftBonus } = await import('@/engine/ai/workers/recruitmentWorker');
    const attrs = { ST: 15, CN: 15, SZ: 15, WT: 15, WL: 15, SP: 15, DF: 15 };
    const recruit = makePoolWarrior({ attributes: attrs as never });
    expect(tourneyDraftBonus(recruit, 'CONSOLIDATION')).toBe(0);
    expect(tourneyDraftBonus(recruit, undefined)).toBe(0);
    expect(tourneyDraftBonus(recruit, 'TOURNAMENT_CAMPAIGN')).toBeGreaterThan(0);
  });

  it('attrTotal ready-bonus decides between otherwise-identical recruits', () => {
    // Competence is unset on the fixture owner → competenceJitter is inert
    // (0) — the only score delta is (attrTotal - 70) * readyBonusPerPoint.
    // Aggressive owners carry readyBonusPerPoint = 2.
    const rival = makeMinimalRival();
    rival.owner = { ...rival.owner, personality: 'Aggressive' };
    const attrs70 = { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 };
    const attrs84 = { ST: 24, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 };
    const weak = makePoolWarrior({
      id: 'pw-weak' as never,
      name: 'Weak Twin',
      attributes: attrs70 as never,
    });
    const strong = makePoolWarrior({
      id: 'pw-strong' as never,
      name: 'Strong Twin',
      attributes: attrs84 as never,
    });
    const { updatedRival } = processRecruitment({
      rival,
      pool: [weak, strong],
      week: 2,
      rng: new SeededRNG(42),
      isMajorDraftWeek: true,
    });
    // slotsAvailable > 1 signs both — the FIRST signing is the argmax.
    expect(updatedRival.roster[0]?.name).toBe('Strong Twin');
  });

  it('the draft pick is deterministic for identical inputs', () => {
    const rival = makeMinimalRival();
    const pool = [makePoolWarrior({ name: 'A' }), makePoolWarrior({ name: 'B' })];
    const run = () =>
      processRecruitment({
        rival,
        pool: pool.map((w) => ({ ...w })),
        week: 2,
        rng: new SeededRNG(42),
        isMajorDraftWeek: true,
      }).updatedRival;
    expect(run().roster.map((w) => w.name)).toEqual(run().roster.map((w) => w.name));
  });
});
