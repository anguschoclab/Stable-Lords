import { describe, it, expect } from 'vitest';
import { planPortraitSpecs } from '#scripts/avatar-pool/planMatrix';

const GENDERS = ['masc', 'fem', 'neutral'];
const AGES = ['young', 'adult', 'middle', 'elder'];

describe('avatar-pool planMatrix', () => {
  it('produces a deterministic spec list for a fixed seed', () => {
    const a = planPortraitSpecs({ count: 60, seed: 42 });
    const b = planPortraitSpecs({ count: 60, seed: 42 });
    expect(a).toEqual(b);
    expect(a).not.toEqual(planPortraitSpecs({ count: 60, seed: 43 }));
  });

  it('emits the requested number of unique ids', () => {
    const specs = planPortraitSpecs({ count: 60, seed: 42 });
    expect(specs).toHaveLength(60);
    expect(new Set(specs.map((s) => s.id)).size).toBe(60);
  });

  it('covers every gender x age-group cell at least once', () => {
    const specs = planPortraitSpecs({ count: 60, seed: 42 });
    for (const g of GENDERS) {
      for (const a of AGES) {
        expect(
          specs.some((s) => s.tags.includes(g) && s.tags.includes(a)),
          `missing cell ${g}/${a}`
        ).toBe(true);
      }
    }
  });

  it('tags every spec with exactly one gender and one age group', () => {
    for (const spec of planPortraitSpecs({ count: 60, seed: 42 })) {
      expect(spec.tags.filter((t) => GENDERS.includes(t))).toHaveLength(1);
      expect(spec.tags.filter((t) => AGES.includes(t))).toHaveLength(1);
      expect(spec.prompt.length).toBeGreaterThan(40);
    }
  });
});
