/**
 * Stage B — OwnerCompetence schema + factory wiring.
 * The competence tier is a third owner axis (orthogonal to personality and
 * metaAdaptation): it must round-trip through OwnerSchema and be stamped by
 * the rival factory with a weighted, Masters-rare distribution.
 */
import { describe, it, expect } from 'vitest';
import { OwnerSchema, OwnerCompetenceSchema } from '@/schemas/economySchemas';
import { OWNER_COMPETENCES } from '@/types/enumSources';
import { generateRivalStables } from '@/engine/rivals/rivalStableFactory';
import { rollCompetence } from '@/engine/ai/competence';
import { SeededRNGService } from '@/utils/random';

const baseOwner = {
  id: 'owner-1',
  name: 'Test Owner',
  stableName: 'Test Stable',
  fame: 100,
  renown: 10,
  titles: 0,
};

describe('OwnerCompetence — enum + schema', () => {
  it('declares exactly four tiers', () => {
    expect(OWNER_COMPETENCES).toEqual(['Novice', 'Journeyman', 'Veteran', 'Master']);
  });

  it('OwnerCompetenceSchema accepts every tier and rejects junk', () => {
    for (const tier of OWNER_COMPETENCES) {
      expect(OwnerCompetenceSchema.parse(tier)).toBe(tier);
    }
    expect(() => OwnerCompetenceSchema.parse('Grandmaster')).toThrow();
    expect(() => OwnerCompetenceSchema.parse(3)).toThrow();
  });

  it('OwnerSchema round-trips competence alongside personality/metaAdaptation', () => {
    const parsed = OwnerSchema.parse({
      ...baseOwner,
      personality: 'Tactician',
      metaAdaptation: 'Innovator',
      competence: 'Veteran',
    });
    expect(parsed.competence).toBe('Veteran');
    expect(parsed.personality).toBe('Tactician');
    expect(parsed.metaAdaptation).toBe('Innovator');
  });

  it('OwnerSchema tolerates a missing competence (fresh worlds get factory defaults)', () => {
    const parsed = OwnerSchema.parse(baseOwner);
    expect(parsed.competence).toBeUndefined();
  });
});

describe('rollCompetence — tier-skewed weights', () => {
  const draws = (tier: string, n = 200) => {
    const rng = new SeededRNGService(4242);
    const counts: Record<string, number> = {};
    for (let i = 0; i < n; i++) {
      const c = rollCompetence(rng, tier as never);
      counts[c] = (counts[c] ?? 0) + 1;
    }
    return counts;
  };

  it('Minor stables skew Novice/Journeyman, Masters rare', () => {
    const counts = draws('Minor');
    expect(counts['Master'] ?? 0).toBeLessThan(200 * 0.15);
    expect((counts['Novice'] ?? 0) + (counts['Journeyman'] ?? 0)).toBeGreaterThan(200 * 0.6);
  });

  it('Legendary stables skew Veteran/Master, Novice absent or rare', () => {
    const counts = draws('Legendary');
    expect(counts['Novice'] ?? 0).toBeLessThan(200 * 0.1);
    expect((counts['Veteran'] ?? 0) + (counts['Master'] ?? 0)).toBeGreaterThan(200 * 0.7);
  });

  it('is deterministic for a given seed', () => {
    const a = new SeededRNGService(99);
    const b = new SeededRNGService(99);
    for (let i = 0; i < 20; i++) {
      expect(rollCompetence(a, 'Major' as never)).toBe(rollCompetence(b, 'Major' as never));
    }
  });
});

describe('rival factory — competence stamping', () => {
  it('every generated owner carries a valid competence tier', () => {
    const rivals = generateRivalStables(30, 777, 0);
    expect(rivals.length).toBe(30);
    for (const r of rivals) {
      expect(OWNER_COMPETENCES).toContain(r.owner.competence);
    }
  });

  it('distribution contains at least two distinct tiers', () => {
    const rivals = generateRivalStables(30, 777, 0);
    const tiers = new Set(rivals.map((r) => r.owner.competence));
    expect(tiers.size).toBeGreaterThanOrEqual(2);
  });
});
