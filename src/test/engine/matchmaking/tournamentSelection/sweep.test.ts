import { describe, it, expect, vi } from 'vitest';
import type { Warrior } from '@/types/state.types';
import { FightingStyle } from '@/types/shared.types';
import {
  TOURNEY_PLAYER_ID,
  TOURNEY_RIVAL_ID,
  makeTournamentBaseState,
  makeTournamentWarrior,
  makeCompletedTournament,
  makeTournamentRival,
  makeOpenTournament,
  makeSplitTournamentState,
} from '@/test/_fixtures/tournamentState';
import { simulateFight } from '@/engine/simulate';

vi.mock('@/engine/simulate', () => ({ ...__SHARED_MOCKS.tournamentSimulate }));
vi.mock('@/engine', () => ({ ...__SHARED_MOCKS.tournamentEngine }));
vi.mock('@/engine/tokens/patronTokenService', () => ({ ...__SHARED_MOCKS.patronTokenService }));
vi.mock('@/engine/core/warriorLookup', () => ({ ...__SHARED_MOCKS.tournamentWarriorLookup }));

import { sweepUnfinishedTournaments } from '@/engine/matchmaking/tournamentSelection/resolution';

const PLAYER_ID = TOURNEY_PLAYER_ID;
const RIVAL_ID = TOURNEY_RIVAL_ID;

// ─── Lifecycle hardening: "emitted ⇒ resolved" invariant ───

