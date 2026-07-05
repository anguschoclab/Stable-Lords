import { describe, it, expect, beforeEach } from 'vitest';
import type { GameState, TournamentEntry, TournamentBout, Warrior } from '@/types/state.types';
import {
  FightingStyle,
  type WarriorId,
  type StableId,
  type TournamentId,
} from '@/types/shared.types';
import { makeWarrior } from '@/engine/factories/warriorFactory';
import { clearWarriorCache } from '@/engine/matchmaking/tournamentSelection/utils';
import { awardTournamentPrizes } from '@/engine/matchmaking/tournamentSelection/awards';

// ─── Constants ───

const PLAYER_ID = 'stable-player' as StableId;
const RIVAL_ID = 'stable-rival-1' as StableId;

// ─── Helpers ───

function makeBaseState(): GameState {
  return {
    meta: { gameName: 'Stable Lords', version: '1.0', createdAt: '' },
    player: {
      id: PLAYER_ID,
      name: 'Player',
      stableName: 'Player Stable',
      fame: 0,
      renown: 0,
      titles: 0,
    },
    week: 5,
    year: 1,
    treasury: 1000,
    fame: 0,
    popularity: 0,
    roster: [],
    rivals: [],
    arenaHistory: [],
    newsletter: [],
    gazettes: [],
    graveyard: [],
    retired: [],
    trainers: [],
    hiringPool: [],
    recruitPool: [],
    scoutReports: [],
    hallOfFame: [],
    tournaments: [],
    trainingAssignments: [],
    seasonalGrowth: [],
    restStates: [],
    rivalries: [],
    matchHistory: [],
    playerChallenges: [],
    playerAvoids: [],
    ownerGrudges: [],
    insightTokens: [],
    moodHistory: [],
    isFTUE: false,
    unacknowledgedDeaths: [],
    crowdMood: 'Calm',
    day: 0,
    isTournamentWeek: false,
    activeTournamentId: undefined,
    promoters: {},
    boutOffers: {},
    realmRankings: {},
    awards: [],
    phase: 'planning',
    season: 'Spring',
    weather: 'Clear',
    ledger: [],
    rosterBonus: 0,
    ftueComplete: true,
    ftueStep: 0,
    coachDismissed: [],
    rivalMap: new Map(),
    warriorMap: new Map(),
  } as unknown as GameState;
}

