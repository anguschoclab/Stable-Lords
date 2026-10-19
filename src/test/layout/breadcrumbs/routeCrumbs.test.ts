/**
 * routeCrumbs — canonical breadcrumb chains per detail route.
 * Absorbs the old getWarriorReturnContext cases: the parent is derived
 * from entity ownership, not from where the user happened to come from.
 */
import { describe, it, expect } from 'vitest';
import { getCanonicalCrumbs } from '@/components/layout/breadcrumbs/routeCrumbs';
import {
  makeWarrior,
  makeRival,
  makeOwner,
  makePromoter,
  makeGameState,
} from '@/test/_fixtures/factories';
import type { WarriorId, StableId, PromoterId } from '@/types/shared.types';

function makeState(over: Record<string, unknown> = {}) {
  return makeGameState({
    player: { id: 'p1', stableName: 'Crimson House', name: 'Player' },
    roster: [] as never[],
    graveyard: [] as never[],
    retired: [] as never[],
    rivals: [] as never[],
    promoters: {} as Record<string, never>,
    ...over,
  });
}

const w = (id: string, over: Record<string, unknown> = {}) =>
  makeWarrior({ id: id as WarriorId, ...over });

describe('getCanonicalCrumbs — /warrior/$id', () => {
  it('player-owned warrior → Stable › Roster › name', () => {
    const s = makeState({ roster: [w('w-1', { name: 'Alice' })] });
    const crumbs = getCanonicalCrumbs('/warrior/w-1', s as never)!;
    expect(crumbs.map((c) => c.label)).toEqual(['Stable', 'Roster', 'Alice']);
    expect(crumbs[1]?.to).toBe('/stable/roster');
    expect(crumbs[2]?.to).toBeUndefined();
  });

  it('rival warrior → World › Scouting › {stable} › name', () => {
    const s = makeState({
      rivals: [
        makeRival({
          id: 'r1' as StableId,
          owner: makeOwner({ id: 'r1' as StableId, stableName: 'Iron Wolves' }),
          roster: [w('w-9', { name: 'Bob' })],
        }),
      ],
    });
    const crumbs = getCanonicalCrumbs('/warrior/w-9', s as never)!;
    expect(crumbs.map((c) => c.label)).toEqual(['World', 'Scouting', 'Iron Wolves', 'Bob']);
    expect(crumbs[2]?.to).toBe('/world/stable/r1');
  });

  it('graveyard warrior → World › Graveyard › name', () => {
    const s = makeState({ graveyard: [w('w-2', { name: 'Dead Dave' })] });
    const crumbs = getCanonicalCrumbs('/warrior/w-2', s as never)!;
    expect(crumbs.map((c) => c.label)).toEqual(['World', 'Graveyard', 'Dead Dave']);
    expect(crumbs[1]?.to).toBe('/world/graveyard');
  });

  it('retired warrior → World › Hall of Fame › name', () => {
    const s = makeState({ retired: [w('w-3', { name: 'Old Ray' })] });
    const crumbs = getCanonicalCrumbs('/warrior/w-3', s as never)!;
    expect(crumbs.map((c) => c.label)).toEqual(['World', 'Hall of Fame', 'Old Ray']);
    expect(crumbs[1]?.to).toBe('/world/history');
  });

  it('unknown warrior → World › Scouting fallback', () => {
    const s = makeState();
    const crumbs = getCanonicalCrumbs('/warrior/ghost', s as never)!;
    expect(crumbs.map((c) => c.label)).toEqual(['World', 'Scouting', 'Unknown Warrior']);
    expect(crumbs[1]?.to).toBe('/world/scouting');
  });
});

describe('getCanonicalCrumbs — other detail routes', () => {
  it('/world/stable/$id → World › Scouting › stable name', () => {
    const s = makeState({
      rivals: [
        makeRival({
          id: 'r1' as StableId,
          owner: makeOwner({ id: 'r1' as StableId, stableName: 'Iron Wolves' }),
        }),
      ],
    });
    const crumbs = getCanonicalCrumbs('/world/stable/r1', s as never)!;
    expect(crumbs.map((c) => c.label)).toEqual(['World', 'Scouting', 'Iron Wolves']);
    expect(crumbs[1]?.to).toBe('/world/scouting');
  });

  it('/world/arenas/$arenaId → World › Arenas › arena name', () => {
    const s = makeState();
    const crumbs = getCanonicalCrumbs('/world/arenas/pit-of-kings', s as never);
    expect(crumbs).not.toBeNull();
    expect(crumbs?.[0]?.label).toBe('World');
    expect(crumbs?.[1]?.label).toBe('Arenas');
    expect(crumbs?.[1]?.to).toBe('/world/arenas');
  });

  it('/stable/promoter/$id → Stable › Promoters › promoter name', () => {
    const s = makeState({
      promoters: { pr1: makePromoter({ id: 'pr1' as PromoterId, name: 'Golden Gaius' }) },
    });
    const crumbs = getCanonicalCrumbs('/stable/promoter/pr1', s as never)!;
    expect(crumbs.map((c) => c.label)).toEqual(['Stable', 'Promoters', 'Golden Gaius']);
    expect(crumbs[1]?.to).toBe('/stable/promoters');
  });
});

describe('getCanonicalCrumbs — non-detail routes', () => {
  it.each(['/stable', '/stable/roster', '/world', '/world/scouting', '/', '/bookmarks'])(
    '%s → null',
    (path) => {
      expect(getCanonicalCrumbs(path, makeState() as never)).toBeNull();
    }
  );
});
