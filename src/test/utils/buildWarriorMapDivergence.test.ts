import { describe, it, expect } from 'vitest';
import { buildActiveWarriorMap as buildWarriorMapRoster } from '@/utils/roster';
import { buildWarriorMap as buildWarriorMapCollection } from '@/engine/core/warriorCollection';
import type { GameState, Warrior } from '@/types/state.types';
import type { WarriorId } from '@/types/shared.types';

function makeWarrior(id: string, name: string, status: Warrior['status'] = 'Active'): Warrior {
  return {
    id: id as WarriorId,
    name,
    status,
    fame: 0,
    xp: 0,
  } as unknown as Warrior;
}

function makeState(opts: {
  roster?: Warrior[];
  graveyard?: Warrior[];
  retired?: Warrior[];
  rivals?: { roster: Warrior[] }[];
}): GameState {
  return {
    roster: opts.roster ?? [],
    graveyard: opts.graveyard ?? [],
    retired: opts.retired ?? [],
    rivals: opts.rivals ?? [],
  } as unknown as GameState;
}

describe('buildWarriorMap divergence characterization', () => {
  it('both return identical results when graveyard and retired are empty', () => {
    const state = makeState({
      roster: [makeWarrior('w-1', 'Alice'), makeWarrior('w-2', 'Bob')],
      rivals: [{ roster: [makeWarrior('w-3', 'Charlie')] }],
    });

    const mapRoster = buildWarriorMapRoster(state);
    const mapCollection = buildWarriorMapCollection(state);

    expect([...mapRoster.keys()].sort()).toEqual([...mapCollection.keys()].sort());
  });

  it('roster.ts version EXCLUDES graveyard and retired warriors', () => {
    const state = makeState({
      roster: [makeWarrior('w-1', 'Alice')],
      graveyard: [makeWarrior('w-dead', 'Dead Dave', 'Dead')],
      retired: [makeWarrior('w-retired', 'Retired Ray', 'Retired')],
    });

    const map = buildWarriorMapRoster(state);

    expect(map.has('w-1')).toBe(true);
    expect(map.has('w-dead')).toBe(false);
    expect(map.has('w-retired')).toBe(false);
    expect(map.size).toBe(1);
  });

  it('warriorCollection.ts version INCLUDES graveyard and retired warriors', () => {
    const state = makeState({
      roster: [makeWarrior('w-1', 'Alice')],
      graveyard: [makeWarrior('w-dead', 'Dead Dave', 'Dead')],
      retired: [makeWarrior('w-retired', 'Retired Ray', 'Retired')],
    });

    const map = buildWarriorMapCollection(state);

    expect(map.has('w-1')).toBe(true);
    expect(map.has('w-dead')).toBe(true);
    expect(map.has('w-retired')).toBe(true);
    expect(map.size).toBe(3);
  });

  it('divergence is documented: different sizes when dead/retired exist', () => {
    const state = makeState({
      roster: [makeWarrior('w-1', 'Alice')],
      graveyard: [makeWarrior('w-dead', 'Dead Dave', 'Dead')],
      retired: [makeWarrior('w-retired', 'Retired Ray', 'Retired')],
      rivals: [{ roster: [makeWarrior('w-rival', 'Rival Ron')] }],
    });

    const mapRoster = buildWarriorMapRoster(state);
    const mapCollection = buildWarriorMapCollection(state);

    expect(mapRoster.size, 'roster.ts misses dead/retired').toBe(2);
    expect(mapCollection.size, 'warriorCollection.ts includes all').toBe(4);
    expect(mapCollection.size).toBeGreaterThan(mapRoster.size);
  });

  it('both include rival roster warriors', () => {
    const state = makeState({
      roster: [makeWarrior('w-1', 'Alice')],
      rivals: [
        { roster: [makeWarrior('w-r1', 'Rival1')] },
        { roster: [makeWarrior('w-r2', 'Rival2')] },
      ],
    });

    const mapRoster = buildWarriorMapRoster(state);
    const mapCollection = buildWarriorMapCollection(state);

    expect(mapRoster.has('w-r1')).toBe(true);
    expect(mapRoster.has('w-r2')).toBe(true);
    expect(mapCollection.has('w-r1')).toBe(true);
    expect(mapCollection.has('w-r2')).toBe(true);
  });

  it('both handle empty state gracefully', () => {
    const state = makeState({});

    const mapRoster = buildWarriorMapRoster(state);
    const mapCollection = buildWarriorMapCollection(state);

    expect(mapRoster.size).toBe(0);
    expect(mapCollection.size).toBe(0);
  });

  it('both handle undefined rivals gracefully', () => {
    const state = makeState({
      roster: [makeWarrior('w-1', 'Alice')],
    });

    const mapRoster = buildWarriorMapRoster(state);
    const mapCollection = buildWarriorMapCollection(state);

    expect(mapRoster.size).toBe(1);
    expect(mapCollection.size).toBe(1);
  });
});
