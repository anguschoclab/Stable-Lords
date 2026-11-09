import { describe, it, expect } from 'vitest';
import {
  buildGrudgeOffers,
  fileGrudgeCallout,
  fileStablemateHunt,
} from '@/engine/matchmaking/grudgeMatches';
import {
  makeTournamentBaseState,
  makeTournamentWarrior,
  makeCompletedTournament,
  makeTournamentRival,
  TOURNEY_PLAYER_ID,
  TOURNEY_RIVAL_ID,
} from '@/test/_fixtures/tournamentState';

function grudgeState() {
  const warriors = [
    makeTournamentWarrior('w0', 'Zero'),
    makeTournamentWarrior('w1', 'One'),
    makeTournamentWarrior('w2', 'Two', undefined, TOURNEY_RIVAL_ID),
    makeTournamentWarrior('w3', 'Three', undefined, TOURNEY_RIVAL_ID),
  ];
  const tour = {
    ...makeCompletedTournament(warriors, 'A', 'A', 'rookies', 't-rookies'),
    classId: 'rookies' as const,
  };
  const state = makeTournamentBaseState(10);
  state.roster = warriors.filter((x) => x.stableId === TOURNEY_PLAYER_ID);
  state.rivals = [makeTournamentRival(warriors.filter((x) => x.stableId === TOURNEY_RIVAL_ID))];
  state.tournaments = [tour];
  return state;
}

