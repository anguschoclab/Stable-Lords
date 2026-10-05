/**
 * Stage B — competence primitives.
 * `competenceQuality` is the single knob every worker consumes: a 0..1
 * decision-quality score by tier. `blendQuality` folds it into an existing
 * personality-scaled quality so both axes stay meaningful, and
 * `competenceJitter` produces the deterministic hash-noise idiom used by
 * intelWorker/draft/poach scorers — spread shrinks with tier.
 */
import { describe, it, expect } from 'vitest';
import {
  COMPETENCE_QUALITY,
  competenceOf,
  competenceQuality,
  blendQuality,
  competenceJitter,
} from '@/engine/ai/competence';
import { makeOwner } from '@/test/_fixtures/factories';

describe('competenceOf / competenceQuality', () => {
  it('defaults to Journeyman when competence is unset', () => {
    expect(competenceOf(makeOwner({ competence: undefined }))).toBe('Journeyman');
    expect(competenceOf(undefined)).toBe('Journeyman');
  });

  it('quality is strictly increasing Novice → Master', () => {
    expect(COMPETENCE_QUALITY.Novice).toBeLessThan(COMPETENCE_QUALITY.Journeyman);
    expect(COMPETENCE_QUALITY.Journeyman).toBeLessThan(COMPETENCE_QUALITY.Veteran);
    expect(COMPETENCE_QUALITY.Veteran).toBeLessThan(COMPETENCE_QUALITY.Master);
  });

  it('competenceQuality maps tier → table', () => {
    expect(competenceQuality(makeOwner({ competence: 'Master' }))).toBe(COMPETENCE_QUALITY.Master);
    expect(competenceQuality(makeOwner({ competence: 'Novice' }))).toBe(COMPETENCE_QUALITY.Novice);
  });
});

describe('blendQuality — personality × competence', () => {
  it('is the mean of the two qualities', () => {
    // Tactician scout quality 0.9 blended with Novice 0.3 → 0.6
    expect(blendQuality(0.9, makeOwner({ competence: 'Novice' }))).toBeCloseTo(0.6, 5);
    // Pragmatic 0.6 blended with Master 0.9 → 0.75
    expect(blendQuality(0.6, makeOwner({ competence: 'Master' }))).toBeCloseTo(0.75, 5);
  });

  it('a Master of a weaker personality out-reads a Novice of a stronger one', () => {
    const noviceTactician = blendQuality(0.9, makeOwner({ competence: 'Novice' }));
    const masterPragmatic = blendQuality(0.6, makeOwner({ competence: 'Master' }));
    expect(masterPragmatic).toBeGreaterThan(noviceTactician);
  });
});

describe('competenceJitter — deterministic noise', () => {
  const owner = (competence: 'Novice' | 'Journeyman' | 'Veteran' | 'Master') =>
    makeOwner({ id: 'o-1' as never, competence });

  it('same inputs produce the same jitter (seeded determinism)', () => {
    const a = competenceJitter(owner('Novice'), 'salt-1', 0.4);
    const b = competenceJitter(owner('Novice'), 'salt-1', 0.4);
    expect(a).toBe(b);
  });

  it('different salts produce different jitters', () => {
    const seen = new Set(
      Array.from({ length: 10 }, (_, i) => competenceJitter(owner('Veteran'), `s-${i}`, 0.4))
    );
    expect(seen.size).toBeGreaterThan(5);
  });

  it('is bounded by the base spread', () => {
    for (let i = 0; i < 50; i++) {
      const j = competenceJitter(owner('Novice'), `b-${i}`, 0.4);
      expect(Math.abs(j)).toBeLessThanOrEqual(0.4 + 1e-9);
    }
  });

  it('Novice spread strictly exceeds Master spread for any nonzero hash', () => {
    // For every salt, |jitter_Novice| >= |jitter_Master|, and at least one
    // salt must differ — jitter = hash × (1 - quality).
    let anyDifferent = false;
    for (let i = 0; i < 40; i++) {
      const n = Math.abs(competenceJitter(owner('Novice'), `cmp-${i}`, 0.4));
      const m = Math.abs(competenceJitter(owner('Master'), `cmp-${i}`, 0.4));
      expect(n).toBeGreaterThanOrEqual(m - 1e-12);
      if (n > m + 1e-12) anyDifferent = true;
    }
    expect(anyDifferent).toBe(true);
  });
});
