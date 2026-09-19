/**
 * Stage B.0 — intelDossier: per-rival perception of other stables.
 * Observed facts (fights, styles) vs inferred beliefs (threat estimates that
 * decay toward uncertainty with staleness).
 */
import { describe, it, expect } from 'vitest';
import {
  updateDossiers,
  decayDossiers,
  DOSSIER_CAP,
} from '@/engine/ai/memory/intelDossier';
import {
  makeRival,
  makeWarrior,
  makeFightSummary,
  makeGameState,
} from '@/test/_fixtures/factories';
import type { OpponentDossier } from '@/types/state.types';
import type { StableId, WarriorId } from '@/types/shared.types';

const dossier = (over: Partial<OpponentDossier> = {}): OpponentDossier => ({
  lastSeenWeek: 1,
  knownStyles: [],
  estimatedThreat: 0.8,
  recordVs: { w: 0, l: 0, k: 0 },
  ...over,
});

describe('updateDossiers — fight observation', () => {
  it('writes exact recordVs for fights involving the stable', () => {
    const w1 = makeWarrior({ id: 'rw1' as WarriorId });
    const self = makeRival({ id: 'self-1' as StableId, roster: [w1] });
    const opp = makeRival({ id: 'opp-1' as StableId, roster: [makeWarrior({ id: 'ow1' as WarriorId })] });
    const state = makeGameState({
      rivals: [self, opp],
      absoluteWeek: 5,
      arenaHistory: [
        makeFightSummary({
          warriorIdA: 'rw1' as WarriorId,
          warriorIdD: 'ow1' as WarriorId,
          stableIdA: 'self-1' as StableId,
          stableIdD: 'opp-1' as StableId,
          winner: 'A',
          by: 'Kill',
          styleD: 'LungingAttack',
          absoluteWeek: 5,
        }),
      ],
    });

    const out = updateDossiers(self, state);
    const d = out['opp-1']!;
    expect(d).toBeDefined();
    expect(d.recordVs).toEqual({ w: 1, l: 0, k: 1 });
    expect(d.knownStyles).toContain('LungingAttack');
    expect(d.lastSeenWeek).toBe(5);
  });

  it('creates decayed estimates for observed-but-unfought stables', () => {
    const self = makeRival({ id: 'self-1' as StableId });
    const opp = makeRival({ id: 'opp-1' as StableId, fame: 250 });
    const state = makeGameState({ rivals: [self, opp], absoluteWeek: 3, arenaHistory: [] });

    const out = updateDossiers(self, state);
    const d = out['opp-1']!;
    expect(d).toBeDefined();
    expect(d.recordVs).toEqual({ w: 0, l: 0, k: 0 });
    expect(d.estimatedThreat).toBeGreaterThan(0);
    expect(d.estimatedThreat).toBeLessThanOrEqual(1);
    expect(d.lastSeenWeek).toBe(3);
  });

  it('includes the player stable as an observable opponent', () => {
    const self = makeRival({ id: 'self-1' as StableId });
    const state = makeGameState({ rivals: [self], absoluteWeek: 2, arenaHistory: [] });
    const out = updateDossiers(self, state);
    expect(out[state.player.id]).toBeDefined();
  });

  it('is deterministic for the same inputs', () => {
    const self = makeRival({ id: 'self-1' as StableId });
    const opp = makeRival({ id: 'opp-1' as StableId, fame: 300 });
    const state = makeGameState({ rivals: [self, opp], absoluteWeek: 4, arenaHistory: [] });
    expect(updateDossiers(self, state)).toEqual(updateDossiers(self, state));
  });
});

describe('decayDossiers — staleness', () => {
  it('regresses estimatedThreat toward uncertainty as weeks pass', () => {
    const dossiers = { 'opp-1': dossier({ lastSeenWeek: 1, estimatedThreat: 0.9 }) };
    const fresh = decayDossiers(dossiers, 1)['opp-1']!.estimatedThreat;
    const stale = decayDossiers(dossiers, 10)['opp-1']!.estimatedThreat;
    expect(fresh).toBeCloseTo(0.9, 5);
    expect(stale).toBeLessThan(fresh);
    expect(stale).toBeGreaterThan(0.4); // regresses toward 0.5, not 0
  });

  it('never mutates recordVs (observed facts are permanent)', () => {
    const dossiers = { 'opp-1': dossier({ lastSeenWeek: 1, recordVs: { w: 3, l: 1, k: 2 } }) };
    expect(decayDossiers(dossiers, 20)['opp-1']!.recordVs).toEqual({ w: 3, l: 1, k: 2 });
  });
});

describe('updateDossiers — cap', () => {
  it('keeps at most DOSSIER_CAP entries preferring recent + threatening', () => {
    const self = makeRival({ id: 'self-1' as StableId });
    const rivals = [self];
    for (let i = 0; i < DOSSIER_CAP + 5; i++) {
      rivals.push(makeRival({ id: `opp-${i}` as StableId, fame: i * 10 }));
    }
    const state = makeGameState({ rivals, absoluteWeek: 2, arenaHistory: [] });
    const out = updateDossiers(self, state);
    expect(Object.keys(out).length).toBeLessThanOrEqual(DOSSIER_CAP);
  });
});
