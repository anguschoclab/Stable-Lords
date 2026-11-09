// @vitest-environment node
/**
 * V26 — harmonized bloodfeuds. Marks are owed to the VICTIM'S stable — player
 * or rival alike — and every stable spends its own marks:
 *
 *  - `bloodfeudMarksFromOutcome` emits `{killerWarriorId, killerStableId,
 *    owedStableId, expiresWeek}` for ANY arena kill (tournament kills stay
 *    exempt, handled at the call site)
 *  - `findBestOpponent`'s feud fast-path resolves the searcher's owning
 *    stable — `w.stableId` for rivals, the player key for roster warriors —
 *    instead of only consulting `playerWarriorIds`
 *  - `generateBoutBids` emits a feud-priority bid (`bloodfeud: true`,
 *    `targetWarriorId` = the killer) outranking even VENDETTA intent
 *  - draw-free bookkeeping: marks consume no RNG
 *
 * Live since Phase 5 — owed-stable schema + consumers.
 */
import { describe, it, expect } from 'vitest';
import {
  bloodfeudMarksFromOutcome,
  BLOODFEUD_TURNS,
} from '@/engine/matchmaking/bloodfeud';
import { findBestOpponent } from '@/engine/promoters/offerMatchmaking';
import { generateBoutBids } from '@/engine/ai/workers/competitionWorker/boutBidding';
import {
  makeGameState,
  makeRival,
  makeStrategy,
} from '@/test/_fixtures/factories';
import type { StableId } from '@/types/shared.types';
import { w, opponentCtx as ctx } from './_helpers';

describe('bloodfeudMarksFromOutcome — owed to the victim stable', () => {
  it('a rival-on-rival kill creates a mark owed to the victim stable', () => {
    const marks = bloodfeudMarksFromOutcome({
      outcome: { by: 'Kill', winner: 'A' },
      warriorA: w('killer-1', 'rival-2'),
      warriorD: w('victim-1', 'rival-1'),
      week: 10,
      playerStableId: 'player-1',
    } as never);
    expect(marks).toEqual([
      {
        killerWarriorId: 'killer-1',
        killerStableId: 'rival-2',
        owedStableId: 'rival-1',
        expiresWeek: 10 + BLOODFEUD_TURNS,
      },
    ]);
  });

  it('a kill of a player warrior is owed to the player stable', () => {
    const marks = bloodfeudMarksFromOutcome({
      outcome: { by: 'Kill', winner: 'A' },
      warriorA: w('killer-1', 'rival-2'),
      warriorD: w('victim-1'), // roster warrior — no stableId
      week: 10,
      playerStableId: 'player-1',
    } as never);
    expect(marks).toEqual([
      {
        killerWarriorId: 'killer-1',
        killerStableId: 'rival-2',
        owedStableId: 'player-1',
        expiresWeek: 14,
      },
    ]);
  });

  it('non-kill outcomes create no marks', () => {
    const marks = bloodfeudMarksFromOutcome({
      outcome: { by: 'KO', winner: 'D' },
      warriorA: w('a', 'r-1'),
      warriorD: w('d', 'r-2'),
      week: 10,
      playerStableId: 'player-1',
    } as never);
    expect(marks).toEqual([]);
  });
});

describe('findBestOpponent — feud priority for any stable', () => {
  it('a rival warrior chasing its own stable’s mark transcends the score window', () => {
    const a = w('avenger-1', 'rival-1');
    const killer = w('killer-1', 'rival-2'); // score far outside the window
    const near = w('near-1', 'rival-9');
    const out = findBestOpponent(
      a,
      100,
      [killer, near], // sortedByScore must be score-ordered for the window scan
      [10, 100],
      ctx({
        feudTargetsByStable: new Map([['rival-1', new Set(['killer-1'])]]),
      })
    );
    expect(out?.id).toBe('killer-1');
  });

  it('a rival warrior with no owed marks is NOT feud-boosted', () => {
    const a = w('plain-1', 'rival-5');
    const killer = w('killer-1', 'rival-2');
    const near = w('near-1', 'rival-9');
    const out = findBestOpponent(
      a,
      100,
      [killer, near],
      [10, 100],
      ctx({
        feudTargetsByStable: new Map([['rival-1', new Set(['killer-1'])]]),
      })
    );
    expect(out?.id).toBe('near-1'); // killer outside window; no entitlement
  });
});

describe('generateBoutBids — rival stables spend their own marks', () => {
  const owed = makeRival({
    id: 'rival-1' as StableId,
    roster: [w('avenger-1', 'rival-1')],
    strategy: makeStrategy({ intent: 'CONSOLIDATION' }),
  });
  const killerStable = makeRival({
    id: 'rival-2' as StableId,
    roster: [w('killer-1', 'rival-2')],
  });
  const stateWith = (marks: unknown[], absoluteWeek = 5) =>
    makeGameState({
      absoluteWeek,
      bloodfeudMarks: marks,
      rivals: [owed, killerStable],
    } as never);

  it('emits a feud bid naming the killer when the mark is live', () => {
    const state = stateWith([
      {
        killerWarriorId: 'killer-1',
        killerStableId: 'rival-2',
        owedStableId: 'rival-1',
        expiresWeek: 99,
      },
    ]);
    const { bids } = generateBoutBids({
      rival: owed,
      _currentWeek: 5,
      rivals: [owed, killerStable],
      state,
    });
    const feud = bids.find((b) => b.proposingWarriorId === 'avenger-1');
    expect(feud?.targetStableId).toBe('rival-2');
    expect(feud?.targetWarriorId).toBe('killer-1');
    expect((feud as Record<string, unknown> | undefined)?.bloodfeud).toBe(true);
  });

  it('outranks VENDETTA targeting — a feud is an entitlement, not a posture', () => {
    const vendetta = makeRival({
      id: 'rival-1' as StableId,
      roster: [w('avenger-1', 'rival-1')],
      strategy: makeStrategy({ intent: 'VENDETTA', targetStableId: 'rival-9' as StableId }),
    });
    const state = stateWith([
      {
        killerWarriorId: 'killer-1',
        killerStableId: 'rival-2',
        owedStableId: 'rival-1',
        expiresWeek: 99,
      },
    ]);
    const { bids } = generateBoutBids({
      rival: vendetta,
      _currentWeek: 5,
      rivals: [vendetta, killerStable],
      state,
    });
    const feud = bids.find((b) => b.proposingWarriorId === 'avenger-1');
    expect(feud?.targetStableId).toBe('rival-2');
  });

  it('an expired mark produces no feud bid', () => {
    const state = stateWith(
      [
        {
          killerWarriorId: 'killer-1',
          killerStableId: 'rival-2',
          owedStableId: 'rival-1',
          expiresWeek: 3,
        },
      ],
      5
    );
    const { bids } = generateBoutBids({
      rival: owed,
      _currentWeek: 5,
      rivals: [owed, killerStable],
      state,
    });
    expect(bids.find((b) => b.targetStableId === 'rival-2')).toBeUndefined();
  });
});
