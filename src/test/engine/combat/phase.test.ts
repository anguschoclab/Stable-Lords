import { describe, it, expect } from 'vitest';
import { getPhaseByExchange, getPhaseByMinute } from '@/engine/combat/phase';
import { MAX_EXCHANGES, EXCHANGES_PER_MINUTE } from '@/constants/combat';

describe('getPhaseByExchange', () => {
  it('returns "opening" for exchange 0', () => {
    expect(getPhaseByExchange(0, MAX_EXCHANGES)).toBe('opening');
  });

  it('returns "opening" for exchanges 0–9 (first third of 30)', () => {
    for (let ex = 0; ex < 10; ex++) {
      expect(getPhaseByExchange(ex, MAX_EXCHANGES)).toBe('opening');
    }
  });

  it('returns "mid" for exchanges 10–19 (second third of 30)', () => {
    for (let ex = 10; ex < 20; ex++) {
      expect(getPhaseByExchange(ex, MAX_EXCHANGES)).toBe('mid');
    }
  });

  it('returns "late" for exchanges 20–29 (final third of 30)', () => {
    for (let ex = 20; ex < 30; ex++) {
      expect(getPhaseByExchange(ex, MAX_EXCHANGES)).toBe('late');
    }
  });

  it('returns "late" for exchange >= maxExchanges', () => {
    expect(getPhaseByExchange(30, MAX_EXCHANGES)).toBe('late');
    expect(getPhaseByExchange(100, MAX_EXCHANGES)).toBe('late');
  });

  it('returns "opening" for negative exchange', () => {
    expect(getPhaseByExchange(-1, MAX_EXCHANGES)).toBe('opening');
    expect(getPhaseByExchange(-5, MAX_EXCHANGES)).toBe('opening');
  });

  it('returns "opening" when maxExchanges <= 0', () => {
    expect(getPhaseByExchange(5, 0)).toBe('opening');
    expect(getPhaseByExchange(5, -1)).toBe('opening');
  });

  it('works with different maxExchanges values', () => {
    expect(getPhaseByExchange(0, 9)).toBe('opening');
    expect(getPhaseByExchange(2, 9)).toBe('opening');
    expect(getPhaseByExchange(3, 9)).toBe('mid');
    expect(getPhaseByExchange(5, 9)).toBe('mid');
    expect(getPhaseByExchange(6, 9)).toBe('late');
    expect(getPhaseByExchange(9, 9)).toBe('late');
  });
});

describe('getPhaseByMinute', () => {
  it('returns "opening" for minutes 1–3 (exchanges 0–9 at 3 ex/min)', () => {
    for (let m = 1; m <= 3; m++) {
      expect(getPhaseByMinute(m, MAX_EXCHANGES, EXCHANGES_PER_MINUTE)).toBe('opening');
    }
  });

  it('returns "mid" for minutes 4–7 (exchanges 10–19 at 3 ex/min)', () => {
    for (let m = 4; m <= 7; m++) {
      expect(getPhaseByMinute(m, MAX_EXCHANGES, EXCHANGES_PER_MINUTE)).toBe('mid');
    }
  });

  it('returns "late" for minutes 8–10 (exchanges 20–29 at 3 ex/min)', () => {
    for (let m = 8; m <= 10; m++) {
      expect(getPhaseByMinute(m, MAX_EXCHANGES, EXCHANGES_PER_MINUTE)).toBe('late');
    }
  });

  it('returns "late" for minute > fight duration', () => {
    expect(getPhaseByMinute(11, MAX_EXCHANGES, EXCHANGES_PER_MINUTE)).toBe('late');
    expect(getPhaseByMinute(20, MAX_EXCHANGES, EXCHANGES_PER_MINUTE)).toBe('late');
  });

  it('returns "opening" for minute <= 0', () => {
    expect(getPhaseByMinute(0, MAX_EXCHANGES, EXCHANGES_PER_MINUTE)).toBe('opening');
    expect(getPhaseByMinute(-1, MAX_EXCHANGES, EXCHANGES_PER_MINUTE)).toBe('opening');
  });

  it('returns "opening" when maxExchanges <= 0', () => {
    expect(getPhaseByMinute(1, 0, EXCHANGES_PER_MINUTE)).toBe('opening');
  });

  it('returns "opening" when exchangesPerMinute <= 0', () => {
    expect(getPhaseByMinute(1, MAX_EXCHANGES, 0)).toBe('opening');
  });
});
