// @vitest-environment node
/**
 * Stage E — worldgen difficulty skew.
 * `GameState.worldOptions.difficulty` is chosen at world creation and
 * plumbed into `generateRivalStables`: a harder world mints more
 * Veteran/Master stablemasters; an easier one more Novices. Mid-game
 * refills keep the standard distribution — the pick skews the world you
 * start in, not the churn forever.
 */
import { describe, it, expect } from 'vitest';
import { generateRivalStables } from '@/engine/rivals/rivalStableFactory';
import { GameStateSchema } from '@/schemas/gameStateSchema';
import { OWNER_COMPETENCES } from '@/types/enumSources';
import { makeGameState } from '@/test/_fixtures/factories';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import type { OwnerCompetence, WorldDifficulty } from '@/types/state.types';

const SHARE_OF = (tiers: OwnerCompetence[]) => (comp: OwnerCompetence) => tiers.includes(comp);

const strongShare = (seed: number, difficulty?: WorldDifficulty) => {
  const rivals = generateRivalStables(30, seed, 0, undefined, { difficulty });
  const strong = rivals.filter((r) =>
    SHARE_OF(['Veteran', 'Master'])(r.owner.competence ?? 'Journeyman')
  ).length;
  return strong / rivals.length;
};

describe('worldgen difficulty', () => {
  it('GameState accepts worldOptions.difficulty', () => {
    // makeGameState carries two legacy-map keys the strict schema rejects —
    // pre-existing fixture gap; strip them so the assertion isolates worldOptions.
    const { rivalryMap: _rm, grudgeMap: _gm, ...state } = makeGameState({
      worldOptions: { difficulty: 'Legend' },
    } as never) as unknown as Record<string, unknown>;
    const parsed = GameStateSchema.parse(state);
    expect(parsed.worldOptions?.difficulty).toBe('Legend');
  });

  it('Legend mints a stronger stablemaster field than Contender', () => {
    for (const seed of [777, 12345]) {
      expect(strongShare(seed, 'Legend')).toBeGreaterThan(strongShare(seed, 'Contender'));
    }
  });

  it('omitted difficulty keeps the standard field', () => {
    // Standard weights: ~30/35/25/10 for N/J/V/M across tiers — the strong
    // share should sit between the two skewed fields for every seed.
    for (const seed of [777, 12345]) {
      const standard = strongShare(seed);
      expect(standard).toBeGreaterThanOrEqual(strongShare(seed, 'Contender'));
      expect(standard).toBeLessThanOrEqual(strongShare(seed, 'Legend'));
    }
  });

  it('every generated owner still carries a schema tier', () => {
    const rivals = generateRivalStables(30, 2024, 0, undefined, { difficulty: 'Legend' });
    for (const r of rivals) expect(OWNER_COMPETENCES).toContain(r.owner.competence);
  });
});

describe('player worldgen path — createFreshState', () => {
  const freshShare = (worldOptions?: { difficulty?: WorldDifficulty }) => {
    const state = createFreshState('audit-seed', '2026-01-01T00:00:00Z', worldOptions);
    const strong = state.rivals.filter((r) =>
      SHARE_OF(['Veteran', 'Master'])(r.owner.competence ?? 'Journeyman')
    ).length;
    return { share: strong / Math.max(1, state.rivals.length), state };
  };

  it('initial rivals mint a competence tier (no inert-baseline field)', () => {
    const state = createFreshState('audit-seed');
    for (const r of state.rivals) {
      expect(OWNER_COMPETENCES).toContain(r.owner.competence);
    }
  });

  it('persists worldOptions on the state and skews the initial field', () => {
    const legend = freshShare({ difficulty: 'Legend' });
    const contender = freshShare({ difficulty: 'Contender' });
    expect(legend.state.worldOptions?.difficulty).toBe('Legend');
    expect(legend.share).toBeGreaterThan(contender.share);
  });
});
