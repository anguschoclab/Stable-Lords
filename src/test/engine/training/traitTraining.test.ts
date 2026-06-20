import { describe, it, expect } from 'vitest';
import { FightingStyle } from '@/types/shared.types';
import {
  traitTrainingCeiling,
  traitTrainingPool,
  canAcquireTrait,
  rollTraitTraining,
  TRAIT_TRAIN_WEEKS,
} from '@/engine/training/trainingGains/traitTraining';
import { SeededRNGService } from '@/utils/random';

const trainer = (tier: 'Novice' | 'Seasoned' | 'Master') =>
  ({ id: 't', name: 'T', tier }) as any;
const warrior = (over: any = {}) =>
  ({
    id: 'w',
    style: FightingStyle.WallOfSteel,
    traits: [],
    age: 22,
    attributes: { ST: 12, CN: 12, SZ: 10, WT: 12, WL: 12, SP: 12, DF: 12 },
    trainability: 0.7,
    ...over,
  }) as any;

describe('traitTrainingCeiling', () => {
  it('maps the 3 trainer tiers to a max trait tier', () => {
    expect(traitTrainingCeiling('Novice')).toBe('Notable');
    expect(traitTrainingCeiling('Seasoned')).toBe('Exceptional');
    expect(traitTrainingCeiling('Master')).toBe('Signature');
  });
});

describe('traitTrainingPool', () => {
  it("includes the warrior's class traits and generic positives up to the ceiling, excluding owned", () => {
    const pool = traitTrainingPool(warrior({ traits: ['braced'] }), trainer('Master'));
    expect(pool.some((t) => t.id === 'living_wall')).toBe(true);
    expect(pool.some((t) => t.id === 'braced')).toBe(false);
    expect(pool.every((t) => t.sign === 'positive')).toBe(true);
    expect(
      pool.some(
        (t) => t.styles?.includes(FightingStyle.AimedBlow) && !t.styles?.includes(FightingStyle.WallOfSteel)
      )
    ).toBe(false);
  });

  it('a Novice trainer cannot reach Signature traits', () => {
    const pool = traitTrainingPool(warrior(), trainer('Novice'));
    expect(pool.some((t) => t.tier === 'Signature' || t.tier === 'Exceptional')).toBe(false);
  });
});

describe('canAcquireTrait', () => {
  it('blocks at the 3-trait cap', () => {
    expect(canAcquireTrait(warrior({ traits: ['a', 'b', 'c'] }), 'quick')).toBe(false);
  });
  it('blocks a second personality (fightPlanMod) trait', () => {
    expect(canAcquireTrait(warrior({ traits: ['brutal'] }), 'aggressive')).toBe(false);
  });
  it('blocks a conflicting trait', () => {
    expect(canAcquireTrait(warrior({ traits: ['quick'] }), 'slow')).toBe(false);
  });
  it('allows an otherwise-valid trait', () => {
    expect(canAcquireTrait(warrior({ traits: ['quick'] }), 'agile')).toBe(true);
  });
});

describe('rollTraitTraining', () => {
  it('a Master trainer + apt warrior mostly succeeds; results are valid traits or flaws', () => {
    const rng = new SeededRNGService(12345);
    let success = 0,
      botch = 0,
      none = 0;
    for (let i = 0; i < 300; i++) {
      const r = rollTraitTraining(warrior(), trainer('Master'), rng);
      if (r.outcome === 'success') {
        success++;
        expect(typeof r.traitId).toBe('string');
      } else if (r.outcome === 'botch') {
        botch++;
        expect(typeof r.traitId).toBe('string');
      } else none++;
    }
    expect(success).toBeGreaterThan(botch);
    expect(success + botch + none).toBe(300);
  });

  it('exposes the standard training duration', () => {
    expect(TRAIT_TRAIN_WEEKS).toBeGreaterThanOrEqual(3);
  });
});
