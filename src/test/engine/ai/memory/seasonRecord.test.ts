/**
 * Stage B.0 — updateSeasonRecord must roll up real bout outcomes into
 * agentMemory.seasonRecord (currently dead: never incremented anywhere).
 * Also covers the week-1 boundary reset + BOUT event rollup.
 */
import { describe, it, expect } from 'vitest';
import {
  updateSeasonRecord,
  recordBoutOutcome,
} from '@/engine/ai/memory/seasonRecord';
import { makeRival, makeWarrior, makeFightSummary } from '@/test/_fixtures/factories';
import type { WarriorId } from '@/types/shared.types';

const rosterWarrior = (id: string) => makeWarrior({ id: id as WarriorId });

describe('updateSeasonRecord', () => {
  it('accumulates wins, losses and kills from week fights', () => {
    const w1 = rosterWarrior('rw1');
    const w2 = rosterWarrior('rw2');
    const rival = makeRival({ roster: [w1, w2] });

    const fights = [
      makeFightSummary({ warriorIdA: 'rw1' as WarriorId, winner: 'A', by: 'KO' }),
      makeFightSummary({ warriorIdD: 'rw2' as WarriorId, winner: 'D', by: 'Kill' }),
      makeFightSummary({ warriorIdA: 'rw1' as WarriorId, winner: 'D', by: 'Decision' }),
    ];

    const out = updateSeasonRecord(rival, fights, 5);
    const rec = out.agentMemory!.seasonRecord!;
    expect(rec.wins).toBe(2);
    expect(rec.losses).toBe(1);
    expect(rec.kills).toBe(1); // only the Kill the rival's warrior inflicted
  });

  it('does not credit kills inflicted ON the rival', () => {
    const w1 = rosterWarrior('rw1');
    const rival = makeRival({ roster: [w1] });
    const fights = [
      makeFightSummary({ warriorIdA: 'rw1' as WarriorId, winner: 'D', by: 'Kill' }),
    ];
    const out = updateSeasonRecord(rival, fights, 5);
    expect(out.agentMemory!.seasonRecord!.kills).toBe(0);
    expect(out.agentMemory!.seasonRecord!.losses).toBe(1);
  });

  it('ignores fights that do not involve the stable', () => {
    const w1 = rosterWarrior('rw1');
    const rival = makeRival({ roster: [w1] });
    const fights = [
      makeFightSummary({ warriorIdA: 'other1' as WarriorId, warriorIdD: 'other2' as WarriorId, winner: 'A', by: 'Kill' }),
    ];
    const out = updateSeasonRecord(rival, fights, 5);
    const rec = out.agentMemory!.seasonRecord!;
    expect(rec.wins + rec.losses + rec.kills).toBe(0);
  });

  it('week-1 boundary resets the record but preserves prior season capture', () => {
    const w1 = rosterWarrior('rw1');
    const rival = makeRival({
      roster: [w1],
      agentMemory: {
        lastTreasury: 0,
        burnRate: 0,
        metaAwareness: {},
        knownRivals: [],
        opponentDossiers: {},
        seasonRecord: { wins: 7, losses: 3, kills: 2, rosterSizeAtSeasonStart: 4 },
      },
    });
    const fights = [
      makeFightSummary({ warriorIdA: 'rw1' as WarriorId, winner: 'A', by: 'KO' }),
    ];
    const out = updateSeasonRecord(rival, fights, 1);
    const mem = out.agentMemory!;
    expect(mem.lastSeasonRecord).toEqual({
      wins: 7,
      losses: 3,
      kills: 2,
      rosterSizeAtSeasonStart: 4,
    });
    expect(mem.seasonRecord!.wins).toBe(1); // week-1 bout counts toward NEW season
    expect(mem.seasonRecord!.losses).toBe(0);
  });

  it('initializes a missing seasonRecord on non-boundary weeks', () => {
    const w1 = rosterWarrior('rw1');
    const rival = makeRival({ roster: [w1] });
    rival.agentMemory = { ...rival.agentMemory!, seasonRecord: undefined };
    const out = updateSeasonRecord(rival, [], 4);
    expect(out.agentMemory!.seasonRecord).toEqual({
      wins: 0,
      losses: 0,
      kills: 0,
      rosterSizeAtSeasonStart: expect.any(Number),
    });
  });
});

describe('recordBoutOutcome', () => {
  it('appends a typed BOUT event summarizing the week', () => {
    const w1 = rosterWarrior('rw1');
    const rival = makeRival({ roster: [w1], actionHistory: [] });
    const fights = [
      makeFightSummary({ warriorIdA: 'rw1' as WarriorId, winner: 'D', by: 'Kill' }),
    ];
    const out = recordBoutOutcome(rival, fights, 5);
    expect(out.actionHistory).toHaveLength(1);
    const ev = out.actionHistory![0]!;
    expect(ev.type).toBe('BOUT');
    expect(ev.cause).toBe('BOUT_OUTCOME');
  });

  it('does not log when the stable did not fight', () => {
    const w1 = rosterWarrior('rw1');
    const rival = makeRival({ roster: [w1], actionHistory: [] });
    const out = recordBoutOutcome(rival, [], 5);
    expect(out.actionHistory).toHaveLength(0);
  });

  it('tracks loss factors bounded to the 3 most recent', () => {
    const w1 = rosterWarrior('rw1');
    const rival = makeRival({ roster: [w1], actionHistory: [] });
    let cur = rival;
    for (const by of ['KO', 'Decision', 'Stoppage', 'KO'] as const) {
      cur = recordBoutOutcome(
        cur,
        [makeFightSummary({ warriorIdA: 'rw1' as WarriorId, winner: 'D', by })],
        5
      );
    }
    expect(cur.agentMemory!.lastLossFactors!.length).toBeLessThanOrEqual(3);
  });
});
