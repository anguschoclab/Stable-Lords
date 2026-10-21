import { describe, it, expect, vi } from 'vitest';
import type { Warrior, TournamentBout } from '@/types/state.types';
import {
  TOURNEY_RIVAL_ID,
  makeAlternatingField,
  makeSplitTournamentState,
} from '@/test/_fixtures/tournamentState';
import { simulateFight } from '@/engine/simulate';

vi.mock('@/engine/simulate', () => ({ ...__SHARED_MOCKS.tournamentSimulate }));
vi.mock('@/engine', () => ({ ...__SHARED_MOCKS.tournamentEngine }));
vi.mock('@/engine/tokens/patronTokenService', () => ({ ...__SHARED_MOCKS.patronTokenService }));
vi.mock('@/engine/core/warriorLookup', () => ({ ...__SHARED_MOCKS.tournamentWarriorLookup }));

import {
  resolveRound,
  resolveCompleteTournament,
} from '@/engine/matchmaking/tournamentSelection/resolution';

const RIVAL_ID = TOURNEY_RIVAL_ID;

describe('odd-sized fields — the tail entrant gets a real bye', () => {
  it('a mid-bracket bye recipient actually advances to the next round', () => {
    // 6-man bracket: R1 leaves 3 winners → R2 = 1 real bout + 1 bye →
    // the bye recipient must meet the real-bout winner in the R3 final.
    const warriors = makeAlternatingField(6);
    const state = makeSplitTournamentState(warriors);

    const updated = resolveCompleteTournament(state, state.tournaments[0]!.id, 99);
    const after = updated.tournaments![0]!;

    expect(after.completed).toBe(true);
    // simulateFight mock always resolves 'A': R1 winners are w0, w2, w4;
    // w4 takes the R2 bye and must reach the R3 final against w0.
    const finals = after.bracket.find((b) => b.round === 3 && !b.isBronzeMatch);
    expect(finals).toBeDefined();
    expect([finals!.warriorIdA, finals!.warriorIdD]).toContain('w4');
    expect(after.champion).toBe('Warrior 0');
  });
});

