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

describe('slasher canon notes (Arena 93 slasher articles)', () => {
  it('green-lights an SL design that meets the scimitar criterion (ST9+/WT11+/DF11+)', () => {
    const items = reviewWarriorDesign(
      A({ ST: 9, WT: 10, DF: 10 }),
      FightingStyle.SlashingAttack
    );
    expect(
      items.find((x) => x.axis === 'style' && /scimitar/i.test(x.detail) && x.verdict === 'ok')
    ).toBeDefined();
  });

  it('warns when an SL design misses the scimitar criterion by more than a couple trains', () => {
    const items = reviewWarriorDesign(
      A({ ST: 7, WT: 7, DF: 9 }),
      FightingStyle.SlashingAttack
    );
    expect(
      items.find((x) => x.axis === 'style' && /scimitar/i.test(x.detail) && x.verdict === 'warn')
    ).toBeDefined();
  });

  it('notes the negative-parry baseline when DF sits below the parry turnpoint', () => {
    const items = reviewWarriorDesign(
      A({ DF: 10, WT: 15, WL: 15 }),
      FightingStyle.SlashingAttack
    );
    expect(
      items.find((x) => x.axis === 'style' && /parry/i.test(x.detail) && x.verdict === 'info')
    ).toBeDefined();
  });

  it('notes the longevity trade-off for big slashers', () => {
    const items = reviewWarriorDesign(A({ SZ: 14 }), FightingStyle.SlashingAttack);
    expect(
      items.find((x) => x.axis === 'style' && /big|size/i.test(x.detail) && x.verdict === 'info')
    ).toBeDefined();
  });

  it('notes that SP is wasted on a slasher', () => {
    const items = reviewWarriorDesign(A({ SP: 14 }), FightingStyle.SlashingAttack);
    expect(
      items.find((x) => x.axis === 'style' && /SP|speed/i.test(x.detail) && x.verdict === 'info')
    ).toBeDefined();
  });
});

describe('striker canon notes (Arena 93 striker articles)', () => {
  const ST = FightingStyle.StrikingAttack;

  it("warns a striker below Assur's stat minimums (ST 9 / WT 11 / WL 9 / DF 11)", () => {
    const items = reviewWarriorDesign(A({ ST: 8, WT: 10, WL: 8, DF: 10 }), ST);
    const warn = items.find(
      (x) => x.axis === 'style' && x.verdict === 'warn' && /minimum/i.test(x.title + x.detail)
    );
    expect(warn).toBeDefined();
  });

  it('names the short stats in the minimums warning', () => {
    const items = reviewWarriorDesign(A({ ST: 8, WL: 7 }), ST);
    const warn = items.find(
      (x) => x.axis === 'style' && /minimum/i.test(x.title + x.detail)
    );
    expect(warn?.detail).toMatch(/ST/);
    expect(warn?.detail).toMatch(/WL/);
  });

  it('does not warn on a build meeting the minimums', () => {
    const items = reviewWarriorDesign(A({ ST: 9, WT: 11, WL: 9, DF: 11 }), ST);
    expect(
      items.find(
        (x) => x.axis === 'style' && x.verdict === 'warn' && /minimum/i.test(x.title + x.detail)
      )
    ).toBeUndefined();
  });

  it("warns when no physical pairing reaches Assur's floor (N/N, P/Good, VL/Great)", () => {
    // ST7+SZ7 → damage Normal(2); WL6+CN5+ST7 → endurance 'L' — fails all three.
    const items = reviewWarriorDesign(A({ ST: 7, CN: 5, SZ: 7, WL: 6 }), ST);
    expect(
      items.find(
        (x) => x.axis === 'physicals' && x.verdict === 'warn' && /pairing/i.test(x.detail)
      )
    ).toBeDefined();
  });

  it("accepts Assur's Poor-endurance/Good-damage pairing", () => {
    // ST13+SZ13 → damage Good(3); WL9+CN7+ST13 → endurance 'P' — pairing two met.
    const items = reviewWarriorDesign(A({ ST: 13, CN: 7, SZ: 13, WL: 9 }), ST);
    expect(
      items.find(
        (x) => x.axis === 'physicals' && x.verdict === 'warn' && /pairing/i.test(x.detail)
      )
    ).toBeUndefined();
  });

  it("flags Boyd's damage rule — a striker with ST+SZ < 21 hits softly", () => {
    const items = reviewWarriorDesign(A({ ST: 8, SZ: 8 }), ST);
    expect(
      items.find(
        (x) => x.axis === 'physicals' && x.verdict === 'info' && /strength|size|damage/i.test(x.detail)
      )
    ).toBeDefined();
  });

  it('marks a Talon-Primal frame (WT 17+ / DF 15+ / WL 13+) as Primus-quality', () => {
    const items = reviewWarriorDesign(A({ WT: 17, DF: 15, WL: 13 }), ST);
    expect(
      items.find((x) => x.axis === 'longevity' && x.verdict === 'info' && /primal|primus/i.test(x.title + x.detail))
    ).toBeDefined();
  });
});

