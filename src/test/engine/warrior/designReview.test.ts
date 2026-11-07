import { describe, it, expect } from 'vitest';
import {
  reviewWarriorDesign,
  type DesignAxis,
  type DesignVerdict,
} from '@/engine/warrior/designReview';
import { FightingStyle, type Attributes } from '@/types/shared.types';

/** Attribute spread builder — all-10s base, override as needed. */
const A = (over: Partial<Attributes> = {}): Attributes => ({
  ST: 10,
  CN: 10,
  SZ: 10,
  WT: 10,
  WL: 10,
  SP: 10,
  DF: 10,
  ...over,
});

const AXES: DesignAxis[] = ['style', 'physicals', 'weapons', 'trainability', 'longevity'];
const VERDICTS: DesignVerdict[] = ['good', 'ok', 'warn', 'info'];

const itemsOn = (
  items: ReturnType<typeof reviewWarriorDesign>,
  axis: DesignAxis
) => items.filter((i) => i.axis === axis);

describe('reviewWarriorDesign — item shape', () => {
  it('emits well-formed items for several builds', () => {
    const builds: [Attributes, FightingStyle][] = [
      [A(), FightingStyle.LungingAttack],
      [A({ ST: 3, CN: 3, SZ: 3, WL: 5 }), FightingStyle.TotalParry],
      [A({ ST: 17, CN: 15, SZ: 12, WL: 15, SP: 5 }), FightingStyle.WallOfSteel],
    ];
    for (const [attrs, style] of builds) {
      const items = reviewWarriorDesign(attrs, style);
      expect(items.length).toBeGreaterThanOrEqual(4);
      for (const item of items) {
        expect(AXES).toContain(item.axis);
        expect(VERDICTS).toContain(item.verdict);
        expect(item.title.length).toBeGreaterThan(0);
        expect(item.detail.length).toBeGreaterThan(0);
      }
    }
  });

  it('is deterministic — identical inputs produce identical items', () => {
    const attrs = A({ ST: 8, CN: 8, SZ: 8, WT: 13, WL: 13, SP: 9, DF: 11 });
    expect(reviewWarriorDesign(attrs, FightingStyle.LungingAttack)).toEqual(
      reviewWarriorDesign(attrs, FightingStyle.LungingAttack)
    );
  });
});

describe('reviewWarriorDesign — style axis', () => {
  it('rates a defensive build on will and constitution', () => {
    const items = reviewWarriorDesign(A({ CN: 14, WL: 15 }), FightingStyle.TotalParry);
    expect(itemsOn(items, 'style')[0]?.verdict).toBe('good');
  });

  it('warns when a key attribute is very low', () => {
    const items = reviewWarriorDesign(A({ CN: 14, WL: 5 }), FightingStyle.TotalParry);
    expect(itemsOn(items, 'style')[0]?.verdict).toBe('warn');
  });

  it('flags the canon low-will striker design', () => {
    // Low-Will Wonder scaled: ST14 CN8 SZ6 WT14 WL7 SP12 DF9 — will is the
    // style's key attribute and sits far below the bar.
    const items = reviewWarriorDesign(
      A({ ST: 14, CN: 8, SZ: 6, WT: 14, WL: 7, SP: 12, DF: 9 }),
      FightingStyle.StrikingAttack
    );
    expect(itemsOn(items, 'style')[0]?.verdict).toBe('warn');
  });

  it('warns an aimed-blow with low deftness (canon tip)', () => {
    const items = reviewWarriorDesign(A({ DF: 10 }), FightingStyle.AimedBlow);
    const warn = items.find((i) => i.verdict === 'warn' && /deft/i.test(i.detail));
    expect(warn).toBeDefined();
    expect(warn!.axis).toBe('style');
  });
});

describe('reviewWarriorDesign — physicals axis', () => {
  it('warns when nothing reaches a good physical level', () => {
    // endurance L (score 21), damage Little, HP 7.
    const items = reviewWarriorDesign(
      A({ ST: 3, CN: 3, SZ: 3, WL: 5 }),
      FightingStyle.TotalParry
    );
    expect(itemsOn(items, 'physicals')[0]?.verdict).toBe('warn');
  });

  it('passes when at least one capability is good or better', () => {
    // endurance Great (score 77), damage Great, HP 38.
    const items = reviewWarriorDesign(
      A({ ST: 17, CN: 15, SZ: 12, WL: 15, SP: 5 }),
      FightingStyle.WallOfSteel
    );
    expect(itemsOn(items, 'physicals')[0]?.verdict).toBe('good');
  });
});

describe('reviewWarriorDesign — weapons axis', () => {
  it('rewards a build suited to several style weapons', () => {
    const items = reviewWarriorDesign(
      A({ ST: 15, WT: 15, DF: 15 }),
      FightingStyle.LungingAttack
    );
    expect(itemsOn(items, 'weapons')[0]?.verdict).toBe('good');
  });

  it('warns when nothing well-suited is wieldable or close', () => {
    const items = reviewWarriorDesign(
      A({ ST: 3, SZ: 3, WT: 3, DF: 3 }),
      FightingStyle.WallOfSteel
    );
    expect(itemsOn(items, 'weapons')[0]?.verdict).toBe('warn');
  });

  it('rates one wielded weapon with near-reach options as ok', () => {
    // Scaled Broke Stroker: meets short_sword; scimitar and short_spear each
    // sit one strength train away.
    const items = reviewWarriorDesign(
      A({ ST: 8, CN: 8, SZ: 8, WT: 13, WL: 13, SP: 9, DF: 11 }),
      FightingStyle.LungingAttack
    );
    expect(itemsOn(items, 'weapons')[0]?.verdict).toBe('ok');
  });
});

describe('reviewWarriorDesign — trainability axis', () => {
  it('names attributes primed for a quick breakpoint train', () => {
    // DF 10 sits one point below the next deftness breakpoint (11); every
    // other skill-bearing attribute is 3+ below its next threshold.
    const items = reviewWarriorDesign(
      A({ WT: 18, SP: 15, DF: 10 }),
      FightingStyle.ParryRiposte
    );
    const train = itemsOn(items, 'trainability')[0];
    expect(train?.detail).toContain('DF');
    expect(train?.detail).not.toContain('WL');
  });

  it('notes high wit on a scum build as a spending trade-off', () => {
    const items = reviewWarriorDesign(
      A({ CN: 14, WT: 18, WL: 15 }),
      FightingStyle.TotalParry
    );
    const scum = items.find((i) => i.verdict === 'info' && /scum|wit/i.test(i.detail));
    expect(scum).toBeDefined();
  });
});

describe('reviewWarriorDesign — longevity axis', () => {
  it('marks high-wit builds as fast learners', () => {
    const items = reviewWarriorDesign(A({ WT: 18 }), FightingStyle.StrikingAttack);
    const learner = items.find(
      (i) => i.axis === 'longevity' && /learn/i.test(i.title + i.detail)
    );
    expect(learner).toBeDefined();
    expect(learner!.verdict).toBe('info');
  });
});
