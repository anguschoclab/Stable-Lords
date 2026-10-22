import { describe, it, expect } from 'vitest';
import { buildStableRows, buildWarriorRows } from '@/pages/worldOverview/rows';
import type { StableTemplate } from '@/data/templates/stableTemplate.types';
import type { StableId, WarriorId } from '@/types/shared.types';
import { makeWarrior, makeRival, makeOwner } from '@/test/_fixtures/factories';

/** Characterization pins for the in-loop find() → indexBy refactor. */
describe('buildStableRows', () => {
  const playerWarrior = makeWarrior({ id: 'pw1' as WarriorId, career: { wins: 4, losses: 1, kills: 1 } });
  const rivalWarrior = makeWarrior({ id: 'rw1' as WarriorId, career: { wins: 2, losses: 3, kills: 0 } });
  const rival = makeRival({
    id: 'r1' as StableId,
    owner: makeOwner({ id: 'r1' as StableId, stableName: 'Dark Legion', name: 'Morgath' }),
    roster: [rivalWarrior],
    tier: 'Major',
  });
  const state = {
    roster: [playerWarrior],
    player: { id: 'player-1', name: 'You', stableName: 'Home Stable' },
    rivals: [rival],
    fame: 500,
  };

  it('resolves rival mottos from the template matched by stableName', () => {
    const templates = [{ stableName: 'Dark Legion', motto: 'Death Before Dishonor' }] as StableTemplate[];
    const rows = buildStableRows(state, { field: 'name', dir: 'asc' }, templates);
    const rivalRow = rows.find((r) => r.id === 'r1')!;
    expect(rivalRow.motto).toBe('Death Before Dishonor');
    expect(rivalRow.tier).toBe('Major');
  });

  it('falls back to an empty motto when no template matches', () => {
    const rows = buildStableRows(state, { field: 'name', dir: 'asc' }, [] as StableTemplate[]);
    expect(rows.find((r) => r.id === 'r1')!.motto).toBe('');
  });

  it('first template wins when two templates share a stableName (find semantics)', () => {
    const templates = [
      { stableName: 'Dark Legion', motto: 'FIRST' },
      { stableName: 'Dark Legion', motto: 'SECOND' },
    ] as StableTemplate[];
    const rows = buildStableRows(state, { field: 'name', dir: 'asc' }, templates);
    expect(rows.find((r) => r.id === 'r1')!.motto).toBe('FIRST');
  });

  it('aggregates career stats and counts only active warriors', () => {
    const injured = makeWarrior({ id: 'rw2' as WarriorId, status: 'Injured' as any });
    const s = {
      ...state,
      rivals: [makeRival({ id: 'r2' as StableId, owner: makeOwner({ id: 'r2' as StableId }), roster: [rivalWarrior, injured] })],
    };
    const rows = buildStableRows(s, { field: 'wins', dir: 'desc' }, []);
    expect(rows[0]!.isPlayer).toBe(true);
    expect(rows[0]!.wins).toBe(4);
    const r2 = rows.find((r) => r.id === 'r2')!;
    expect(r2.wins).toBe(2);
    expect(r2.roster).toBe(1); // only the active warrior counts
  });
});

describe('buildWarriorRows', () => {
  const playerWarrior = makeWarrior({ id: 'pw1' as WarriorId, name: 'Alpha', career: { wins: 5, losses: 0, kills: 2 } });
  const rivalWarrior = makeWarrior({ id: 'rw1' as WarriorId, name: 'Beta', career: { wins: 1, losses: 4, kills: 0 } });
  const deadWarrior = makeWarrior({ id: 'dw1' as WarriorId, status: 'Dead' as any });
  const rival = makeRival({
    id: 'r1' as StableId,
    owner: makeOwner({ id: 'r1' as StableId, stableName: 'Dark Legion' }),
    roster: [rivalWarrior, deadWarrior],
  });
  const state = {
    roster: [playerWarrior],
    player: { id: 'player-1', name: 'You', stableName: 'Home Stable' },
    rivals: [rival],
    fame: 0,
    realmRankings: {
      pw1: { overallRank: 2, compositeScore: 80 },
      rw1: { overallRank: 1, compositeScore: 95 },
    },
  };

  it('excludes inactive warriors and sorts by officialRank on the default fame sort', () => {
    const rows = buildWarriorRows(state, { field: 'fame', dir: 'desc' });
    expect(rows.map((r) => r.id)).toEqual(['rw1', 'pw1']);
    expect(rows.find((r) => r.id === 'rw1')!.stableName).toBe('Dark Legion');
    expect(rows.find((r) => r.id === 'rw1')!.officialRank).toBe(1);
  });

  it('unranked warriors sort last via the 999 sentinel', () => {
    const rows = buildWarriorRows(
      { ...state, realmRankings: undefined },
      { field: 'fame', dir: 'desc' }
    );
    for (const r of rows) expect(r.officialRank).toBe(999);
  });
});