describe('piker canon notes (Arena 93 parry-strike articles)', () => {
  const PS = FightingStyle.ParryStrike;

  it('advises low wit on a standard piker — canon: wit is the keystone, 17-21', () => {
    const items = reviewWarriorDesign(A({ WT: 12, WL: 15, ST: 14 }), PS);
    const wit = items.find(
      (x) => x.axis === 'style' && x.verdict === 'info' && /wit/i.test(x.title + x.detail)
    );
    expect(wit).toBeDefined();
  });

  it('does not advise on a high-wit piker', () => {
    const items = reviewWarriorDesign(A({ WT: 18, WL: 15 }), PS);
    const wit = items.find(
      (x) => x.axis === 'style' && x.verdict === 'info' && /wit/i.test(x.title + x.detail)
    );
    expect(wit).toBeUndefined();
  });

  it('warns on the average-numbers anti-build — canon: never make average numbers into pikers', () => {
    // Scaled 10-10-10-17-17-9-11 ≈ 8-8-8-14-14-8-10: nothing stands out.
    const items = reviewWarriorDesign(
      A({ ST: 8, CN: 8, SZ: 8, WT: 14, WL: 14, SP: 8, DF: 10 }),
      PS
    );
    const flat = items.find(
      (x) =>
        x.axis === 'style' && x.verdict === 'warn' && /average|extreme|spread/i.test(x.title + x.detail)
    );
    expect(flat).toBeDefined();
  });

  it('warns on an all-10s piker', () => {
    const items = reviewWarriorDesign(A(), PS);
    const flat = items.find(
      (x) =>
        x.axis === 'style' && x.verdict === 'warn' && /average|extreme|spread/i.test(x.title + x.detail)
    );
    expect(flat).toBeDefined();
  });

  it('does not warn on an extreme piker build', () => {
    const items = reviewWarriorDesign(
      A({ ST: 17, CN: 5, SZ: 4, WT: 17, WL: 7, SP: 10, DF: 10 }),
      PS
    );
    const flat = items.find(
      (x) =>
        x.axis === 'style' && x.verdict === 'warn' && /average|extreme|spread/i.test(x.title + x.detail)
    );
    expect(flat).toBeUndefined();
  });
});

describe('reviewWarriorDesign — Parry-Lunge canon notes (Arena 93)', () => {
  const PL = FightingStyle.ParryLunge;

  it('flags glass-jaw constitution — the armor-piercer "clings to life by luck"', () => {
    const items = reviewWarriorDesign(A({ CN: 5, WT: 17, WL: 17, DF: 17 }), PL);
    const note = items.find(
      (x) => x.axis === 'style' && x.verdict === 'info' && /luck|fragile|glass/i.test(x.title + x.detail)
    );
    expect(note).toBeDefined();
  });

  it('notes wasted speed — a PL is "not a lunger mimic"', () => {
    const items = reviewWarriorDesign(A({ SP: 12, WT: 17, WL: 17, DF: 17 }), PL);
    const note = items.find(
      (x) => x.axis === 'style' && x.verdict === 'info' && /speed|SP|lunger mimic/i.test(x.title + x.detail)
    );
    expect(note).toBeDefined();
  });

  it('notes sub-15 deftness — DF 15 unlocks the epee', () => {
    const items = reviewWarriorDesign(A({ WT: 17, WL: 17, DF: 12 }), PL);
    const note = items.find(
      (x) => x.axis === 'style' && x.verdict === 'info' && /epee|deftness|DF/i.test(x.title + x.detail)
    );
    expect(note).toBeDefined();
  });

  it('praises the armor-piercer spread — WT 17+ with DF 15+ is the attack-god chassis', () => {
    const items = reviewWarriorDesign(A({ ST: 11, CN: 5, SZ: 8, WT: 21, WL: 17, SP: 5, DF: 17 }), PL);
    const note = items.find(
      (x) => x.axis === 'style' && x.verdict !== 'warn' && /attack god|attack-god/i.test(x.title + x.detail)
    );
    expect(note).toBeDefined();
  });

  it('does not leak PL notes onto other styles', () => {
    const items = reviewWarriorDesign(
      A({ CN: 5, SP: 12, WT: 17, WL: 17, DF: 12 }),
      FightingStyle.TotalParry
    );
    const leaked = items.find(
      (x) => /attack god|lunger mimic|epee/i.test(x.title + x.detail)
    );
    expect(leaked).toBeUndefined();
  });
});
