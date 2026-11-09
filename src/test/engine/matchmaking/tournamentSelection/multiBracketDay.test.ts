import { describe, it, expect } from 'vitest';
import { advanceDay } from '@/engine/pipeline/tick/dayAdvance';
import { generatePairings } from '@/engine/bout/core/pairings';
import { buildActiveWarriorMap } from '@/utils/roster';
import type { WarriorId } from '@/types/shared.types';
import type { Warrior } from '@/types/state.types';
import {
  makeTournamentBaseState,
  makeTournamentWarrior,
  makeOpenTournament,
  makeTournamentRival,
  TOURNEY_RIVAL_ID,
} from '@/test/_fixtures/tournamentState';

function twoBracketState() {
  const [a1, d1, a2, d2] = [
    makeTournamentWarrior('a1', 'Alpha One'),
    makeTournamentWarrior('d1', 'Delta One', undefined, TOURNEY_RIVAL_ID),
    makeTournamentWarrior('a2', 'Alpha Two'),
    makeTournamentWarrior('d2', 'Delta Two', undefined, TOURNEY_RIVAL_ID),
  ];
  const t1 = { ...makeOpenTournament('t-rookies', 'Rookies Cup', a1, d1), classId: 'rookies' as const };
  const t2 = {
    ...makeOpenTournament('t-apprentices', 'Apprentices Cup', a2, d2),
    classId: 'apprentices' as const,
  };
  const state = makeTournamentBaseState(10);
  state.roster = [a1, a2];
  state.rivals = [makeTournamentRival([d1, d2])];
  state.tournaments = [t1, t2];
  state.isTournamentWeek = true;
  state.activeTournamentId = 't-rookies' as never;
  state.day = 0;
  // Roster/rivals are assigned after the base fixture builds its (empty)
  // warriorMap — rebuild the cache so pairing lookups see all combatants.
  state.warriorMap = buildActiveWarriorMap(state) as Map<WarriorId, Warrior>;
  return state;
}

describe('multi-bracket tournament days', () => {
  it('advanceDay resolves the current round of EVERY unfinished same-week bracket, not just activeTournamentId', async () => {
    const next = await advanceDay(twoBracketState());
    const t1 = next.tournaments.find((t) => t.id === 't-rookies')!;
    const t2 = next.tournaments.find((t) => t.id === 't-apprentices')!;
    expect(t1.bracket[0]!.winner).toBeDefined();
    expect(t2.bracket[0]!.winner).toBeDefined();
  });

  it('generatePairings emits tour_* contracts for player warriors in ALL brackets', () => {
    const state = twoBracketState();
    state.day = 1; // day 1 → round-1 bouts are due
    const { pairings } = generatePairings(state);
    const tourIds = pairings
      .map((p) => p.contractId)
      .filter((c): c is string => !!c?.startsWith('tour_'));
    expect(tourIds).toContain('tour_t-rookies_1_0');
    expect(tourIds).toContain('tour_t-apprentices_1_0');
  });
});
