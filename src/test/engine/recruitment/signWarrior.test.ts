import { describe, it, expect } from 'vitest';
import {
  poolWarriorToWarrior,
  signWarrior,
  generateApprentice,
  generateRecruit,
  TIER_COST,
  type PoolWarrior,
} from '@/engine/recruitment/recruitment';
import { getFittedLoadout } from '@/engine/equipment/loadoutFitting';
import { computeWarriorStats } from '@/engine/warrior/skillCalc';
import { SeededRNG, hashStr } from '@/utils/random';
import { makePoolWarrior, makeWarrior } from '@/test/_fixtures/factories';
import {
  FightingStyle,
  ATTRIBUTE_KEYS,
  ATTRIBUTE_MIN,
  ATTRIBUTE_MAX,
  type WarriorId,
  type StableId,
} from '@/types/shared.types';
import type { Warrior } from '@/types/warrior.types';
import { STYLE_ARCHETYPE, ARCHETYPE_STAT_WEIGHTS } from '@/engine/factories/statGeneration';

const primaryAttr = (style: FightingStyle): keyof Warrior['attributes'] =>
  ARCHETYPE_STAT_WEIGHTS[STYLE_ARCHETYPE[style]].high[0]!;

describe('poolWarriorToWarrior', () => {
  const recruit = (over: Partial<PoolWarrior> = {}): PoolWarrior =>
    makePoolWarrior({
      id: 'pw-1',
      name: 'Alpha',
      lore: 'A storied prospect.',
      origin: 'Hill country',
      traits: ['iron_will'],
      lineage: { generation: 2, pedigree: 'Legacy' },
      avatarSeed: 4242,
      ...over,
    });

  it('preserves the pool entry build verbatim', () => {
    const r = recruit();
    const w = poolWarriorToWarrior(r, { rng: new SeededRNG(1) });

    expect(w.attributes).toEqual(r.attributes);
    expect(w.potential).toEqual(r.potential);
    expect(w.baseSkills).toEqual(r.baseSkills);
    expect(w.derivedStats).toEqual(r.derivedStats);
    expect(w.luckfactor).toEqual(r.luckfactor);
    expect(w.age).toBe(r.age);
    expect(w.lore).toBe(r.lore);
    expect(w.origin).toBe(r.origin);
    expect(w.traits).toEqual(r.traits);
    expect(w.favorites).toEqual(r.favorites);
    expect(w.lineage).toEqual(r.lineage);
    expect(w.avatarSeed).toBe(r.avatarSeed);
  });

  it('flags star investment only for Prodigy recruits', () => {
    expect(poolWarriorToWarrior(recruit({ tier: 'Prodigy' }), {}).isStarInvestment).toBe(true);
    expect(poolWarriorToWarrior(recruit({ tier: 'Common' }), {}).isStarInvestment).toBe(false);
    expect(poolWarriorToWarrior(recruit({ tier: 'Exceptional' }), {}).isStarInvestment).toBe(false);
  });

  it('fits equipment via getFittedLoadout for the recruit style/attributes', () => {
    const r = recruit();
    const w = poolWarriorToWarrior(r, {});
    expect(w.equipment).toEqual(getFittedLoadout(r.style, r.attributes));
  });

  it('stamps the prospect baseline (fame 10 / popularity 5) and the signing stable', () => {
    const w = poolWarriorToWarrior(recruit(), { stableId: 'stable-1' as StableId });
    expect(w.fame).toBe(10);
    expect(w.popularity).toBe(5);
    expect(w.stableId).toBe('stable-1');
    expect(w.status).toBe('Active');
  });

  it('mints a fresh roster id distinct from the pool id and registers it in usedIds', () => {
    const usedIds = new Set<string>();
    const w = poolWarriorToWarrior(recruit(), { usedIds });
    expect(w.id).not.toBe('pw-1');
    expect(usedIds.has(w.id as string)).toBe(true);
  });

  it('re-rolls the minted id when the first candidate is already used or dead', () => {
    const r = recruit();
    // The converter's fallback stream is seeded by hashStr(recruit.id), so the
    // first candidate id is replayable here.
    const probe = new SeededRNG(hashStr(String(r.id)));
    const firstCandidate = probe.uuid('warrior');
    const usedIds = new Set<string>([firstCandidate]);
    const w = poolWarriorToWarrior(r, { usedIds });
    expect(w.id).not.toBe(firstCandidate);
    expect(w.id).not.toBe(r.id);

    const w2 = poolWarriorToWarrior(r, { deadIds: new Set([firstCandidate]) });
    expect(w2.id).not.toBe(firstCandidate);
  });

  it('restores veteran identity through veteranSigningPatch', () => {
    const r = recruit({
      id: 'w-vet',
      veteran: {
        fame: 120,
        popularity: 60,
        career: { wins: 9, losses: 3, kills: 1 },
        titles: ['arena_champion'],
      },
    });
    const w = poolWarriorToWarrior(r, {});
    expect(w.id).toBe('w-vet');
    expect(w.fame).toBe(120);
    expect(w.popularity).toBe(60);
    expect(w.career).toEqual({ wins: 9, losses: 3, kills: 1 });
    expect(w.titles).toEqual(['arena_champion']);
  });

  it('applies the signing bonus as XP and flair', () => {
    const w = poolWarriorToWarrior(recruit(), { signingBonus: true });
    expect(w.xp).toBe(2);
    expect(w.flair).toContain('Eager');
  });

  it('bumps the style-primary attribute for academy apprentices (clamped at max)', () => {
    const key = primaryAttr(FightingStyle.StrikingAttack); // 'ST' — brutal archetype
    const r = recruit({
      source: 'apprentice',
      style: FightingStyle.StrikingAttack,
      attributes: { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
    });
    const w = poolWarriorToWarrior(r, {});
    expect(w.attributes[key]).toBe(11);
    expect(w.flair).toContain('Academy Graduate');
    const recalc = computeWarriorStats(
      { ...r.attributes, [key]: 11 },
      FightingStyle.StrikingAttack
    );
    expect(w.baseSkills).toEqual(recalc.baseSkills);
    expect(w.derivedStats).toEqual(recalc.derivedStats);
  });

  it('does not exceed ATTRIBUTE_MAX on the apprentice bump', () => {
    const key = primaryAttr(FightingStyle.StrikingAttack);
    const r = recruit({
      source: 'apprentice',
      style: FightingStyle.StrikingAttack,
      attributes: {
        ST: ATTRIBUTE_MAX,
        CN: 10,
        SZ: 10,
        WT: 10,
        WL: 10,
        SP: 10,
        DF: 10,
      },
    });
    const w = poolWarriorToWarrior(r, {});
    expect(w.attributes[key]).toBe(ATTRIBUTE_MAX);
  });
});

describe('signWarrior', () => {
  const base = (over: Record<string, unknown> = {}) => ({
    recruit: makePoolWarrior({ id: 'pw-9', cost: 100 }),
    roster: [] as Warrior[],
    maxRoster: 10,
    ...over,
  });

  it('rejects a recruit whose id is registered dead (DEAD_IDENTITY)', () => {
    const res = signWarrior(base({ deadIds: new Set(['pw-9']) }));
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toBe('DEAD_IDENTITY');
  });

  it('rejects when the roster is at capacity (ROSTER_FULL)', () => {
    const roster = Array.from({ length: 10 }, (_, i) =>
      makeWarrior({ id: `w${i}` as WarriorId })
    );
    const res = signWarrior(base({ roster, maxRoster: 10 }));
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toBe('ROSTER_FULL');
  });

  it('counts only active warriors toward the cap', () => {
    const roster = [
      ...Array.from({ length: 9 }, (_, i) => makeWarrior({ id: `w${i}` as WarriorId })),
      makeWarrior({ id: 'w-dead' as WarriorId, status: 'Dead' }),
    ];
    const res = signWarrior(base({ roster, maxRoster: 10 }));
    expect(res.ok).toBe(true);
  });

  it('rejects when treasury cannot cover the signing cost (INSUFFICIENT_FUNDS)', () => {
    const res = signWarrior(base({ treasury: 50 }));
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toBe('INSUFFICIENT_FUNDS');
  });

  it('honors a signingCost override for the affordability check and costPaid', () => {
    const res = signWarrior(base({ treasury: 60, signingCost: 50 }));
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.costPaid).toBe(50);
  });

  it('rejects a forced id that collides with used ids (DUPLICATE_ID)', () => {
    const res = signWarrior(
      base({ forceId: 'w-taken' as WarriorId, usedIds: new Set(['w-taken']) })
    );
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toBe('DUPLICATE_ID');
  });

  it('drains the signed recruit id from both shelves on success', () => {
    const recruit = makePoolWarrior({ id: 'pw-9', cost: 10 });
    const pool = [makePoolWarrior({ id: 'other' }), recruit];
    const freeAgents = [makePoolWarrior({ id: 'fa-x' }), { ...recruit, veteran: { fame: 1, popularity: 1, career: { wins: 0, losses: 0, kills: 0 }, titles: [] } }];
    const res = signWarrior(
      base({ recruit, pool, freeAgents, usedIds: new Set<string>() })
    );
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.updatedPool?.map((w) => w.id)).toEqual(['other']);
      expect(res.updatedFreeAgents?.map((w) => w.id)).toEqual(['fa-x']);
    }
  });
});

