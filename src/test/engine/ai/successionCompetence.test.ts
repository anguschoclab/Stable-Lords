/**
 * Stage B — competence inheritance on owner succession.
 * When an owner retires (`handleOwnerLifecycle`), the successor's competence
 * drifts by at most one tier from the predecessor — dynasties evolve, they
 * don't reroll wholesale. Non-succession ticks never touch competence.
 */
import { describe, it, expect } from 'vitest';
import { handleOwnerLifecycle } from '@/engine/pipeline/passes/rivalStableShard';
import { SeededRNG } from '@/utils/random';
import { makeRival, makeOwner } from '@/test/_fixtures/factories';
import { OWNER_COMPETENCES } from '@/types/enumSources';
import type { OwnerCompetence } from '@/types/state/owner';

const TIER_INDEX: Record<OwnerCompetence, number> = {
  Novice: 0,
  Journeyman: 1,
  Veteran: 2,
  Master: 3,
};

/** Force a succession: age ≥ 75 gives retirementChance 0.2 — sweep seeds. */
function forceSuccession(rival: ReturnType<typeof makeRival>) {
  for (let seed = 0; seed < 200; seed++) {
    const rng = new SeededRNG(seed);
    const { updatedRival } = handleOwnerLifecycle(rival, 5, rng, new Map(), 40);
    if (updatedRival.owner.generation !== rival.owner.generation) {
      return updatedRival;
    }
  }
  return undefined;
}

describe('succession competence drift', () => {
  it('successor competence stays within ±1 tier of the predecessor', () => {
    for (const tier of OWNER_COMPETENCES) {
      const rival = makeRival({
        owner: makeOwner({ age: 80, competence: tier, generation: 0 }),
      });
      const out = forceSuccession(rival);
      expect(out).toBeDefined();
      const drift = Math.abs(TIER_INDEX[out!.owner.competence!] - TIER_INDEX[tier]);
      expect(drift).toBeLessThanOrEqual(1);
    }
  });

  it('non-succession ticks never change competence', () => {
    const rival = makeRival({
      owner: makeOwner({ age: 40, competence: 'Novice' }),
    });
    const rng = new SeededRNG(7);
    const { updatedRival } = handleOwnerLifecycle(rival, 5, rng, new Map(), 40);
    expect(updatedRival.owner.competence).toBe('Novice');
  });

  it('a successor without prior competence receives a rolled tier', () => {
    const rival = makeRival({
      owner: makeOwner({ age: 80, generation: 0 }),
    });
    delete (rival.owner as { competence?: string }).competence;
    const out = forceSuccession(rival);
    expect(out).toBeDefined();
    expect(OWNER_COMPETENCES).toContain(out!.owner.competence);
  });
});
