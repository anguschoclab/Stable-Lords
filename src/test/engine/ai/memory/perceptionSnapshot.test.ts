/**
 * Perception snapshot — pins every shared field against the independent
 * per-call computation it replaces. If a snapshot field ever disagrees with
 * the inline recomputation, a rival reading the snapshot perceives a
 * different world than one recomputing it — a silent AI divergence.
 */
import { describe, it, expect } from 'vitest';
import { buildPerceptionSnapshot } from '@/engine/ai/memory/perceptionSnapshot';
import { computeMetaDrift } from '@/engine/analytics/metaDrift';
import { getFightsForWeek } from '@/engine/core/historyUtils';
import { isActive } from '@/engine/warrior/warriorStatus';
import { buildContenderIndex } from '@/engine/championship/arenaChampionship';
import { makeGameState, makeRival, makeWarrior } from '@/test/_fixtures/factories';
import type { FightSummary } from '@/types/state.types';
import type { StableId, WarriorId } from '@/types/shared.types';

const fight = (a: string, d: string, week: number): FightSummary =>
  ({
    id: `f_${a}_${d}`,
    week,
    absoluteWeek: week,
    warriorIdA: a as WarriorId,
    warriorIdD: d as WarriorId,
    winner: 'A',
    by: 'KO',
  }) as FightSummary;

function populatedState() {
  const wA = makeWarrior({ id: 'wA' as WarriorId });
  const wB = makeWarrior({ id: 'wB' as WarriorId });
  const wP = makeWarrior({ id: 'wP' as WarriorId });
  const rivalA = makeRival({ id: 'rA' as StableId, roster: [wA], fame: 300 });
  const rivalB = makeRival({ id: 'rB' as StableId, roster: [wB], fame: 100 });
  return makeGameState({
    absoluteWeek: 7,
    week: 7,
    rivals: [rivalA, rivalB],
    roster: [wP],
    arenaHistory: [fight('wA', 'wP', 7), fight('wB', 'wX', 6)],
    arenaChampions: {
      arena_1: { champion: { warriorId: 'wA' as WarriorId }, status: 'active' },
      arena_2: { champion: { warriorId: 'wB' as WarriorId }, status: 'dormant' },
    } as never,
    realmRankings: {
      wP: { overallRank: 2, classRank: 1, compositeScore: 90 },
      wA: { overallRank: 1, classRank: 1, compositeScore: 95 },
    } as never,
  });
}

describe('buildPerceptionSnapshot — field parity', () => {
  it('meta is the cached drift when present, else computed from history', () => {
    const state = populatedState();
    expect(buildPerceptionSnapshot(state).meta).toEqual(computeMetaDrift(state.arenaHistory ?? []));
    const cached = { STRIKING_ATTACK: 9 } as never;
    const withCache = { ...state, cachedMetaDrift: cached };
    expect(buildPerceptionSnapshot(withCache).meta).toBe(cached);
  });

  it('weekFights equals getFightsForWeek on the state history', () => {
    const state = populatedState();
    const snap = buildPerceptionSnapshot(state);
    expect(snap.weekFights).toEqual(getFightsForWeek(state.arenaHistory ?? [], state.absoluteWeek));
  });

  it('activeRosterSize counts isActive warriors per stable + player', () => {
    const state = populatedState();
    const snap = buildPerceptionSnapshot(state);
    for (const r of state.rivals ?? []) {
      expect(snap.activeRosterSize.get(r.id)).toBe(
        r.roster.reduce((c, w) => (isActive(w) ? c + 1 : c), 0)
      );
    }
    expect(snap.activeRosterSize.get(state.player.id)).toBe(
      (state.roster ?? []).reduce((c, w) => (isActive(w) ? c + 1 : c), 0)
    );
  });

  it('rankingsByWarrior mirrors state.realmRankings entries', () => {
    const state = populatedState();
    const snap = buildPerceptionSnapshot(state);
    for (const [id, entry] of Object.entries(state.realmRankings ?? {})) {
      expect(snap.rankingsByWarrior.get(id as WarriorId)).toEqual(entry);
    }
    expect(snap.rankingsByWarrior.size).toBe(Object.keys(state.realmRankings ?? {}).length);
  });

  it('championByArena / arenasHeldByChampion index arenaChampions regardless of status', () => {
    const state = populatedState();
    const snap = buildPerceptionSnapshot(state);
    expect(snap.championByArena.get('arena_1')).toBe('wA');
    expect(snap.championByArena.get('arena_2')).toBe('wB');
    expect(snap.arenasHeldByChampion.get('wA' as WarriorId)).toEqual(['arena_1']);
    expect(snap.arenasHeldByChampion.get('wB' as WarriorId)).toEqual(['arena_2']);
  });

  it('contenderIndexByArena matches buildContenderIndex output', () => {
    const state = populatedState();
    expect(buildPerceptionSnapshot(state).contenderIndexByArena).toEqual(
      buildContenderIndex(state)
    );
  });

  it('player summary + absoluteWeek mirror state fields', () => {
    const state = populatedState();
    const snap = buildPerceptionSnapshot(state);
    expect(snap.player.stableId).toBe(state.player.id);
    expect(snap.player.activeRosterSize).toBe(snap.activeRosterSize.get(state.player.id));
    expect(snap.absoluteWeek).toBe(state.absoluteWeek);
  });

  it('is deterministic — identical state produces an identical snapshot', () => {
    const state = populatedState();
    expect(buildPerceptionSnapshot(state)).toEqual(buildPerceptionSnapshot(state));
  });
});