describe('generateApprentice', () => {
  const args = (seed: number) => ({
    rng: new SeededRNG(seed),
    usedNames: new Set<string>(),
    week: 5,
    forceTier: 'Common' as const,
  });

  it('tags the intake source and academy age band', () => {
    const a = generateApprentice(args(7));
    expect(a.source).toBe('apprentice');
    expect(a.age).toBeGreaterThanOrEqual(14);
    expect(a.age).toBeLessThanOrEqual(16);
  });

  it('rolls every attribute two points under a same-seed generateRecruit (floored at min)', () => {
    const recruit = generateRecruit(args(99));
    const apprentice = generateApprentice(args(99));
    expect(apprentice.style).toBe(recruit.style);
    for (const k of ATTRIBUTE_KEYS) {
      expect(apprentice.attributes[k]).toBe(
        Math.max(ATTRIBUTE_MIN, recruit.attributes[k] - 2)
      );
    }
  });

  it('prices at three quarters of the open-market tier cost', () => {
    const a = generateApprentice(args(11));
    expect(a.cost).toBe(Math.floor(TIER_COST[a.tier] * 0.75));
  });

  it('gives Common-tier apprentices Promising potential headroom', () => {
    const a = generateApprentice(args(3));
    expect(a.tier).toBe('Common');
    for (const k of ATTRIBUTE_KEYS) {
      // Promising headroom is [3,6] vs Common's [1,4] — every ceiling sits at
      // least +3 above the attribute unless clamped at the absolute max.
      expect(a.potential[k]).toBeGreaterThanOrEqual(
        Math.min(a.attributes[k] + 3, ATTRIBUTE_MAX)
      );
    }
  });
});