describe('sweepUnfinishedTournaments', () => {
  it('resolves every unfinished tournament and leaves completed entries untouched', () => {
    const wA1 = makeTournamentWarrior('sa1', 'Sweep A1', FightingStyle.StrikingAttack, PLAYER_ID);
    const wB1 = makeTournamentWarrior('sb1', 'Sweep B1', FightingStyle.StrikingAttack, RIVAL_ID);
    const wA2 = makeTournamentWarrior('sa2', 'Sweep A2', FightingStyle.StrikingAttack, PLAYER_ID);
    const wB2 = makeTournamentWarrior('sb2', 'Sweep B2', FightingStyle.StrikingAttack, RIVAL_ID);

    const state = makeSplitTournamentState([wA1, wB1, wA2, wB2], { withTournament: false });

    const done = makeCompletedTournament([wA1, wB1, wA2, wB2]);
    state.tournaments = [
      done,
      makeOpenTournament('t-open-1', 'Sweep Cup', wA1, wB1),
      makeOpenTournament('t-open-2', 'Sweep Cup', wA2, wB2),
    ];

    const swept = sweepUnfinishedTournaments(state, true);

    expect(swept.tournaments!.every((t) => t.completed)).toBe(true);
    for (const t of swept.tournaments!) expect(t.champion).toBeDefined();
  });

  it('still resolves a duplicated-id tournament — the later entry is not stranded', () => {
    // Corrupted/legacy saves can carry two entries sharing one id: find-by-id
    // and update-by-id both target the FIRST match, so the sweep must give
    // later duplicates a unique id or they could never resolve.
    const wA1 = makeTournamentWarrior('da1', 'Dup A1', FightingStyle.StrikingAttack, PLAYER_ID);
    const wB1 = makeTournamentWarrior('db1', 'Dup B1', FightingStyle.StrikingAttack, RIVAL_ID);
    const wA2 = makeTournamentWarrior('da2', 'Dup A2', FightingStyle.StrikingAttack, PLAYER_ID);
    const wB2 = makeTournamentWarrior('db2', 'Dup B2', FightingStyle.StrikingAttack, RIVAL_ID);

    const state = makeSplitTournamentState([wA1, wB1, wA2, wB2], { withTournament: false });
    state.tournaments = [
      makeOpenTournament('t-shared', 'Dup Cup', wA1, wB1),
      makeOpenTournament('t-shared', 'Dup Cup', wA2, wB2),
    ];

    const swept = sweepUnfinishedTournaments(state, true);

    expect(swept.tournaments!.every((t) => t.completed)).toBe(true);
    // Later duplicate was renamed so resolution could target it.
    expect(new Set(swept.tournaments!.map((t) => t.id)).size).toBe(2);
    expect(swept.tournaments![0]!.id).toBe('t-shared');
  });

  it('forfeits a dead participant instead of re-killing a stale snapshot', () => {
    // The kill/death divergence: a warrior killed last week stays 'Active'
    // inside tournaments[].participants. findWarriorById checks participants
    // first, so the sweep resolves the stale snapshot and re-kills them —
    // a second kill outcome with no new graveyard entry.
    const wAlive = makeTournamentWarrior(
      'z-alive',
      'Alive',
      FightingStyle.StrikingAttack,
      PLAYER_ID
    );
    const wDead = makeTournamentWarrior('z-dead', 'Zombie', FightingStyle.StrikingAttack, RIVAL_ID);

    const state = makeTournamentBaseState(1);
    state.roster = [wAlive];
    state.rivals = [makeTournamentRival([])];
    // The stale participant snapshot claims 'Active'; the dead registry says otherwise.
    state.deadWarriorIds = [wDead.id];
    state.tournaments = [makeOpenTournament('t-zombie', 'Zombie Cup', wAlive, wDead)];

    const killsBefore = (state.arenaHistory ?? []).filter((b) => b.by === 'Kill').length;
    vi.mocked(simulateFight).mockClear();
    const swept = sweepUnfinishedTournaments(state, true);

    const bout = swept.tournaments![0]!.bracket[0]!;
    expect(bout.winner).toBe('A'); // live side advances by forfeit
    // The dead participant is never simulated — forfeit, not a fight.
    expect(simulateFight).not.toHaveBeenCalled();
    // No bout was simulated: no summary, no graveyard append, no kill event.
    const killsAfter = (swept.arenaHistory ?? []).filter((b) => b.by === 'Kill').length;
    expect(killsAfter).toBe(killsBefore);
    expect((swept.arenaHistory ?? []).filter((b) => b.tournamentId === 't-zombie')).toHaveLength(0);
    expect(swept.graveyard ?? []).toHaveLength(0);
    expect(swept.killEvents ?? []).toHaveLength(0);
  });

  it('forfeits a participant who retired after selection', () => {
    // Retirement between selection and resolution is a real window — the
    // participant snapshot stays 'Active' while the live warrior retired.
    const wAlive = makeTournamentWarrior(
      'r-alive',
      'Alive',
      FightingStyle.StrikingAttack,
      PLAYER_ID
    );
    const wRetired = makeTournamentWarrior(
      'r-ret',
      'Retired',
      FightingStyle.StrikingAttack,
      RIVAL_ID
    );

    const state = makeTournamentBaseState(1);
    state.roster = [wAlive];
    state.rivals = [makeTournamentRival([])];
    state.retired = [{ ...wRetired, status: 'Retired' } as Warrior];
    state.tournaments = [makeOpenTournament('t-retired', 'Pensioner Cup', wAlive, wRetired)];

    vi.mocked(simulateFight).mockClear();
    const swept = sweepUnfinishedTournaments(state, true);
    const bout = swept.tournaments![0]!.bracket[0]!;
    expect(bout.winner).toBe('A');
    expect(simulateFight).not.toHaveBeenCalled();
    expect((swept.arenaHistory ?? []).filter((b) => b.tournamentId === 't-retired')).toHaveLength(
      0
    );
    expect(swept.graveyard ?? []).toHaveLength(0);
  });

  it('never seeds a killed semifinalist into the bronze match', () => {
    // Same-week double-kill path: semifinal loser is dead, yet the bronze
    // playoff still resolves their stale participant snapshot.
    const w1 = makeTournamentWarrior('b1', 'B1', FightingStyle.StrikingAttack, PLAYER_ID);
    const w2 = makeTournamentWarrior('b2', 'B2', FightingStyle.StrikingAttack, RIVAL_ID);
    const w3 = makeTournamentWarrior('b3', 'B3', FightingStyle.StrikingAttack, RIVAL_ID);
    const w4 = makeTournamentWarrior('b4', 'B4', FightingStyle.StrikingAttack, RIVAL_ID);

    const state = makeSplitTournamentState([w1, w2, w3, w4]);

    // Semifinal 1 kills its loser (w2); every other bout is a clean stoppage.
    vi.mocked(simulateFight)
      .mockReturnValueOnce({
        winner: 'A',
        by: 'Kill',
        minutes: 1,
        log: [],
        exchangeLog: [],
        post: { tags: [] },
      } as unknown as ReturnType<typeof simulateFight>)
      .mockReturnValue({
        winner: 'A',
        by: 'Stoppage',
        minutes: 1,
        log: [],
        exchangeLog: [],
        post: { tags: [] },
      } as unknown as ReturnType<typeof simulateFight>);

    const swept = sweepUnfinishedTournaments(state, true);

    const tour = swept.tournaments![0]!;
    const bronze = tour.bracket.find((b) => b.isBronzeMatch);
    // w2 died in the semis — the bronze bout must not simulate them again.
    expect(bronze).toBeDefined();
    expect(bronze!.winner).toBe('D'); // w4 takes third by forfeit
    // Exactly one death happened; nobody was killed twice.
    expect((swept.graveyard ?? []).filter((g) => g.id === 'b2')).toHaveLength(1);
    expect((swept.killEvents ?? []).filter((e) => e.victimId === 'b2')).toHaveLength(1);
    expect((swept.killEvents ?? []).filter((e) => e.victimId === 'b4')).toHaveLength(0);
    // Summaries: 2 semifinals + final. The bronze forfeit emits nothing.
    expect((swept.arenaHistory ?? []).filter((b) => b.tournamentId === tour.id)).toHaveLength(3);
    expect(tour.completed).toBe(true);
  });
});
