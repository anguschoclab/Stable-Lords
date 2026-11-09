import { describe, it, expect } from 'vitest';
import { buildGrudgeOffers } from '@/engine/matchmaking/grudgeMatches';
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

  it('ignores incomplete tournaments', () => {
    const state = grudgeState();
    state.tournaments[0] = { ...state.tournaments[0]!, completed: false };
    const offers = buildGrudgeOffers(state, 't-rookies' as never);
    expect(offers).toHaveLength(0);
  });
});
