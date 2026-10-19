/**
 * entityIndex — the unified, cached entity lookup + search corpus.
 * Replaces the parallel `buildWarriorMap` index and extends `findWarrior`
 * with substring search over warriors, stables, promoters, and trainers.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  searchEntities,
  getWarriorIndex,
  ensureEntityIndex,
  clearEntityIndexCaches,
} from '@/engine/core/entityIndex';
import {
  makeWarrior,
  makeRival,
  makeOwner,
  makePromoter,
  makeTrainer,
} from '@/test/_fixtures/factories';
import type { WarriorId, StableId, PromoterId } from '@/types/shared.types';

function makeState(over: Record<string, unknown> = {}) {
  return {
    player: { id: 'p1', stableName: 'Crimson House', name: 'Player Name' },
    roster: [] as any[],
    graveyard: [] as any[],
    retired: [] as any[],
    rivals: [] as any[],
    promoters: {} as Record<string, any>,
    trainers: [] as any[],
    ...over,
  };
}

function namedWarrior(id: string, name: string, over: Record<string, unknown> = {}) {
  return makeWarrior({ id: id as WarriorId, name, ...over });
}

describe('entityIndex — corpus coverage', () => {
  beforeEach(() => clearEntityIndexCaches());

  it('indexes warriors from roster, graveyard, retired, and rival rosters', () => {
    const s = makeState({
      roster: [namedWarrior('w-1', 'Alice')],
      graveyard: [namedWarrior('w-2', 'Dead Bob', { status: 'Dead' })],
      retired: [namedWarrior('w-3', 'Old Carol', { status: 'Retired' })],
      rivals: [
        makeRival({
          id: 'r1' as StableId,
          owner: makeOwner({ id: 'r1' as StableId, stableName: 'Iron Wolves' }),
          roster: [namedWarrior('w-4', 'Rival Dave')],
        }),
      ],
    });
    const index = ensureEntityIndex(s as never);
    for (const id of ['w-1', 'w-2', 'w-3', 'w-4']) {
      expect(index.warriorById.has(id), id).toBe(true);
    }
  });

  it('indexes player and rival stables', () => {
    const s = makeState({
      rivals: [
        makeRival({
          id: 'r1' as StableId,
          owner: makeOwner({ id: 'r1' as StableId, stableName: 'Iron Wolves' }),
        }),
      ],
    });
    const index = ensureEntityIndex(s as never);
    expect(index.stableIdByName.get('Iron Wolves')).toBe('r1');
    expect(index.stableIdByName.get('Crimson House')).toBe('p1');
  });

  it('corpus excludes freeAgents and recruitPool (no detail route)', () => {
    const s = makeState({
      freeAgents: [namedWarrior('fa-1', 'Free Agent Fred')],
      recruitPool: [namedWarrior('rp-1', 'Recruit Rick')],
      roster: [namedWarrior('w-1', 'Alice')],
    });
    const index = ensureEntityIndex(s as never);
    expect(index.corpus.some((e) => e.id === 'fa-1')).toBe(false);
    expect(index.corpus.some((e) => e.id === 'rp-1')).toBe(false);
    expect(index.warriorById.has('fa-1')).toBe(false);
  });

  it('corpus includes promoters and trainers with detail routes', () => {
    const s = makeState({
      promoters: { pr1: makePromoter({ id: 'pr1' as PromoterId, name: 'Golden Gaius' }) },
      trainers: [makeTrainer({ id: 'tr1', name: 'Old Man Murgo' })],
    });
    const index = ensureEntityIndex(s as never);
    const promoter = index.corpus.find((e) => e.type === 'promoter');
    const trainer = index.corpus.find((e) => e.type === 'trainer');
    expect(promoter?.to).toBe('/stable/promoter/pr1');
    expect(trainer?.to).toBe('/stable/trainers');
  });
});

describe('entityIndex — badges and subtitles', () => {
  beforeEach(() => clearEntityIndexCaches());

  it('assigns badges by source bucket regardless of w.status', () => {
    const s = makeState({
      roster: [namedWarrior('w-1', 'Alice')],
      graveyard: [namedWarrior('w-2', 'Dead Bob')],
      retired: [namedWarrior('w-3', 'Old Carol')],
      rivals: [
        makeRival({
          id: 'r1' as StableId,
          owner: makeOwner({ id: 'r1' as StableId, stableName: 'Iron Wolves' }),
          roster: [namedWarrior('w-4', 'Dave')],
        }),
      ],
    });
    const index = ensureEntityIndex(s as never);
    const badgeOf = (id: string) => index.corpus.find((e) => e.id === id)?.badge;
    expect(badgeOf('w-1')).toBe('Yours');
    expect(badgeOf('w-2')).toBe('Fallen');
    expect(badgeOf('w-3')).toBe('Retired');
    expect(badgeOf('w-4')).toBe('Rival');
  });

  it('warrior subtitles carry style, record, and stable name', () => {
    const s = makeState({
      roster: [
        namedWarrior('w-1', 'Alice', {
          career: { wins: 12, losses: 3, kills: 1 },
        }),
      ],
    });
    const index = ensureEntityIndex(s as never);
    const entry = index.corpus.find((e) => e.id === 'w-1');
    expect(entry?.subtitle).toContain('12W');
    expect(entry?.subtitle).toContain('3L');
    expect(entry?.subtitle).toContain('Crimson House');
  });

  it('player stable entry routes to the roster page', () => {
    const s = makeState();
    const index = ensureEntityIndex(s as never);
    const entry = index.corpus.find((e) => e.type === 'stable' && e.id === 'p1');
    expect(entry?.to).toBe('/stable/roster');
    expect(entry?.badge).toBe('Yours');
  });
});

describe('searchEntities — ranking and matching', () => {
  beforeEach(() => clearEntityIndexCaches());

  const state = makeState({
    roster: [
      namedWarrior('w-1', 'Karg'),
      namedWarrior('w-2', 'Kargoth the Red'),
      namedWarrior('w-3', 'Morga Kargson'),
    ],
    rivals: [
      makeRival({
        id: 'r1' as StableId,
        owner: makeOwner({ id: 'r1' as StableId, stableName: 'Kargil Blades' }),
      }),
    ],
  });

  it('ranks exact > name-prefix > word-prefix > substring', () => {
    // 'karg' → w-1 exact; r1 + w-2 name-prefix ('Kargil…' < 'Kargoth…');
    // w-3 word-prefix ('Kargson' is a later word in 'Morga Kargson').
    const results = searchEntities(state as never, 'karg');
    expect(results.map((r) => r.id)).toEqual(['w-1', 'r1', 'w-2', 'w-3']);
  });

  it('matches epithet, style display name, and stable name via searchText', () => {
    const s = makeState({
      roster: [namedWarrior('w-1', 'Alice', { epithet: 'the Red' })],
      rivals: [
        makeRival({
          id: 'r1' as StableId,
          owner: makeOwner({ id: 'r1' as StableId, stableName: 'Iron Wolves' }),
          roster: [namedWarrior('w-2', 'Dave')],
        }),
      ],
    });
    expect(searchEntities(s as never, 'red').some((e) => e.id === 'w-1')).toBe(true);
    expect(searchEntities(s as never, 'iron wolves').some((e) => e.id === 'w-2')).toBe(true);
  });

  it('returns both duplicates when names collide across pools', () => {
    const s = makeState({
      roster: [namedWarrior('w-1', 'Twin')],
      graveyard: [namedWarrior('w-2', 'Twin', { status: 'Dead' })],
    });
    const results = searchEntities(s as never, 'twin');
    expect(results.map((r) => r.id).sort()).toEqual(['w-1', 'w-2']);
  });

  it('honors the limit and returns [] for blank queries', () => {
    const s = makeState({
      roster: Array.from({ length: 20 }, (_, i) => namedWarrior(`w-${i}`, `Fighter ${i}`)),
    });
    expect(searchEntities(s as never, 'fighter', 5)).toHaveLength(5);
    expect(searchEntities(s as never, '')).toEqual([]);
    expect(searchEntities(s as never, '   ')).toEqual([]);
  });
});

describe('getWarriorIndex / cache identity', () => {
  beforeEach(() => clearEntityIndexCaches());

  it('covers all four pools and returns the same Map for the same state object', () => {
    const s = makeState({
      roster: [namedWarrior('w-1', 'A')],
      graveyard: [namedWarrior('w-2', 'B')],
      rivals: [
        makeRival({
          id: 'r1' as StableId,
          owner: makeOwner({ id: 'r1' as StableId, stableName: 'X' }),
          roster: [namedWarrior('w-3', 'C')],
        }),
      ],
    });
    const first = getWarriorIndex(s as never);
    const second = getWarriorIndex(s as never);
    expect(first).toBe(second);
    expect(first.size).toBe(3);
  });

  it('returns the same corpus array across calls for the same state object', () => {
    const s = makeState({ roster: [namedWarrior('w-1', 'A')] });
    expect(ensureEntityIndex(s as never).corpus).toBe(ensureEntityIndex(s as never).corpus);
  });
});

describe('livingWarriorById — combat-eligible lookup (V16/F1)', () => {
  beforeEach(() => clearEntityIndexCaches());

  it('indexes player roster and rival rosters only', () => {
    const s = makeState({
      roster: [namedWarrior('w-1', 'Alice')],
      graveyard: [namedWarrior('w-2', 'Dead Bob', { status: 'Dead' })],
      retired: [namedWarrior('w-3', 'Old Carol', { status: 'Retired' })],
      rivals: [
        makeRival({
          id: 'r1' as StableId,
          owner: makeOwner({ id: 'r1' as StableId, stableName: 'Iron Wolves' }),
          roster: [namedWarrior('w-4', 'Rival Dave')],
        }),
      ],
    });
    const index = ensureEntityIndex(s as never);
    expect(index.livingWarriorById.get('w-1')?.name).toBe('Alice');
    expect(index.livingWarriorById.get('w-4')?.name).toBe('Rival Dave');
    expect(index.livingWarriorById.has('w-2'), 'graveyard excluded').toBe(false);
    expect(index.livingWarriorById.has('w-3'), 'retired excluded').toBe(false);
  });

  it('dead warriors still appear in the all-warriors index but never the living one', () => {
    const s = makeState({
      graveyard: [namedWarrior('w-dead', 'Fallen', { status: 'Dead' })],
    });
    const index = ensureEntityIndex(s as never);
    expect(index.warriorById.has('w-dead')).toBe(true);
    expect(index.livingWarriorById.has('w-dead')).toBe(false);
  });
});
