import { describe, it, expect } from 'vitest';
import { BucketSchema, RollingBucketSchema } from '@/schemas/statsSchemas';

describe('BucketSchema', () => {
  it('accepts a valid bucket', () => {
    const valid = { w: 1, l: 0, k: 0, pct: 1, fights: 1 };
    const result = BucketSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(valid);
    }
  });

  it('rejects missing required field (no pct)', () => {
    const result = BucketSchema.safeParse({ w: 1, l: 0, k: 0, fights: 1 });
    expect(result.success).toBe(false);
  });

  it('rejects wrong type (w as string)', () => {
    const result = BucketSchema.safeParse({ w: '1', l: 0, k: 0, pct: 1, fights: 1 });
    expect(result.success).toBe(false);
  });

  it('rejects non-object (string)', () => {
    expect(BucketSchema.safeParse('not an object').success).toBe(false);
  });

  it('rejects non-object (number)', () => {
    expect(BucketSchema.safeParse(42).success).toBe(false);
  });

  it('rejects non-object (null)', () => {
    expect(BucketSchema.safeParse(null).success).toBe(false);
  });

  it('rejects non-object (array)', () => {
    expect(BucketSchema.safeParse([1, 2, 3]).success).toBe(false);
  });

  it('strips unknown extra fields', () => {
    const result = BucketSchema.safeParse({
      w: 1,
      l: 0,
      k: 0,
      pct: 1,
      fights: 1,
      evil: 'inject',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toHaveProperty('evil');
    }
  });

  it('rejects NaN values', () => {
    const result = BucketSchema.safeParse({ w: NaN, l: 0, k: 0, pct: 1, fights: 1 });
    expect(result.success).toBe(false);
  });

  it('rejects Infinity values', () => {
    const result = BucketSchema.safeParse({ w: Infinity, l: 0, k: 0, pct: 1, fights: 1 });
    expect(result.success).toBe(false);
  });
});

describe('RollingBucketSchema', () => {
  it('accepts a valid rolling bucket', () => {
    const valid = { W: 1, L: 0, K: 0, fights: 1 };
    const result = RollingBucketSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(valid);
    }
  });

  it('rejects missing required field (no fights)', () => {
    const result = RollingBucketSchema.safeParse({ W: 1, L: 0, K: 0 });
    expect(result.success).toBe(false);
  });

  it('rejects wrong type (W as string)', () => {
    const result = RollingBucketSchema.safeParse({ W: '1', L: 0, K: 0, fights: 1 });
    expect(result.success).toBe(false);
  });

  it('rejects non-object (string)', () => {
    expect(RollingBucketSchema.safeParse('not an object').success).toBe(false);
  });

  it('rejects non-object (null)', () => {
    expect(RollingBucketSchema.safeParse(null).success).toBe(false);
  });

  it('rejects non-object (array)', () => {
    expect(RollingBucketSchema.safeParse([1, 2, 3]).success).toBe(false);
  });

  it('strips unknown extra fields', () => {
    const result = RollingBucketSchema.safeParse({
      W: 1,
      L: 0,
      K: 0,
      fights: 1,
      evil: 'inject',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toHaveProperty('evil');
    }
  });

  it('rejects NaN values', () => {
    const result = RollingBucketSchema.safeParse({ W: NaN, L: 0, K: 0, fights: 1 });
    expect(result.success).toBe(false);
  });

  it('rejects Infinity values', () => {
    const result = RollingBucketSchema.safeParse({ W: Infinity, L: 0, K: 0, fights: 1 });
    expect(result.success).toBe(false);
  });
});
