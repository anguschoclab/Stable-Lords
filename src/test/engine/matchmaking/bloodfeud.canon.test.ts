/**
 * V24 canon — Challenge metagame (Rose of Shanon / Pagan / Consortium, Arena 93):
 *  - A kill creates a four-turn bloodfeud: any stablemate may challenge the
 *    killer, taking priority over everything (transcends the score window).
 *  - Stable-level avoids REDUCE a challenge's chance (~50%) — they penalise,
 *    they do not make a candidate invisible.
 *  - A double challenge "appx doubles" the odds.
 */
import { describe, it, expect } from 'vitest';
import { bloodfeudMarksFromOutcome, BLOODFEUD_TURNS } from '@/engine/matchmaking/bloodfeud';
import { w, opponentCtx as ctx, searchBest as search } from './_helpers';

describe('bloodfeud entitlement (canon: 4 turns, any stablemate, top priority)', () => {
  it('a killed player warrior creates a mark on the killer, expiring in 4 weeks', () => {
    const killer = w('killer-1', 'rival-stable');
    const victim = w('victim-1');
    const marks = bloodfeudMarksFromOutcome({
      outcome: { by: 'Kill', winner: 'A' },
      warriorA: killer,
      warriorD: victim,
      week: 10,
      playerStableId: 'player-1',
    });
    expect(marks).toEqual([
      {
        killerWarriorId: 'killer-1',
        killerStableId: 'rival-stable',
        owedStableId: 'player-1',
        expiresWeek: 14,
      },
    ]);
    expect(marks[0]!.expiresWeek - 10).toBe(BLOODFEUD_TURNS);
  });

  it('a rival victim creates a mark owed to ITS stable (V26 harmonized)', () => {
    const marks = bloodfeudMarksFromOutcome({
      outcome: { by: 'Kill', winner: 'A' },
      warriorA: w('r1', 'stable-a'),
      warriorD: w('r2', 'stable-b'),
      week: 10,
      playerStableId: 'player-1',
    });
    expect(marks).toEqual([
      {
        killerWarriorId: 'r1',
        killerStableId: 'stable-a',
        owedStableId: 'stable-b',
        expiresWeek: 14,
      },
    ]);
  });

  it('a bloodfeud target wins the offer even outside the score window', () => {
    const a = w('p1');
    const killer = w('killer-1');
    const near = w('near-1');
    // killer's score is way outside the ±gapThreshold window.
    const out = search(
      a,
      100,
      [near, killer],
      [100, 10],
      ctx({
        feudTargetsByStable: new Map([['player-1', new Set(['killer-1'])]]),
        playerStableId: 'player-1',
        playerWarriorIds: new Set(['p1']),
      })
    );
    expect(out?.id).toBe('killer-1');
  });
});

describe('stable avoids penalise — they do not hide (canon ~50% rejection)', () => {
  it('a stable-avoided candidate is deprioritised but still selectable alone', () => {
    const a = w('p1');
    const avoided = w('w-avoided', 'hated-stable');
    const normal = w('w-normal', 'ok-stable');
    // Avoided candidate scans first (better list position); penalty should
    // hand the offer to the un-avoided one.
    const c = ctx({
      playerWarriorIds: new Set(['p1']),
      stableAvoidSet: new Set(['hated-stable']),
    });
    const out = search(a, 100, [avoided, normal], [100, 100], c);
    expect(out?.id).toBe('w-normal');
    // …but alone it is still offered, not skipped like an individual avoid.
    const alone = search(a, 100, [avoided], [100], c);
    expect(alone?.id).toBe('w-avoided');
  });
});

describe('double challenge ≈ doubles the chance (Consortium Q&A)', () => {
  it('a twice-listed warrior beats a once-listed equal rival', () => {
    const a = w('p1');
    const once = w('w-once');
    const twice = w('w-twice');
    // `once` scans first; equal scores. Only the doubled bonus lets `twice` win.
    const out = search(
      a,
      100,
      [once, twice],
      [100, 100],
      ctx({
        playerWarriorIds: new Set(['p1']),
        challengeSet: new Set(['w-once', 'w-twice']),
        challengeCounts: new Map([
          ['w-once', 1],
          ['w-twice', 2],
        ]),
      })
    );
    expect(out?.id).toBe('w-twice');
  });
});