describe('resolveRound — full bracket completes in 6 rounds', () => {
  const stopOutcome = {
    winner: 'A' as const,
    by: 'Stoppage' as const,
    minutes: 1,
    log: [],
    exchangeLog: [],
    post: { tags: [] },
  };

  it('64-slot bracket finishes in 6 rounds; bronze winner does not advance', () => {
    // Earlier tests leave simulateFight mocked to 'Kill' — restore Stoppage.
    vi.mocked(simulateFight).mockReturnValue(stopOutcome as any);
    const warriors = makeAlternatingField(64, {
      idPrefix: 'bw',
      namePrefix: 'Bracket Warrior',
    });
    let state = makeSplitTournamentState(warriors);
    let tour = state.tournaments[0]!;

    let rounds = 0;
    for (let i = 0; i < 10 && !tour.completed; i++) {
      const res = resolveRound(state, tour.id, 1000 + i, true, tour);
      state = res.updatedState;
      tour = res.updatedTournament ?? tour;
      rounds++;
    }

    // Six playable days in a tournament week — the bracket MUST finish in 6.
    expect(rounds).toBe(6);
    expect(tour.completed).toBe(true);
    expect(tour.champion).toBeTruthy();

    // No phantom round-7 championship rematch.
    expect(tour.bracket.some((b: TournamentBout) => b.round >= 7)).toBe(false);
    // 32 + 16 + 8 + 4 + 2 + finals + 3rd-place = 64 bouts.
    expect(tour.bracket.length).toBe(64);

    // Champion is the finals winner, not the third-place winner.
    const finals = tour.bracket.find((b: TournamentBout) => b.round === 6 && b.matchIndex === 0);
    const bronze = tour.bracket.find((b: TournamentBout) => b.round === 6 && b.matchIndex === 1);
    expect(finals?.winner).toBeDefined();
    expect(bronze?.winner).toBeDefined();
    expect(bronze?.isBronzeMatch).toBe(true);
    const champId = finals!.winner === 'A' ? finals!.warriorIdA : finals!.warriorIdD;
    const champWarrior = warriors.find((w) => w.id === champId);
    expect(tour.champion).toBe(champWarrior?.name);
  });

  it('8-man bracket produces a flagged bronze playoff', () => {
    vi.mocked(simulateFight).mockReturnValue(stopOutcome as any);
    const warriors = makeAlternatingField(8, {
      idPrefix: 'bw',
      namePrefix: 'Bracket Warrior',
    });
    let state = makeSplitTournamentState(warriors);
    let tour = state.tournaments[0]!;

    for (let i = 0; i < 10 && !tour.completed; i++) {
      const res = resolveRound(state, tour.id, 4000 + i, true, tour);
      state = res.updatedState;
      tour = res.updatedTournament ?? tour;
    }

    // R1 quarters (4) → R2 semis (2) → R3 finals + bronze = 8 bouts.
    expect(tour.bracket.length).toBe(8);
    expect(tour.completed).toBe(true);

    const bronze = tour.bracket.find((b: TournamentBout) => b.isBronzeMatch);
    expect(bronze).toBeDefined();
    expect(bronze!.round).toBe(3);
    expect(bronze!.matchIndex).toBe(1);
    expect(bronze!.winner).toBeDefined();
    // The bronze playoff must not feed a phantom extra round.
    expect(tour.bracket.some((b: TournamentBout) => b.round > 3)).toBe(false);
  });

  it('4-man bracket (semis in round 1) still produces bronze + awards 3rd', () => {
    vi.mocked(simulateFight).mockReturnValue(stopOutcome as any);
    const warriors = makeAlternatingField(4, {
      idPrefix: 'bw',
      namePrefix: 'Bracket Warrior',
    });
    let state = makeSplitTournamentState(warriors);
    let tour = state.tournaments[0]!;

    for (let i = 0; i < 10 && !tour.completed; i++) {
      const res = resolveRound(state, tour.id, 5000 + i, true, tour);
      state = res.updatedState;
      tour = res.updatedTournament ?? tour;
    }

    // R1 semis (2) → R2 finals + bronze = 4 bouts.
    expect(tour.bracket.length).toBe(4);
    expect(tour.completed).toBe(true);
    const bronze = tour.bracket.find((b: TournamentBout) => b.isBronzeMatch);
    expect(bronze).toBeDefined();
    const bronzeWinner = bronze!.winner === 'A' ? bronze!.warriorIdA : bronze!.warriorIdD;
    const podium = state.rivals[0]!.roster.concat(state.roster);
    const third = podium.find((w: Warrior) => w.id === bronzeWinner);
    expect(third?.career.medals?.bronze).toBe(1);
  });

  it('prizes land on NPC winners — rival stable gets purse + fame + token effects', () => {
    vi.mocked(simulateFight).mockReturnValue(stopOutcome as any);
    // slot-A warriors are all rivals → with winner 'A' every podium finisher is an NPC.
    const warriors = makeAlternatingField(64, {
      idPrefix: 'bw',
      namePrefix: 'Bracket Warrior',
      aSide: 'rival',
    });
    let state = makeSplitTournamentState(warriors);
    let tour = state.tournaments[0]!;

    const preTreasury = state.rivals[0]!.treasury;
    const preFame = state.rivals[0]!.fame;

    for (let i = 0; i < 10 && !tour.completed; i++) {
      const res = resolveRound(state, tour.id, 2000 + i, true, tour);
      state = res.updatedState;
      tour = res.updatedTournament ?? tour;
    }

    expect(tour.completed).toBe(true);

    const finals = tour.bracket.find((b: TournamentBout) => b.round === 6 && b.matchIndex === 0);
    const bronze = tour.bracket.find((b: TournamentBout) => b.isBronzeMatch);
    const podium = [
      {
        id: finals!.winner === 'A' ? finals!.warriorIdA : finals!.warriorIdD,
        purse: 5000,
        fame: 100,
        medal: 'gold' as const,
      },
      {
        id: finals!.winner === 'A' ? finals!.warriorIdD : finals!.warriorIdA,
        purse: 2500,
        fame: 50,
        medal: 'silver' as const,
      },
      {
        id: bronze!.winner === 'A' ? bronze!.warriorIdA : bronze!.warriorIdD,
        purse: 1250,
        fame: 25,
        medal: 'bronze' as const,
      },
    ];

    // Purse + fame follow each podium finisher's stable.
    let rivalGold = 0;
    let rivalFame = 0;
    let playerGold = 0;
    for (const p of podium) {
      const w = warriors.find((x) => x.id === p.id)!;
      if (w.stableId === RIVAL_ID) {
        rivalGold += p.purse;
        rivalFame += p.fame;
      } else {
        playerGold += p.purse;
      }

      // Medal lands on the warrior in whichever roster owns them.
      const updated =
        state.rivals[0]!.roster.find((x: Warrior) => x.id === p.id) ??
        state.roster.find((x) => x.id === p.id)!;
      expect(updated?.career.medals?.[p.medal]).toBe(1);
    }

    expect(state.rivals[0]!.treasury).toBe(preTreasury + rivalGold);
    expect(state.rivals[0]!.fame).toBe(preFame + rivalFame);
    expect(state.treasury).toBe(1000 + playerGold);
    // Every NPC podium finisher belongs to the one rival here — the NPC path
    // must have paid out.
    expect(rivalGold).toBeGreaterThan(0);

    // Token effects are applied directly to the NPC champion (no UI token pool):
    // Gold 1st place = Weapon + Rhythm + Attribute.
    const champ = state.rivals[0]!.roster.find((x: Warrior) => x.id === podium[0]!.id)!;
    expect(champ.favorites?.discovered.weapon).toBe(true);
    expect(champ.favorites?.discovered.rhythm).toBe(true);
    expect(Object.values(champ.attributes).some((v) => v > 10)).toBe(true);
  });
});