describe('buildPerceptionSnapshot — B5 shared fields (equivalence pins)', () => {
  it('playerThreatLevel equals computePlayerThreatLevel(state)', async () => {
    const { computePlayerThreatLevel } = await import('@/engine/ai/agentCore');
    const state = populatedState();
    expect(buildPerceptionSnapshot(state).playerThreatLevel).toBe(
      computePlayerThreatLevel(state)
    );
  });

  it('threatByStableId holds the estimateThreat value for every rival id + player id', async () => {
    const { estimateThreat } = await import('@/engine/ai/memory/intelDossier');
    const state = populatedState();
    const snap = buildPerceptionSnapshot(state);
    const week = state.absoluteWeek ?? state.week;
    for (const r of state.rivals ?? []) {
      expect(snap.threatByStableId.get(r.id)).toBe(
        estimateThreat(r.id, r.fame ?? r.owner.fame ?? 0, week)
      );
    }
    expect(snap.threatByStableId.get(state.player.id)).toBe(
      estimateThreat(state.player.id, state.fame ?? 0, week)
    );
  });

  it('weekFightStableOf resolves every weekFights participant incl. misses to undefined', async () => {
    const { resolveWarriorOwner } = await import('@/engine/core/warriorOwnership');
    const state = populatedState();
    const snap = buildPerceptionSnapshot(state);
    for (const f of snap.weekFights) {
      for (const wid of [f.warriorIdA, f.warriorIdD]) {
        expect(snap.weekFightStableOf.has(wid), `missing key ${wid}`).toBe(true);
        expect(snap.weekFightStableOf.get(wid)).toBe(
          resolveWarriorOwner(state, wid)?.stableId
        );
      }
    }
  });

  it('knownRivalOwnerIds lists every rival owner.id in declaration order', () => {
    const state = populatedState();
    expect(buildPerceptionSnapshot(state).knownRivalOwnerIds).toEqual(
      (state.rivals ?? []).map((r) => r.owner.id)
    );
  });

  it('laggedMetaByLag.get(1|2) equals filter+computeMetaDrift at the cutoff', () => {
    const state = populatedState();
    const snap = buildPerceptionSnapshot(state);
    for (const lag of [1, 2]) {
      const cutoff = (state.absoluteWeek ?? state.week) - lag;
      const expected = computeMetaDrift(
        (state.arenaHistory ?? []).filter((f) => (f.absoluteWeek ?? f.week) <= cutoff)
      );
      expect(snap.laggedMetaByLag.get(lag), `lag ${lag}`).toEqual(expected);
    }
  });

  it('signedUpcomingTitleIds holds warriors of signed upcoming title bouts only', () => {
    const state = populatedState();
    state.boutOffers = {
      t1: {
        id: 't1',
        titleArenaId: 'arena_1',
        status: 'Signed',
        warriorIds: ['wA', 'wP'],
        boutWeek: 9,
        createdAbsoluteWeek: 7,
      },
      t2: {
        id: 't2',
        titleArenaId: 'arena_1',
        status: 'Proposed',
        warriorIds: ['wB', 'wP'],
        boutWeek: 9,
        createdAbsoluteWeek: 7,
      },
      t3: {
        id: 't3',
        titleArenaId: 'arena_2',
        status: 'Signed',
        warriorIds: ['wB', 'wQ'],
        boutWeek: 6,
        createdAbsoluteWeek: 4,
      },
    } as never;
    const ids = buildPerceptionSnapshot(state).signedUpcomingTitleIds;
    // t1: signed title bout upcoming → both warriors. t2: Proposed → out.
    // t3: signed but past (boutWeek 6 < now 7 → createdAbsoluteWeek 4) → out.
    expect([...ids].sort()).toEqual(['wA', 'wP']);
  });
});
