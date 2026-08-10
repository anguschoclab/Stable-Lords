/**
 * Stats and metrics Zod schemas (style rollups, rolling windows, tournament tracking).
 */
import { z } from 'zod';

/**
 * Bucket schema — week-based rollup entry per style.
 */
export const BucketSchema = z.object({
  w: z.number(),
  l: z.number(),
  k: z.number(),
  pct: z.number(),
  fights: z.number(),
});

/**
 * RollingBucket schema — rolling window and tournament entry per style.
 */
export const RollingBucketSchema = z.object({
  W: z.number(),
  L: z.number(),
  K: z.number(),
  fights: z.number(),
});
