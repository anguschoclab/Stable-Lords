import { vi } from 'vitest';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import type { OffseasonEventContext } from '@/engine/pipeline/offseasonEvents/types';

/** Deterministic stub RNG for offseason handler tests (pick→first, next→0.5, roll→min). */
export const makeStubRng = (over: Record<string, unknown> = {}): IRNGService =>
  ({
    pick: vi.fn((arr: readonly any[]) => arr[0]),
    next: () => 0.5,
    uuid: () => 'uuid-1',
    roll: (min: number) => min,
    ...over,
  }) as unknown as IRNGService;

/** Empty OffseasonEventContext collector for handler tests. */
export const makeOffseasonCtx = (
  over: Partial<OffseasonEventContext> = {}
): OffseasonEventContext =>
  ({
    rosterUpdates: new Map(),
    newsletterItems: [],
    ledgerEntries: [],
    insightTokens: [],
    treasuryDelta: 0,
    ...over,
  }) as OffseasonEventContext;
