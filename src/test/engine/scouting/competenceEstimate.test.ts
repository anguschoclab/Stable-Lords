// @vitest-environment node
/**
 * Stage E — competence as a scouted estimate (veil-of-war).
 * Scouting a rival's fighter also reads the stablemaster — but only as well
 * as the report quality allows. Expert scouts name the real competence tier,
 * Detailed reports may be a tier off, Basic scouts can't read the corner at
 * all. No owner passed → no estimate (player-side warriors, legacy callers).
 */
import { describe, it, expect } from 'vitest';
import { generateScoutReport } from '@/engine/scouting/scouting';
import { OWNER_COMPETENCES } from '@/types/enumSources';
import { makeWarrior, makeRival } from '@/test/_fixtures/factories';
import { SeededRNGService } from '@/utils/random';
import type { OwnerCompetence } from '@/types/state.types';

const seeds = [1, 7, 42, 99, 2024];
const rivalWith = (competence: OwnerCompetence) =>
  makeRival({ owner: { ...makeRival().owner, competence } });

describe('scouted competence estimate', () => {
  it('Expert reports name the real tier', () => {
    const w = makeWarrior();
    const owner = rivalWith('Master').owner;
    const { report } = generateScoutReport(w, 'Expert', 10, new SeededRNGService(1), owner);
    expect(report.suspectedCompetence).toBe('Master');
  });

  it('Detailed reports land on the real or an adjacent tier', () => {
    const w = makeWarrior();
    const owner = rivalWith('Veteran').owner;
    const idx = OWNER_COMPETENCES.indexOf('Veteran');
    const allowed = [idx - 1, idx, idx + 1].map((i) => OWNER_COMPETENCES[i]).filter(Boolean);
    for (const seed of seeds) {
      const { report } = generateScoutReport(w, 'Detailed', 10, new SeededRNGService(seed), owner);
      expect(allowed).toContain(report.suspectedCompetence);
    }
  });

  it('Basic reports cannot read the stablemaster', () => {
    const w = makeWarrior();
    const owner = rivalWith('Master').owner;
    for (const seed of seeds) {
      const { report } = generateScoutReport(w, 'Basic', 10, new SeededRNGService(seed), owner);
      expect(report.suspectedCompetence).toBeUndefined();
    }
  });

  it('no owner → no estimate (backward-compatible call shape)', () => {
    const w = makeWarrior();
    const { report } = generateScoutReport(w, 'Expert', 10, new SeededRNGService(1));
    expect(report.suspectedCompetence).toBeUndefined();
  });
});
