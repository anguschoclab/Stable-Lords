/**
 * buildResolutionPayload — pendingResolutionData carries warrior refs.
 */
import { describe, it, expect } from 'vitest';
import { buildResolutionPayload } from '@/state/resolutionPayload';
import type { GameState } from '@/types/state.types';

describe('buildResolutionPayload', () => {
  it('carries death/injury warrior refs through to pendingResolutionData', () => {
    const display: NonNullable<GameState['lastWeekBoutDisplay']> = {
      results: [],
      deaths: [{ id: 'w1' as never, name: 'Alpha' }],
      injuries: [{ id: 'w2' as never, name: 'Beta' }],
    };

    const payload = buildResolutionPayload(display, [], 5);

    expect(payload.deaths).toEqual([{ id: 'w1', name: 'Alpha' }]);
    expect(payload.injuries).toEqual([{ id: 'w2', name: 'Beta' }]);
    expect(payload.promotions).toEqual([]);
  });

  it('defaults to empty ref arrays when no display data is stashed', () => {
    const payload = buildResolutionPayload(undefined, [], 5);

    expect(payload.deaths).toEqual([]);
    expect(payload.injuries).toEqual([]);
    expect(payload.bouts).toEqual([]);
  });

  it('filters gazette items to the resolved week', () => {
    const items = [
      { id: 'n1', week: 5, headline: 'This week' },
      { id: 'n2', week: 4, headline: 'Last week' },
    ] as never[];

    const payload = buildResolutionPayload(undefined, items, 5);

    expect(payload.gazette).toHaveLength(1);
    expect(payload.gazette[0]).toMatchObject({ id: 'n1' });
  });
});
