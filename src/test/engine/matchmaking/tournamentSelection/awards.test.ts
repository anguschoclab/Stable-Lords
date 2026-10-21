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
  makeFourManPodium,
} from '@/test/_fixtures/tournamentState';

vi.mock('@/engine/simulate', () => ({ ...__SHARED_MOCKS.tournamentSimulate }));
vi.mock('@/engine', () => ({ ...__SHARED_MOCKS.tournamentEngine }));
vi.mock('@/engine/tokens/patronTokenService', () => ({ ...__SHARED_MOCKS.patronTokenService }));
vi.mock('@/engine/core/warriorLookup', () => ({ ...__SHARED_MOCKS.tournamentWarriorLookup }));

import {
  awardTournamentPrizes,
  modifyWarrior,
} from '@/engine/matchmaking/tournamentSelection/awards';

const PLAYER_ID = TOURNEY_PLAYER_ID;
const RIVAL_ID = TOURNEY_RIVAL_ID;

// ─── awardTournamentPrizes ───

describe('awardTournamentPrizes', () => {
  it('awards medals to 1st, 2nd, and 3rd place warriors', () => {
    const { state, tournament } = makeFourManPodium();
    const updated = awardTournamentPrizes(tournament, state);

    const updatedW1 = updated.roster.find((w) => w.id === 'w1');
    const updatedRival = updated.rivals[0]!;
    const updatedW2 = updatedRival.roster.find((w: Warrior) => w.id === 'w2')!;
    const updatedW3 = updatedRival.roster.find((w: Warrior) => w.id === 'w3')!;

    expect(updatedW1!.career.medals!.gold).toBe(1);
    expect(updatedW2!.career.medals!.silver).toBe(1);
    expect(updatedW3!.career.medals!.bronze).toBe(1);
  });

  it('awards correct fame amounts', () => {
    const { state, tournament } = makeFourManPodium({ winnerFirst: 'A', winnerThird: 'D' });
    const updated = awardTournamentPrizes(tournament, state);

    expect(updated.roster[0]!.fame).toBe(100);
    expect(updated.rivals[0]!.roster.find((w: Warrior) => w.id === 'w2')!.fame).toBe(50);
    expect(updated.rivals[0]!.roster.find((w: Warrior) => w.id === 'w4')!.fame).toBe(25);
  });

  it('awards treasury and creates ledger entry for player', () => {
    const { state, tournament } = makeFourManPodium();
    state.treasury = 1000;

    const updated = awardTournamentPrizes(tournament, state);

    expect(updated.treasury).toBe(6000);
    expect(updated.ledger.length).toBeGreaterThanOrEqual(1);
    expect(updated.ledger[0]!.category).toBe('prize');
  });

  it('grants roster bonus for 1st place', () => {
    const { state, tournament } = makeFourManPodium();
    const updated = awardTournamentPrizes(tournament, state);

    expect(updated.rosterBonus).toBe(1);
  });

  it('derives correct tier and purse from tournament data', () => {
    const { state, tournament } = makeFourManPodium();
    state.treasury = 0;
    tournament.tierId = 'Silver';
    tournament.name = 'Proconsul Silver Plate';

    const updated = awardTournamentPrizes(tournament, state);

    expect(updated.treasury).toBe(2500);
  });

  it('handles missing bronze match (only 1st and 2nd awarded)', () => {
    const w1 = makeTournamentWarrior('w1', 'Champ', FightingStyle.StrikingAttack, PLAYER_ID);
    const w2 = makeTournamentWarrior('w2', 'Runner', FightingStyle.StrikingAttack, RIVAL_ID);

    const state = makeTournamentBaseState(1);
    state.roster = [w1];
    state.rivals = [makeTournamentRival([w2])];

    const tournament = makeCompletedTournament([w1, w2, w1, w2]);
    tournament.bracket = tournament.bracket.filter((b) => b.matchIndex !== 1);

    const updated = awardTournamentPrizes(tournament, state);

    expect(updated.roster[0]!.career.medals!.gold).toBe(1);
    expect(
      updated.rivals[0]!.roster.find((w: Warrior) => w.id === 'w2')!.career.medals!.silver
    ).toBe(1);
  });

  it('updates rival stable treasury and fame', () => {
    const { state, tournament } = makeFourManPodium();
    state.rivals[0]!.fame = 10;

    const updated = awardTournamentPrizes(tournament, state);

    // 500 initial + 2500 (2nd) + 1250 (3rd) = 4250
    expect(updated.rivals[0]!.treasury).toBe(4250);
    // 10 initial + 50 (2nd) + 25 (3rd) = 85
    expect(updated.rivals[0]!.fame).toBe(85);
  });
});

// ─── modifyWarrior (awards.ts) ───

describe('modifyWarrior (awards.ts)', () => {
  it('updates warrior in player roster', () => {
    const w = makeTournamentWarrior('w1', 'PlayerWarrior', FightingStyle.StrikingAttack, PLAYER_ID);
    const state = makeTournamentBaseState(1);
    state.roster = [w];

    const updated = modifyWarrior(state, 'w1', (draft) => {
      draft.fame = 999;
    });

    expect(updated.roster[0]!.fame).toBe(999);
  });

  it('updates warrior in rival roster', () => {
    const w = makeTournamentWarrior('w1', 'RivalWarrior', FightingStyle.StrikingAttack, RIVAL_ID);
    const state = makeTournamentBaseState(1);
    state.rivals = [makeTournamentRival([w])];

    const updated = modifyWarrior(state, 'w1', (draft) => {
      draft.fame = 888;
    });

    expect(updated.rivals[0]!.roster[0]!.fame).toBe(888);
  });

  it('does not mutate original state', () => {
    const w = makeTournamentWarrior('w1', 'PlayerWarrior', FightingStyle.StrikingAttack, PLAYER_ID);
    const state = makeTournamentBaseState(1);
    state.roster = [w];

    modifyWarrior(state, 'w1', (draft) => {
      draft.fame = 999;
    });

    expect(state.roster[0]!.fame).toBe(0);
  });
});
