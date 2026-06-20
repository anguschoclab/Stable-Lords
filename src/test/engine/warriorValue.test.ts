import { describe, it, expect } from 'vitest';
import { computeWarriorLiability } from '@/engine/warriorValue';

const w = (over: any = {}) =>
  ({ traits: [], fame: 20, career: { wins: 5, losses: 5, kills: 1 }, age: 24, ...over }) as any;

describe('computeWarriorLiability', () => {
  it('a clean, decent warrior is Keep with a low score', () => {
    const r = computeWarriorLiability(w({ traits: ['quick'] }));
    expect(r.recommendation).toBe('Keep');
    expect(r.score).toBeLessThan(40);
  });

  it('one flaw is Monitor', () => {
    const r = computeWarriorLiability(w({ traits: ['fragile'] }));
    expect(r.recommendation).toBe('Monitor');
    expect(r.factors.some((f) => /flaw/i.test(f.name))).toBe(true);
  });

  it('two or more flaws is Release', () => {
    const r = computeWarriorLiability(w({ traits: ['fragile', 'slow'] }));
    expect(r.recommendation).toBe('Release');
    expect(r.score).toBeGreaterThan(60);
  });

  it('strong positives soften the recommendation', () => {
    // Two flaws but also a Signature class trait + good record ⇒ not an automatic Release.
    const r = computeWarriorLiability(
      w({ traits: ['fragile', 'living_wall'], fame: 80, career: { wins: 30, losses: 4, kills: 12 } })
    );
    expect(['Monitor', 'Release']).toContain(r.recommendation);
    // value offsets some of the flaw penalty
    const bare = computeWarriorLiability(w({ traits: ['fragile', 'slow'] }));
    expect(r.score).toBeLessThan(bare.score);
  });
});
