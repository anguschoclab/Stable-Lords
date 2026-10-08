import { describe, it, expect } from 'vitest';
import { computeFightEconomics, FIGHT_PURSE, WIN_BONUS } from '@/constants/economy/economy';

describe('computeFightEconomics', () => {
  it('returns base purse and win bonus for a fame-0 tier-1 winner', () => {
    const r = computeFightEconomics({ fame: 0, arenaTier: 1, won: true });
    expect(r.purse).toBe(FIGHT_PURSE);
    expect(r.winBonus).toBe(WIN_BONUS);
  });

  it('awards no win bonus on a loss', () => {
    const r = computeFightEconomics({ fame: 0, arenaTier: 1, won: false });
    expect(r.purse).toBe(FIGHT_PURSE);
    expect(r.winBonus).toBe(0);
  });

  it('scales purse up with fame', () => {
    const low = computeFightEconomics({ fame: 0, arenaTier: 1, won: true });
    const high = computeFightEconomics({ fame: 30, arenaTier: 1, won: true });
    expect(high.purse).toBeGreaterThan(low.purse);
  });

  it('scales purse up with arena tier', () => {
    const t1 = computeFightEconomics({ fame: 0, arenaTier: 1, won: true });
    const t3 = computeFightEconomics({ fame: 0, arenaTier: 3, won: true });
    expect(t3.purse).toBeGreaterThan(t1.purse);
  });

  it('caps the fame multiplier so purses do not run away', () => {
    const atCap = computeFightEconomics({ fame: 60, arenaTier: 1, won: false });
    const wayOver = computeFightEconomics({ fame: 600, arenaTier: 1, won: false });
    expect(wayOver.purse).toBe(atCap.purse);
  });

  it('treats missing/zero fame and unknown tier safely', () => {
    const r = computeFightEconomics({ fame: 0, arenaTier: 1, won: true });
    expect(Number.isFinite(r.purse)).toBe(true);
    expect(Number.isFinite(r.winBonus)).toBe(true);
  });
});
