import { describe, it, expect } from 'vitest';
import { emitClassTournaments } from '@/engine/matchmaking/tournamentSelection/emission';
import { CHAMPIONS_TOURNEY } from '@/constants/arena';
import { SeededRNG } from '@/utils/random';
import {
  makeTournamentBaseState,
  makeTournamentWarrior,
  makeTournamentRival,
  TOURNEY_PLAYER_ID,
  TOURNEY_RIVAL_ID,
} from '@/test/_fixtures/tournamentState';
import type { TournamentCycle } from '@/types/state.types';
import type { StableId, WarriorId } from '@/types/shared.types';

const w = (id: string, stableId: StableId = TOURNEY_PLAYER_ID) =>
  makeTournamentWarrior(id, `Warrior ${id}`, undefined, stableId);

function cycleState(entries: {
  rookies?: ReturnType<typeof w>[];
  apprentices?: ReturnType<typeof w>[];
  declaredStable?: StableId;
  scratched?: WarriorId[];
}) {
  const all = [...(entries.rookies ?? []), ...(entries.apprentices ?? [])];
  const state = makeTournamentBaseState(10);
  state.roster = all.filter((x) => x.stableId === TOURNEY_PLAYER_ID);
  state.rivals = [
    makeTournamentRival(all.filter((x) => x.stableId === TOURNEY_RIVAL_ID)),
  ];
  const invited: TournamentCycle['invited'] = {};
  if (entries.rookies?.length) invited.rookies = entries.rookies.map((x) => x.id);
  if (entries.apprentices?.length)
    invited.apprentices = entries.apprentices.map((x) => x.id);
  const declaredStable = entries.declaredStable ?? TOURNEY_PLAYER_ID;
  state.tournamentCycle = {
    forWeek: 10,
    season: 'Spring',
    frozenAtAbsWeek: 8,
    feByWarrior: Object.fromEntries(all.map((x) => [x.id, 0])),
    invited,
    declared: entries.apprentices?.length
      ? { [declaredStable]: entries.apprentices.map((x) => x.id) }
      : {},
    scratched: entries.scratched ?? [],
    elevated: [],
  };
  return state;
}

describe('emitClassTournaments — one bracket per populated class', () => {
  it('emits a rookies bracket tagged with classId and a class prize tier ≠ Grand Championship', () => {
    const field = Array.from({ length: 8 }, (_, i) =>
      w(`p${i}`, i % 2 === 0 ? TOURNEY_PLAYER_ID : TOURNEY_RIVAL_ID)
    );
    const state = cycleState({ rookies: field });
    const { tournaments, activeTournamentId } = emitClassTournaments(
      state,
      10,
      new SeededRNG(3)
    );
    expect(tournaments).toHaveLength(1);
    const t = tournaments[0]!;
    expect(t.classId).toBe('rookies');
    // The 'Champions' tierId is reserved for the Grand Championship — class
    // brackets must use a distinct id or the prize-gate exclusion in
    // finalizeRound would silently skip their purses.
    expect(t.tierId).not.toBe(CHAMPIONS_TOURNEY.TIER_ID);
    expect(t.completed).toBe(false);
    expect(activeTournamentId).toBe(t.id);
  });

  it('emits multiple class brackets and picks the bracket with the most player entrants as active', () => {
    const rookies = Array.from({ length: 8 }, (_, i) =>
      w(`r${i}`, i < 2 ? TOURNEY_PLAYER_ID : TOURNEY_RIVAL_ID)
    );
    const apprentices = Array.from({ length: 8 }, (_, i) =>
      w(`a${i}`, i < 4 ? TOURNEY_PLAYER_ID : TOURNEY_RIVAL_ID)
    );
    const state = cycleState({ rookies, apprentices });
    const { tournaments, activeTournamentId } = emitClassTournaments(
      state,
      10,
      new SeededRNG(3)
    );
    expect(tournaments).toHaveLength(2);
    const apprenticeBracket = tournaments.find((t) => t.classId === 'apprentices')!;
    expect(activeTournamentId).toBe(apprenticeBracket.id);
  });

  it('honors scratches and dedupes invited ∪ declared once', () => {
    const field = Array.from({ length: 8 }, (_, i) =>
      w(`p${i}`, i % 2 === 0 ? TOURNEY_PLAYER_ID : TOURNEY_RIVAL_ID)
    );
    const scratch = field[0]!.id;
    const state = cycleState({ rookies: field, scratched: [scratch] });
    const { tournaments } = emitClassTournaments(state, 10, new SeededRNG(3));
    const ids = tournaments[0]!.participants.map((p) => p.id as string);
    expect(ids.filter((x) => x === scratch)).toHaveLength(0);
  });

  it('skips a class whose entered field falls below the minimum bracket size', () => {
    const tiny = Array.from({ length: 3 }, (_, i) => w(`t${i}`));
    const state = cycleState({ rookies: tiny });
    const { tournaments } = emitClassTournaments(state, 10, new SeededRNG(3));
    expect(tournaments).toHaveLength(0);
  });

  it('pads a viable field up to a power of two within the class cap', () => {
    // 9 entrants → pad to 16 via freelancers (never exceed the class cap).
    const nine = Array.from({ length: 9 }, (_, i) =>
      w(`n${i}`, i % 3 === 0 ? TOURNEY_PLAYER_ID : TOURNEY_RIVAL_ID)
    );
    const state = cycleState({ rookies: nine });
    const { tournaments } = emitClassTournaments(state, 10, new SeededRNG(3));
    const participants = tournaments[0]!.participants;
    const pow2 = (n: number) => n > 0 && (n & (n - 1)) === 0;
    expect(pow2(participants.length)).toBe(true);
    expect(participants.length).toBeGreaterThanOrEqual(9);
    const ids = new Set(participants.map((p) => p.id));
    for (const entrant of nine) expect(ids.has(entrant.id)).toBe(true);
  });

  it('no tournamentCycle → no emission (freeze is the gate)', () => {
    const state = makeTournamentBaseState(10);
    const { tournaments } = emitClassTournaments(state, 10, new SeededRNG(3));
    expect(tournaments).toHaveLength(0);
  });
});