function makeTestWarrior(
  id: string,
  name: string,
  style: FightingStyle = FightingStyle.StrikingAttack,
  stableId: StableId = PLAYER_ID,
  overrides: Partial<Warrior> = {}
): Warrior {
  return makeWarrior(
    id as WarriorId,
    name,
    style,
    { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
    { stableId, ...overrides }
  );
}

function makeCompletedTournament(
  warriors: Warrior[],
  winnerFirst: 'A' | 'D' = 'A',
  winnerThird: 'A' | 'D' = 'A',
  tierId = 'Gold',
  tournamentId = 't-gold-spring-1'
): TournamentEntry {
  const wA = warriors[0]!;
  const wB = warriors[1]!;
  const wC = warriors[2]!;
  const wD = warriors[3]!;

  const bracket: TournamentBout[] = [
    {
      round: 6,
      matchIndex: 0,
      warriorIdA: wA.id,
      warriorIdD: wB.id,
      stableIdA: wA.stableId,
      stableIdD: wB.stableId,
      winner: winnerFirst,
      by: 'Stoppage',
    },
    {
      round: 6,
      matchIndex: 1,
      warriorIdA: wC.id,
      warriorIdD: wD.id,
      stableIdA: wC.stableId,
      stableIdD: wD.stableId,
      winner: winnerThird,
      by: 'Stoppage',
    },
  ];

  return {
    id: tournamentId as TournamentId,
    season: 'Spring',
    week: 1,
    tierId,
    name: 'Imperial Gold Cup',
    bracket,
    participants: warriors,
    completed: true,
    champion: winnerFirst === 'A' ? wA.name : wB.name,
  };
}

function makePlayerState(w1: Warrior, ...rivalWarriors: Warrior[]): GameState {
  const state = makeBaseState();
  state.roster = [w1];
  state.rivals = [
    {
      id: RIVAL_ID,
      owner: {
        id: RIVAL_ID,
        name: 'Rival',
        stableName: 'Rival Stable',
        fame: 0,
        renown: 0,
        titles: 0,
      },
      roster: rivalWarriors,
      treasury: 500,
      fame: 0,
    } as any,
  ];
  return state;
}

function makeFourWarriors(playerIndex = 0): [Warrior, Warrior, Warrior, Warrior] {
  return [
    makeTestWarrior('w1', 'Champ', FightingStyle.StrikingAttack, 0 === playerIndex ? PLAYER_ID : RIVAL_ID),
    makeTestWarrior('w2', 'Runner', FightingStyle.StrikingAttack, 1 === playerIndex ? PLAYER_ID : RIVAL_ID),
    makeTestWarrior('w3', 'Bronzer', FightingStyle.StrikingAttack, 2 === playerIndex ? PLAYER_ID : RIVAL_ID),
    makeTestWarrior('w4', 'Fourth', FightingStyle.StrikingAttack, 3 === playerIndex ? PLAYER_ID : RIVAL_ID),
  ];
}

function tokenTypesOf(state: GameState): string[] {
  return (state.insightTokens || []).map((t) => t.type);
}

// ─── Tests ───

beforeEach(() => {
  clearWarriorCache();
});

// ── Player token awards (real PatronTokenService) ──

describe('awardTournamentPrizes — player token awards by tier/place', () => {
  it('GOLD 1st place player receives 3 tokens: Weapon, Rhythm, Attribute', () => {
    const [w1, w2, w3, w4] = makeFourWarriors();
    const state = makePlayerState(w1, w2, w3, w4);
    const tournament = makeCompletedTournament([w1, w2, w3, w4], 'A', 'A', 'Gold');
    const updated = awardTournamentPrizes(tournament, state);
    expect(tokenTypesOf(updated)).toEqual(['Weapon', 'Rhythm', 'Attribute']);
  });

  it('GOLD 2nd place player receives 2 tokens: Weapon, Style', () => {
    const [w1, w2, w3, w4] = makeFourWarriors(1);
    const state = makePlayerState(w2, w1, w3, w4);
    const tournament = makeCompletedTournament([w1, w2, w3, w4], 'A', 'A', 'Gold');
    const updated = awardTournamentPrizes(tournament, state);
    // w2 is 2nd place (loser of finals)
    expect(tokenTypesOf(updated)).toEqual(['Weapon', 'Style']);
  });

  it('GOLD 3rd place player receives 1 token: Rhythm', () => {
    const [w1, w2, w3, w4] = makeFourWarriors(2);
    const state = makePlayerState(w3, w1, w2, w4);
    const tournament = makeCompletedTournament([w1, w2, w3, w4], 'A', 'A', 'Gold');
    const updated = awardTournamentPrizes(tournament, state);
    expect(tokenTypesOf(updated)).toEqual(['Rhythm']);
  });

  it('SILVER 1st place player receives 3 tokens: Weapon, Rhythm, Style', () => {
    const [w1, w2, w3, w4] = makeFourWarriors();
    const state = makePlayerState(w1, w2, w3, w4);
    const tournament = makeCompletedTournament([w1, w2, w3, w4], 'A', 'A', 'Silver', 't-silver-spring-1');
    const updated = awardTournamentPrizes(tournament, state);
    expect(tokenTypesOf(updated)).toEqual(['Weapon', 'Rhythm', 'Style']);
  });

  it('SILVER 2nd place player receives 1 token: Weapon', () => {
    const [w1, w2, w3, w4] = makeFourWarriors(1);
    const state = makePlayerState(w2, w1, w3, w4);
    const tournament = makeCompletedTournament([w1, w2, w3, w4], 'A', 'A', 'Silver', 't-silver-spring-1');
    const updated = awardTournamentPrizes(tournament, state);
    expect(tokenTypesOf(updated)).toEqual(['Weapon']);
  });

  it('SILVER 3rd place player receives 1 token: Style', () => {
    const [w1, w2, w3, w4] = makeFourWarriors(2);
    const state = makePlayerState(w3, w1, w2, w4);
    const tournament = makeCompletedTournament([w1, w2, w3, w4], 'A', 'A', 'Silver', 't-silver-spring-1');
    const updated = awardTournamentPrizes(tournament, state);
    expect(tokenTypesOf(updated)).toEqual(['Style']);
  });

  it('BRONZE 1st place player receives 2 tokens: Weapon, Rhythm', () => {
    const [w1, w2, w3, w4] = makeFourWarriors();
    const state = makePlayerState(w1, w2, w3, w4);
    const tournament = makeCompletedTournament([w1, w2, w3, w4], 'A', 'A', 'Bronze', 't-bronze-spring-1');
    const updated = awardTournamentPrizes(tournament, state);
    expect(tokenTypesOf(updated)).toEqual(['Weapon', 'Rhythm']);
  });

  it('BRONZE 2nd place player receives 1 token: Style', () => {
    const [w1, w2, w3, w4] = makeFourWarriors(1);
    const state = makePlayerState(w2, w1, w3, w4);
    const tournament = makeCompletedTournament([w1, w2, w3, w4], 'A', 'A', 'Bronze', 't-bronze-spring-1');
    const updated = awardTournamentPrizes(tournament, state);
    expect(tokenTypesOf(updated)).toEqual(['Style']);
  });

  it('BRONZE 3rd place player receives 1 token: Rhythm', () => {
    const [w1, w2, w3, w4] = makeFourWarriors(2);
    const state = makePlayerState(w3, w1, w2, w4);
    const tournament = makeCompletedTournament([w1, w2, w3, w4], 'A', 'A', 'Bronze', 't-bronze-spring-1');
    const updated = awardTournamentPrizes(tournament, state);
    expect(tokenTypesOf(updated)).toEqual(['Rhythm']);
  });

  it('IRON 1st place player receives 2 tokens: Weapon, Rhythm', () => {
    const [w1, w2, w3, w4] = makeFourWarriors();
    const state = makePlayerState(w1, w2, w3, w4);
    const tournament = makeCompletedTournament([w1, w2, w3, w4], 'A', 'A', 'Iron', 't-iron-spring-1');
    const updated = awardTournamentPrizes(tournament, state);
    expect(tokenTypesOf(updated)).toEqual(['Weapon', 'Rhythm']);
  });

  it('IRON 2nd place player receives 1 token: Style', () => {
    const [w1, w2, w3, w4] = makeFourWarriors(1);
    const state = makePlayerState(w2, w1, w3, w4);
    const tournament = makeCompletedTournament([w1, w2, w3, w4], 'A', 'A', 'Iron', 't-iron-spring-1');
    const updated = awardTournamentPrizes(tournament, state);
    expect(tokenTypesOf(updated)).toEqual(['Style']);
  });

  it('IRON 3rd place player receives 0 tokens', () => {
    const [w1, w2, w3, w4] = makeFourWarriors(2);
    const state = makePlayerState(w3, w1, w2, w4);
    const tournament = makeCompletedTournament([w1, w2, w3, w4], 'A', 'A', 'Iron', 't-iron-spring-1');
    const updated = awardTournamentPrizes(tournament, state);
    expect(tokenTypesOf(updated)).toEqual([]);
  });
});

// ── Player token properties ──

describe('awardTournamentPrizes — player token properties', () => {
  it('each token has correct type, warriorId="", warriorName="Unassigned"', () => {
    const [w1, w2, w3, w4] = makeFourWarriors();
    const state = makePlayerState(w1, w2, w3, w4);
    const tournament = makeCompletedTournament([w1, w2, w3, w4], 'A', 'A', 'Gold');
    const updated = awardTournamentPrizes(tournament, state);
    const tokens = updated.insightTokens || [];
    for (const token of tokens) {
      expect(token.warriorId).toBe('' as any);
      expect(token.warriorName).toBe('Unassigned');
    }
  });

  it('token source includes tournament name and place emoji', () => {
    const [w1, w2, w3, w4] = makeFourWarriors();
    const state = makePlayerState(w1, w2, w3, w4);
    const tournament = makeCompletedTournament([w1, w2, w3, w4], 'A', 'A', 'Gold');
    tournament.name = 'Test Cup';
    const updated = awardTournamentPrizes(tournament, state);
    const tokens = updated.insightTokens || [];
    // 1st place source = "Test Cup (🥇)"
    expect(tokens[0]!.detail).toContain('Test Cup');
    expect(tokens[0]!.detail).toContain('🥇');
  });

  it('token discoveredWeek matches state.week', () => {
    const [w1, w2, w3, w4] = makeFourWarriors();
    const state = makePlayerState(w1, w2, w3, w4);
    state.week = 7;
    const tournament = makeCompletedTournament([w1, w2, w3, w4], 'A', 'A', 'Gold');
    const updated = awardTournamentPrizes(tournament, state);
    const tokens = updated.insightTokens || [];
    for (const token of tokens) {
      expect(token.discoveredWeek).toBe(7);
    }
  });

  it('token detail format: "Awarded from ${source}"', () => {
    const [w1, w2, w3, w4] = makeFourWarriors();
    const state = makePlayerState(w1, w2, w3, w4);
    const tournament = makeCompletedTournament([w1, w2, w3, w4], 'A', 'A', 'Gold');
    tournament.name = 'Grand Prix';
    const updated = awardTournamentPrizes(tournament, state);
    const tokens = updated.insightTokens || [];
    expect(tokens[0]!.detail).toBe('Awarded from Grand Prix (🥇)');
  });

  it('PatronTokenService adds newsletter entries with title "Patronage Awarded"', () => {
    const [w1, w2, w3, w4] = makeFourWarriors();
    const state = makePlayerState(w1, w2, w3, w4);
    const tournament = makeCompletedTournament([w1, w2, w3, w4], 'A', 'A', 'Gold');
    const updated = awardTournamentPrizes(tournament, state);
    // 3 tokens for GOLD 1st place → 3 newsletter entries
    const patronageEntries = (updated.newsletter || []).filter(
      (n) => n.title === 'Patronage Awarded'
    );
    expect(patronageEntries.length).toBe(3);
  });
});

// ── Rival token effects (direct application) ──

describe('awardTournamentPrizes — rival token effects', () => {
  it('rival Weapon token sets favorites.discovered.weapon = true', () => {
    const [w1, w2, w3, w4] = makeFourWarriors();
    // w2 is rival, gets 2nd place in GOLD → tokens: Weapon, Style
    const state = makePlayerState(w1, w2, w3, w4);
    const tournament = makeCompletedTournament([w1, w2, w3, w4], 'A', 'A', 'Gold');
    const updated = awardTournamentPrizes(tournament, state);
    const rivalW2 = updated.rivals[0]!.roster.find((w) => w.id === 'w2')!;
    expect(rivalW2.favorites?.discovered.weapon).toBe(true);
  });

  it('rival Rhythm token sets favorites.discovered.rhythm = true', () => {
    const [w1, w2, w3, w4] = makeFourWarriors();
    // w3 is rival, gets 3rd place in GOLD → tokens: Rhythm
    const state = makePlayerState(w1, w2, w3, w4);
    const tournament = makeCompletedTournament([w1, w2, w3, w4], 'A', 'A', 'Gold');
    const updated = awardTournamentPrizes(tournament, state);
    const rivalW3 = updated.rivals[0]!.roster.find((w) => w.id === 'w3')!;
    expect(rivalW3.favorites?.discovered.rhythm).toBe(true);
  });

  it('rival Style token increments baseSkills.ATT by 1', () => {
    const [w1, w2, w3, w4] = makeFourWarriors();
    // w2 is rival, gets 2nd place in GOLD → tokens: Weapon, Style
    const state = makePlayerState(w1, w2, w3, w4);
    const tournament = makeCompletedTournament([w1, w2, w3, w4], 'A', 'A', 'Gold');
    const originalATT = w2.baseSkills?.ATT ?? 0;
    const updated = awardTournamentPrizes(tournament, state);
    const rivalW2 = updated.rivals[0]!.roster.find((w) => w.id === 'w2')!;
    expect(rivalW2.baseSkills!.ATT).toBe(originalATT + 1);
  });

  it('rival Attribute token increments one of ST/WT/SP/DF by 1', () => {
    const [w1, w2, w3, w4] = makeFourWarriors(3);
    // w1 is rival, gets 1st place in GOLD → tokens: Weapon, Rhythm, Attribute
    const state = makePlayerState(w4, w1, w2, w3);
    // w1 is rival, gets 1st place in GOLD → tokens: Weapon, Rhythm, Attribute
    const tournament = makeCompletedTournament([w1, w2, w3, w4], 'A', 'A', 'Gold');
    const originalAttrs = { ...w1.attributes };
    const updated = awardTournamentPrizes(tournament, state);
    const rivalRoster = updated.rivals[0]!.roster;
    const rivalW1 = rivalRoster.find((w) => w.id === 'w1')!;
    const primaries = ['ST', 'WT', 'SP', 'DF'] as const;
    const incremented = primaries.filter(
      (k) => rivalW1.attributes[k] > (originalAttrs[k] ?? 10)
    );
    expect(incremented.length).toBe(1);
  });

  it('IRON 3rd place rival receives no token effects', () => {
    const [w1, w2, w3, w4] = makeFourWarriors();
    // w3 is rival, gets 3rd place in IRON → tokens: [] (empty)
    const state = makePlayerState(w1, w2, w3, w4);
    const tournament = makeCompletedTournament([w1, w2, w3, w4], 'A', 'A', 'Iron', 't-iron-spring-1');
    const originalWeapon = w3.favorites?.discovered.weapon;
    const originalRhythm = w3.favorites?.discovered.rhythm;
    const updated = awardTournamentPrizes(tournament, state);
    const rivalW3 = updated.rivals[0]!.roster.find((w) => w.id === 'w3')!;
    expect(rivalW3.favorites?.discovered.weapon).toBe(originalWeapon);
    expect(rivalW3.favorites?.discovered.rhythm).toBe(originalRhythm);
  });
});

// ── Edge cases ──

describe('awardTournamentPrizes — edge cases', () => {
  it('no finals match returns state unchanged', () => {
    const warriors = makeFourWarriors();
    const w1 = warriors[0];
    const w2 = warriors[1];
    const state = makePlayerState(w1, w2);
    const tournament: TournamentEntry = {
      id: 't-gold-spring-1' as TournamentId,
      season: 'Spring',
      week: 1,
      tierId: 'Gold',
      name: 'Test Cup',
      bracket: [], // no bouts at all
      participants: [w1, w2],
      completed: true,
    };
    const updated = awardTournamentPrizes(tournament, state);
    // Should return the same state (no awards applied)
    expect(updated.treasury).toBe(state.treasury);
    expect(updated.insightTokens).toEqual([]);
  });

  it('warrior not found in processTournamentPlaceAward returns state unchanged for that warrior', () => {
    const [w1, w2, w3, w4] = makeFourWarriors();
    const state = makePlayerState(w1, w2, w3, w4);
    // Create tournament with warrior IDs that don't exist in roster/rivals
    const tournament: TournamentEntry = {
      id: 't-gold-spring-1' as TournamentId,
      season: 'Spring',
      week: 1,
      tierId: 'Gold',
      name: 'Ghost Cup',
      bracket: [
        {
          round: 6,
          matchIndex: 0,
          warriorIdA: 'ghost-1' as WarriorId,
          warriorIdD: 'ghost-2' as WarriorId,
          winner: 'A',
          by: 'Stoppage',
        },
        {
          round: 6,
          matchIndex: 1,
          warriorIdA: 'ghost-3' as WarriorId,
          warriorIdD: 'ghost-4' as WarriorId,
          winner: 'A',
          by: 'Stoppage',
        },
      ],
      participants: [],
      completed: true,
    };
    const updated = awardTournamentPrizes(tournament, state);
    // No awards applied since warriors not found
    expect(updated.treasury).toBe(state.treasury);
    expect(updated.insightTokens).toEqual([]);
  });

  it('winner D in finals → first=warriorIdD, second=warriorIdA', () => {
    const [w1, w2, w3, w4] = makeFourWarriors();
    // w1 is player (warriorIdA), w2 is rival (warriorIdD)
    // Winner = D → w2 is first, w1 is second
    const state = makePlayerState(w1, w2, w3, w4);
    const tournament = makeCompletedTournament([w1, w2, w3, w4], 'D', 'A', 'Gold');
    const updated = awardTournamentPrizes(tournament, state);
    // w2 (rival) gets 1st place gold medal, w1 (player) gets 2nd silver
    const playerW1 = updated.roster.find((w) => w.id === 'w1')!;
    expect(playerW1.career.medals?.silver).toBe(1);
    expect(playerW1.career.medals?.gold).toBe(0);
    const rivalW2 = updated.rivals[0]!.roster.find((w) => w.id === 'w2')!;
    expect(rivalW2.career.medals?.gold).toBe(1);
  });

  it('winner D in bronze → third=warriorIdD', () => {
    const [w1, w2, w3, w4] = makeFourWarriors();
    // Bronze: w3 (A) vs w4 (D), winner = D → w4 is third
    const state = makePlayerState(w1, w2, w3, w4);
    const tournament = makeCompletedTournament([w1, w2, w3, w4], 'A', 'D', 'Gold');
    const updated = awardTournamentPrizes(tournament, state);
    // w4 gets bronze medal
    const rivalW4 = updated.rivals[0]!.roster.find((w) => w.id === 'w4')!;
    expect(rivalW4.career.medals?.bronze).toBe(1);
    // w3 does NOT get bronze
    const rivalW3 = updated.rivals[0]!.roster.find((w) => w.id === 'w3')!;
    expect(rivalW3.career.medals?.bronze).toBeUndefined();
  });

  it('state.fame updated for player winner (not just warrior fame)', () => {
    const [w1, w2, w3, w4] = makeFourWarriors();
    const state = makePlayerState(w1, w2, w3, w4);
    state.fame = 50;
    const tournament = makeCompletedTournament([w1, w2, w3, w4], 'A', 'A', 'Gold');
    const updated = awardTournamentPrizes(tournament, state);
    // 1st place → +100 fame to state.fame
    expect(updated.fame).toBe(150);
  });

  it('state.player.fame updated for player winner', () => {
    const [w1, w2, w3, w4] = makeFourWarriors();
    const state = makePlayerState(w1, w2, w3, w4);
    state.player.fame = 20;
    const tournament = makeCompletedTournament([w1, w2, w3, w4], 'A', 'A', 'Gold');
    const updated = awardTournamentPrizes(tournament, state);
    // 1st place → +100 fame to player.fame
    expect(updated.player.fame).toBe(120);
  });

  it('ledger entry label format: "${tournament.name} (${place}${st|nd|rd})"', () => {
    const [w1, w2, w3, w4] = makeFourWarriors();
    const state = makePlayerState(w1, w2, w3, w4);
    const tournament = makeCompletedTournament([w1, w2, w3, w4], 'A', 'A', 'Gold');
    tournament.name = 'Grand Prix';
    const updated = awardTournamentPrizes(tournament, state);
    const prizeEntries = updated.ledger.filter((l) => l.category === 'prize');
    // 1st place label: "Grand Prix (1st)"
    expect(prizeEntries.some((l) => l.label === 'Grand Prix (1st)')).toBe(true);
  });

  it('ledger entry amount = Math.floor(basePurse * multiplier)', () => {
    const [w1, w2, w3, w4] = makeFourWarriors();
    const state = makePlayerState(w1, w2, w3, w4);
    state.treasury = 0;
    // GOLD basePurse = 5000, 1st = 1.0 → 5000
    const tournament = makeCompletedTournament([w1, w2, w3, w4], 'A', 'A', 'Gold');
    const updated = awardTournamentPrizes(tournament, state);
    const firstPrize = updated.ledger.find((l) => l.label.includes('1st'));
    expect(firstPrize!.amount).toBe(5000);
  });

  it('tier derived from tournament ID when tierId absent', () => {
    const [w1, w2, w3, w4] = makeFourWarriors();
    const state = makePlayerState(w1, w2, w3, w4);
    state.treasury = 0;
    // ID = "t-silver-spring-1" → tierId absent → split('-')[1] = "silver" → SILVER → 2500
    const tournament = makeCompletedTournament([w1, w2, w3, w4], 'A', 'A', '', 't-silver-spring-1');
    tournament.tierId = '';
    const updated = awardTournamentPrizes(tournament, state);
    // 1st place SILVER → 2500
    expect(updated.treasury).toBe(2500);
  });

  it('tier defaults to IRON when neither tierId nor ID segment contains tier keyword', () => {
    const [w1, w2, w3, w4] = makeFourWarriors();
    const state = makePlayerState(w1, w2, w3, w4);
    state.treasury = 0;
    // ID = "t-unknown-spring-1" → tierId absent → split('-')[1] = "unknown" → IRON → 600
    const tournament = makeCompletedTournament([w1, w2, w3, w4], 'A', 'A', '', 't-unknown-spring-1');
    tournament.tierId = '';
    const updated = awardTournamentPrizes(tournament, state);
    // 1st place IRON → 600
    expect(updated.treasury).toBe(600);
  });

  it('purse amounts: GOLD=5000, SILVER=2500, BRONZE=1200, IRON=600', () => {
    const [w1, w2, w3, w4] = makeFourWarriors();
    const stateGold = makePlayerState(w1, w2, w3, w4);
    stateGold.treasury = 0;
    const tGold = makeCompletedTournament([w1, w2, w3, w4], 'A', 'A', 'Gold');
    expect(awardTournamentPrizes(tGold, stateGold).treasury).toBe(5000);

    const stateSilver = makePlayerState(w1, w2, w3, w4);
    stateSilver.treasury = 0;
    const tSilver = makeCompletedTournament([w1, w2, w3, w4], 'A', 'A', 'Silver', 't-silver-1');
    expect(awardTournamentPrizes(tSilver, stateSilver).treasury).toBe(2500);

    const stateBronze = makePlayerState(w1, w2, w3, w4);
    stateBronze.treasury = 0;
    const tBronze = makeCompletedTournament([w1, w2, w3, w4], 'A', 'A', 'Bronze', 't-bronze-1');
    expect(awardTournamentPrizes(tBronze, stateBronze).treasury).toBe(1200);

    const stateIron = makePlayerState(w1, w2, w3, w4);
    stateIron.treasury = 0;
    const tIron = makeCompletedTournament([w1, w2, w3, w4], 'A', 'A', 'Iron', 't-iron-1');
    expect(awardTournamentPrizes(tIron, stateIron).treasury).toBe(600);
  });

  it('purse multipliers: 1st=1.0, 2nd=0.5, 3rd=0.25 (floored)', () => {
    // Player gets 2nd place (w2 loses finals)
    const warriors2nd = makeFourWarriors(1);
    const w2nd = warriors2nd[1];
    const state2nd = makePlayerState(w2nd, warriors2nd[0], warriors2nd[2], warriors2nd[3]);
    state2nd.treasury = 0;
    const t2nd = makeCompletedTournament(warriors2nd, 'A', 'A', 'Gold');
    // 2nd place GOLD → 5000 * 0.5 = 2500
    expect(awardTournamentPrizes(t2nd, state2nd).treasury).toBe(2500);

    // Player gets 3rd place (w3 wins bronze)
    const warriors3rd = makeFourWarriors(2);
    const w3rd = warriors3rd[2];
    const state3rd = makePlayerState(w3rd, warriors3rd[0], warriors3rd[1], warriors3rd[3]);
    state3rd.treasury = 0;
    const t3rd = makeCompletedTournament(warriors3rd, 'A', 'A', 'Gold');
    // 3rd place GOLD → Math.floor(5000 * 0.25) = 1250
    expect(awardTournamentPrizes(t3rd, state3rd).treasury).toBe(1250);
  });

  it('medals initialized when undefined', () => {
    const [w1, w2, w3, w4] = makeFourWarriors();
    // Remove medals from warrior
    w1.career = { wins: 0, losses: 0, kills: 0 };
    const state = makePlayerState(w1, w2, w3, w4);
    const tournament = makeCompletedTournament([w1, w2, w3, w4], 'A', 'A', 'Gold');
    const updated = awardTournamentPrizes(tournament, state);
    const playerW1 = updated.roster.find((w) => w.id === 'w1')!;
    expect(playerW1.career.medals).toBeDefined();
    expect(playerW1.career.medals!.gold).toBe(1);
    expect(playerW1.career.medals!.silver).toBe(0);
    expect(playerW1.career.medals!.bronze).toBe(0);
  });

  it('warrior fame initialized when undefined (|| 0 path)', () => {
    const [w1, w2, w3, w4] = makeFourWarriors();
    // Set fame to undefined
    w1.fame = undefined as any;
    const state = makePlayerState(w1, w2, w3, w4);
    const tournament = makeCompletedTournament([w1, w2, w3, w4], 'A', 'A', 'Gold');
    const updated = awardTournamentPrizes(tournament, state);
    const playerW1 = updated.roster.find((w) => w.id === 'w1')!;
    // 1st place → +100 fame, starting from 0 (undefined → 0)
    expect(playerW1.fame).toBe(100);
  });
});