describe('buildGrudgeOffers — post-tournament exhibition bouts', () => {
  it('pairs same-class finishers into week T+1 offers tagged with the source tournament', () => {
    const state = grudgeState();
    const offers = buildGrudgeOffers(state, 't-rookies' as never);
    expect(offers.length).toBeGreaterThan(0);
    for (const offer of offers) {
      expect(offer.grudgeOfTournamentId).toBe('t-rookies');
      expect(offer.boutWeek).toBe(11);
    }
  });

  it('auto-files only rival-owned losers — player losses surface as manual call-outs', () => {
    const state = grudgeState();
    const offers = buildGrudgeOffers(state, 't-rookies' as never);
    // The rule is symmetric (the loser may file); the chooser differs — the
    // AI files for itself, the player decides through the call-out lane.
    for (const offer of offers) {
      const loser = offer.warriorIds[0]!;
      expect(state.roster.some((w) => w.id === loser)).toBe(false);
    }
  });

  it('fileGrudgeCallout lets the player file a skipped loser→killer rematch', () => {
    const state = grudgeState();
    const auto = buildGrudgeOffers(state, 't-rookies' as never);
    const playerLosers = state.tournaments[0]!.bracket
      .filter((b) => b.winner && !b.isBronzeMatch)
      .map((b) => (b.winner === 'A' ? b.warriorIdD : b.warriorIdA))
      .filter((id) => state.roster.some((w) => w.id === id));
    expect(playerLosers.length).toBeGreaterThan(0);
    expect(auto.some((o) => o.warriorIds.includes(playerLosers[0]!))).toBe(false);

    const bout = state.tournaments[0]!.bracket.find(
      (b) => b.winner && !b.isBronzeMatch && (b.warriorIdA === playerLosers[0] || b.warriorIdD === playerLosers[0])
    )!;
    const killerId = bout.winner === 'A' ? bout.warriorIdA : bout.warriorIdD;
    const offer = fileGrudgeCallout(state, 't-rookies' as never, playerLosers[0] as never, killerId as never);
    expect(offer).not.toBeNull();
    expect(offer!.grudgeOfTournamentId).toBe('t-rookies');
    expect(offer!.boutWeek).toBe(11);
  });

  it('fileGrudgeCallout refuses an already-booked warrior', () => {
    const state = grudgeState();
    const auto = buildGrudgeOffers(state, 't-rookies' as never);
    state.boutOffers = Object.fromEntries(auto.map((o) => [o.id, o]));
    // Every rival-loser pair was auto-filed — re-filing any booked warrior must fail.
    const booked = auto[0]!.warriorIds;
    const retry = fileGrudgeCallout(
      state,
      't-rookies' as never,
      booked[0] as never,
      booked[1] as never
    );
    expect(retry).toBeNull();
  });

  it('never books a warrior twice', () => {
    const state = grudgeState();
    const offers = buildGrudgeOffers(state, 't-rookies' as never);
    const seen = new Set<string>();
    for (const offer of offers) {
      for (const id of offer.warriorIds) {
        expect(seen.has(id)).toBe(false);
        seen.add(id);
      }
    }
  });

  it('stablemate lane: an unbooked rival stablemate hunts the killer of a booked stablemate', () => {
    // A rival victim's rematch always books their killer — so the lane only
    // fires for killers whose victim was ALREADY booked (as a killer in an
    // earlier round): the deep-run killer a stablemate hunts down.
    //   R1: r1 beats rx  → rematch rx→r1 books {rx, r1}
    //   R1: r0 loses to p0 → rematch r0→p0 books {r0, p0}
    //   R2: r1 loses to p2 → r1 already booked → killer p2 stays unbooked
    //   → stablemate r3 (same stable, finisher, unbooked) hunts p2.
    const mk = (id: string, name: string, rival?: boolean) =>
      makeTournamentWarrior(id, name, undefined, rival ? TOURNEY_RIVAL_ID : TOURNEY_PLAYER_ID);
    const [p0, p2, r0, r1, rx, r3] = [
      mk('p0', 'P Zero'), mk('p2', 'P Two'), mk('r0', 'R Zero', true),
      mk('r1', 'R One', true), mk('rx', 'R Ex', true), mk('r3', 'R Three', true),
    ];
    const bout = (
      round: number, matchIndex: number, a: typeof p0, d: typeof p0, winner: 'A' | 'D'
    ) => ({
      round, matchIndex,
      warriorIdA: a.id, warriorIdD: d.id,
      stableIdA: a.stableId, stableIdD: d.stableId,
      winner, by: 'Stoppage' as const,
    });
    const tour = {
      ...makeCompletedTournament([p0, p2, r0, r1], 'A', 'A', 'rookies', 't-rookies'),
      classId: 'rookies' as const,
      participants: [p0, p2, r0, r1, rx, r3],
      bracket: [
        bout(1, 0, r1, rx, 'A'),   // rx→r1 rematch
        bout(1, 1, r0, p0, 'D'),   // r0→p0 rematch
        bout(2, 0, r1, p2, 'D'),   // r1 booked → p2 unbooked
      ],
    };
    const state = makeTournamentBaseState(10);
    state.roster = [p0, p2];
    state.rivals = [makeTournamentRival([r0, r1, rx, r3])];
    state.tournaments = [tour];

    const offers = buildGrudgeOffers(state, 't-rookies' as never);
    const pairs = offers.map((o) => o.warriorIds.join('→')).sort();
    expect(pairs).toEqual(['r0→p0', 'r3→p2', 'rx→r1']);
  });

  it('fileStablemateHunt lets the player send a stablemate after a killer', () => {
    //   R1: r0 beats p1  → p1 (player) loses to r0
    //   → player may send unbooked stablemate finisher p2 after r0.
    const mk = (id: string, name: string, rival?: boolean) =>
      makeTournamentWarrior(id, name, undefined, rival ? TOURNEY_RIVAL_ID : TOURNEY_PLAYER_ID);
    const [p1, p2, r0, r7] = [mk('p1', 'P One'), mk('p2', 'P Two'), mk('r0', 'R Zero', true), mk('r7', 'R Sev', true)];
    const bout = (
      round: number, matchIndex: number, a: typeof p1, d: typeof p1, winner: 'A' | 'D'
    ) => ({
      round, matchIndex,
      warriorIdA: a.id, warriorIdD: d.id,
      stableIdA: a.stableId, stableIdD: d.stableId,
      winner, by: 'Stoppage' as const,
    });
    const tour = {
      ...makeCompletedTournament([p1, p2, r0, r7], 'A', 'A', 'rookies', 't-rookies'),
      classId: 'rookies' as const,
      participants: [p1, p2, r0, r7],
      bracket: [
        bout(1, 0, r0, p1, 'A'),   // r0 kills p1
        bout(1, 1, r7, p2, 'A'),   // p2 fell too — still a bracket finisher
      ],
    };
    const state = makeTournamentBaseState(10);
    state.roster = [p1, p2];
    state.rivals = [makeTournamentRival([r0, r7])];
    state.tournaments = [tour];

    const offer = fileStablemateHunt(state, 't-rookies' as never, 'p2' as never, 'r0' as never);
    expect(offer).not.toBeNull();
    expect(offer!.warriorIds).toEqual(['p2', 'r0']);
    expect(offer!.grudgeOfTournamentId).toBe('t-rookies');
    expect(offer!.boutWeek).toBe(11);
  });

  it('fileStablemateHunt refuses when the killer never beat a stablemate', () => {
    const mk = (id: string, name: string, rival?: boolean) =>
      makeTournamentWarrior(id, name, undefined, rival ? TOURNEY_RIVAL_ID : TOURNEY_PLAYER_ID);
    const [p1, p2, r0, r7] = [mk('p1', 'P One'), mk('p2', 'P Two'), mk('r0', 'R Zero', true), mk('r7', 'R Sev', true)];
    const bout = (
      round: number, matchIndex: number, a: typeof p1, d: typeof p1, winner: 'A' | 'D'
    ) => ({
      round, matchIndex,
      warriorIdA: a.id, warriorIdD: d.id,
      stableIdA: a.stableId, stableIdD: d.stableId,
      winner, by: 'Stoppage' as const,
    });
    const tour = {
      ...makeCompletedTournament([p1, p2, r0, r7], 'A', 'A', 'rookies', 't-rookies'),
      classId: 'rookies' as const,
      participants: [p1, p2, r0, r7],
      bracket: [
        bout(1, 0, r0, p1, 'A'),   // r0 beat p1 — but r7 only beat a rival
        bout(1, 1, r7, mk('r9', 'R Nine', true), 'A'),
      ],
    };
    const state = makeTournamentBaseState(10);
    state.roster = [p1, p2];
    state.rivals = [makeTournamentRival([r0, r7])];
    state.tournaments = [tour];

    expect(fileStablemateHunt(state, 't-rookies' as never, 'p2' as never, 'r7' as never)).toBeNull();
    // And a non-participant cannot avenge.
    expect(fileStablemateHunt(state, 't-rookies' as never, 'ghost' as never, 'r0' as never)).toBeNull();
  });

  it('fileStablemateHunt refuses an already-booked killer or avenger — and the victim itself', () => {
    const mk = (id: string, name: string, rival?: boolean) =>
      makeTournamentWarrior(id, name, undefined, rival ? TOURNEY_RIVAL_ID : TOURNEY_PLAYER_ID);
    const [p1, p2, r0, r7] = [mk('p1', 'P One'), mk('p2', 'P Two'), mk('r0', 'R Zero', true), mk('r7', 'R Sev', true)];
    const bout = (
      round: number, matchIndex: number, a: typeof p1, d: typeof p1, winner: 'A' | 'D'
    ) => ({
      round, matchIndex,
      warriorIdA: a.id, warriorIdD: d.id,
      stableIdA: a.stableId, stableIdD: d.stableId,
      winner, by: 'Stoppage' as const,
    });
    const tour = {
      ...makeCompletedTournament([p1, p2, r0, r7], 'A', 'A', 'rookies', 't-rookies'),
      classId: 'rookies' as const,
      participants: [p1, p2, r0, r7],
      bracket: [
        bout(1, 0, r0, p1, 'A'),
        bout(1, 1, r7, p2, 'A'),
      ],
    };
    const state = makeTournamentBaseState(10);
    state.roster = [p1, p2];
    state.rivals = [makeTournamentRival([r0, r7])];
    state.tournaments = [tour];

    // The victim avenging itself is the call-out lane's job, not a hunt.
    expect(fileStablemateHunt(state, 't-rookies' as never, 'p1' as never, 'r0' as never)).toBeNull();

    // A pending grudge involving the killer blocks the hunt…
    state.boutOffers = {
      ['pre' as never]: {
        id: 'pre' as never, warriorIds: ['rx', 'r0'] as never,
        grudgeOfTournamentId: 't-rookies' as never, status: 'Proposed',
      } as never,
    };
    expect(fileStablemateHunt(state, 't-rookies' as never, 'p2' as never, 'r0' as never)).toBeNull();
    // …and a pending grudge involving the avenger blocks it too.
    state.boutOffers = {
      ['pre2' as never]: {
        id: 'pre2' as never, warriorIds: ['p2', 'r9'] as never,
        grudgeOfTournamentId: 't-rookies' as never, status: 'Proposed',
      } as never,
    };
    expect(fileStablemateHunt(state, 't-rookies' as never, 'p2' as never, 'r0' as never)).toBeNull();
  });

  it('ignores incomplete tournaments', () => {
    const state = grudgeState();
    state.tournaments[0] = { ...state.tournaments[0]!, completed: false };
    const offers = buildGrudgeOffers(state, 't-rookies' as never);
    expect(offers).toHaveLength(0);
  });
});
