import { describe, it, expect } from 'vitest';
import {
  computeAlmanac,
  computeCareerBoards,
  computeAccoladeBoards,
  computeChampionshipBoards,
  computeStreakBoards,
  computeStyleArenaBoards,
  computeFightBoards,
  computeStableBoards,
  computeWorldStats,
  type AlmanacBoard,
  type AlmanacInput,
} from '@/engine/analytics/almanac';
import { makeWarrior, makeFightSummary, makeRival } from '@/test/_fixtures/factories';
import type { Warrior } from '@/types/warrior.types';
import type { AnnualAward, ArenaTitle, TournamentEntry } from '@/types/state.types';
import type { FightSummary } from '@/types/combat.types';
import type { HallEntry } from '@/types/state/game';
import { FightingStyle } from '@/types/shared.types';
import type { WarriorId, StableId, FightId } from '@/types/shared.types';

/* ── helpers ─────────────────────────────────────────────────────────── */

const w = (
  id: string,
  over: Omit<Partial<Warrior>, 'career'> & { career?: Partial<Warrior['career']> } = {}
): Warrior => {
  const { career, ...rest } = over;
  return makeWarrior({
    id: id as WarriorId,
    name: over.name ?? `Name-${id}`,
    ...(career ? { career: Object.assign({ wins: 0, losses: 0, kills: 0 }, career) } : {}),
    ...rest,
  });
};

const fight = (id: string, over: Partial<FightSummary> = {}): FightSummary =>
  makeFightSummary({ id: id as FightId, ...over });

const input = (over: Partial<AlmanacInput> = {}): AlmanacInput => ({
  warriors: [],
  playerStableId: 'p1',
  stableNameById: new Map([['p1', 'Player Stable']]),
  ...over,
});

const board = (boards: AlmanacBoard[], id: string) =>
  boards.find((b) => b.id === id) as AlmanacBoard;

/* ── §1 career boards ────────────────────────────────────────────────── */

describe('computeCareerBoards', () => {
  const warriors = [
    w('w1', { career: { wins: 82, losses: 34, kills: 7 }, fame: 287, stableId: 'p1' as StableId }),
    w('w2', { career: { wins: 44, losses: 21, kills: 1 }, fame: 176 }),
    w('w3', { career: { wins: 9, losses: 12, kills: 2 }, fame: 31 }),
    w('w4', { career: { wins: 0, losses: 4, kills: 0 }, fame: 2 }),
    w('w5', { career: { wins: 82, losses: 10, kills: 20 }, fame: 100 }), // ties w1 on wins
  ];

  it('ranks Most Wins desc with kills tiebreak', () => {
    const b = board(computeCareerBoards(input({ warriors })), 'wins');
    expect(b.rows.map((r) => r.warriorId)).toEqual(['w5', 'w1', 'w2', 'w3']);
    expect(b.rows[0]?.value).toBe(82);
    // zero-bout warriors excluded
    expect(b.rows.some((r) => r.warriorId === 'w4')).toBe(false);
  });

  it('flags isPlayer rows and resolves stable names', () => {
    const b = board(computeCareerBoards(input({ warriors })), 'wins');
    const p1 = b.rows.find((r) => r.warriorId === 'w1');
    expect(p1?.isPlayer).toBe(true);
    expect(p1?.sub).toBe('Player Stable');
  });

  it('ranks Best Win Rate only over >=10-bout careers', () => {
    const b = board(computeCareerBoards(input({ warriors })), 'winRate');
    const ids = b.rows.map((r) => r.warriorId);
    expect(ids).toContain('w5'); // 82/(82+10) ≈ .89 top
    expect(ids).not.toContain('w3'); // 21 bouts but low rate — ordering check below
    expect(ids).not.toContain('w4'); // <10 bouts
    expect(ids[0]).toBe('w5');
    expect(ids.indexOf('w1')).toBeLessThan(ids.indexOf('w2'));
  });

  it('ranks Kill Efficiency by kills-per-bout with gates', () => {
    const b = board(computeCareerBoards(input({ warriors })), 'killEfficiency');
    const ids = b.rows.map((r) => r.warriorId);
    expect(ids[0]).toBe('w5'); // 20/92
    expect(ids).toContain('w1'); // 7/116
    expect(ids).not.toContain('w2'); // 1 kill over 65 — included? check rate ordering
    expect(ids).not.toContain('w4'); // 0 kills
  });

  it('ranks Most Kills desc with wins tiebreak', () => {
    const b = board(computeCareerBoards(input({ warriors })), 'kills');
    expect(b.rows[0]?.warriorId).toBe('w5');
    expect(b.rows[0]?.value).toBe(20);
  });

  it('ranks Highest Fame desc', () => {
    const b = board(computeCareerBoards(input({ warriors })), 'fame');
    expect(b.rows[0]?.warriorId).toBe('w1');
    expect(b.rows[0]?.value).toBe(287);
  });

  it('orders Most Decorated lexicographically gold>silver>bronze', () => {
    const ws = [
      w('m1', { career: { wins: 5, losses: 5, medals: { gold: 0, silver: 9, bronze: 9 } } }),
      w('m2', { career: { wins: 5, losses: 5, medals: { gold: 1, silver: 0, bronze: 0 } } }),
      w('m3', { career: { wins: 5, losses: 5, medals: { gold: 1, silver: 1, bronze: 0 } } }),
      w('m4', { career: { wins: 5, losses: 5 } }),
    ];
    const b = board(computeCareerBoards(input({ warriors: ws })), 'medals');
    expect(b.rows.map((r) => r.warriorId)).toEqual(['m3', 'm2', 'm1']);
    expect(b.rows.some((r) => r.warriorId === 'm4')).toBe(false);
    expect(b.rows[0]?.extra?.gold).toBe(1);
  });

  it('ranks Most Honored by awards count then titles', () => {
    const award = (y: number): AnnualAward =>
      ({ year: y, type: 'CLASS_MVP', value: 1, reason: 'x' }) as AnnualAward;
    const ws = [
      w('a1', { career: { wins: 1, losses: 1 }, awards: [award(1), award(2)] }),
      w('a2', {
        career: { wins: 1, losses: 1 },
        awards: [award(1)],
        titles: ['T1', 'T2', 'T3'],
      }),
      w('a3', { career: { wins: 1, losses: 1 }, awards: [award(1)], titles: ['T1'] }),
    ];
    const b = board(computeCareerBoards(input({ warriors: ws })), 'honors');
    expect(b.rows.map((r) => r.warriorId)).toEqual(['a1', 'a2', 'a3']);
    expect(b.rows[0]?.value).toBe(2);
  });

  it('keeps Undefeated to zero-loss warriors with >=3 wins', () => {
    const ws = [
      w('u1', { career: { wins: 7, losses: 0, kills: 0 } }),
      w('u2', { career: { wins: 2, losses: 0, kills: 0 } }),
      w('u3', { career: { wins: 20, losses: 1, kills: 0 } }),
    ];
    const b = board(computeCareerBoards(input({ warriors: ws })), 'undefeated');
    expect(b.rows.map((r) => r.warriorId)).toEqual(['u1']);
  });

  it('produces a deterministic total order ending in id on full ties', () => {
    const ws = [
      w('z3', { career: { wins: 5, losses: 5, kills: 1 }, fame: 10 }),
      w('z1', { career: { wins: 5, losses: 5, kills: 1 }, fame: 10 }),
      w('z2', { career: { wins: 5, losses: 5, kills: 1 }, fame: 10 }),
    ];
    const b = board(computeCareerBoards(input({ warriors: ws })), 'wins');
    expect(b.rows.map((r) => r.warriorId)).toEqual(['z1', 'z2', 'z3']);
  });

  it('bounds career boards at topN (default 100)', () => {
    const many = Array.from({ length: 150 }, (_, i) =>
      w(`m${String(i).padStart(3, '0')}`, { career: { wins: i, losses: 0 } })
    );
    const b = board(computeCareerBoards(input({ warriors: many })), 'wins');
    expect(b.rows).toHaveLength(100);
    const small = board(computeCareerBoards(input({ warriors: many, topN: 5 })), 'wins');
    expect(small.rows).toHaveLength(5);
    expect(small.rows[0]?.warriorId).toBe('m149');
  });

  it('marks dead and retired warriors in status', () => {
    const ws = [
      w('d1', { career: { wins: 9, losses: 1 }, status: 'Dead', isDead: true }),
      w('r1', { career: { wins: 8, losses: 1 }, status: 'Retired' }),
    ];
    const b = board(computeCareerBoards(input({ warriors: ws })), 'wins');
    expect(b.rows.find((r) => r.warriorId === 'd1')?.status).toBe('Dead');
    expect(b.rows.find((r) => r.warriorId === 'r1')?.status).toBe('Retired');
  });
});

/* ── §2 accolade rolls ───────────────────────────────────────────────── */

describe('computeAccoladeBoards', () => {
  const awards: AnnualAward[] = [
    { year: 1, type: 'WARRIOR_OF_YEAR', warriorName: 'Champ One', value: 30, reason: 'wins' },
    { year: 2, type: 'WARRIOR_OF_YEAR', warriorName: 'Champ Two', value: 33, reason: 'wins' },
    { year: 2, type: 'KILLER_OF_YEAR', warriorName: 'Reaper', value: 8, reason: 'kills' },
    { year: 2, type: 'STABLE_OF_YEAR', stableName: 'Iron Gale', value: 40, reason: 'stable' },
    { year: 2, type: 'CLASS_MVP', warriorName: 'Stylist', value: 12, reason: 'style' },
    { year: 2, type: 'TOURNAMENT_RANK', warriorName: 'Medalist', value: 9, reason: 'medals' },
  ] as AnnualAward[];

  it('emits one roll board per award type present, newest year first', () => {
    const boards = computeAccoladeBoards(input({ awards }));
    const ids = boards.map((b) => b.id);
    expect(ids).toContain('accolade-WARRIOR_OF_YEAR');
    expect(ids).toContain('accolade-KILLER_OF_YEAR');
    expect(ids).toContain('accolade-STABLE_OF_YEAR');
    const woty = board(boards, 'accolade-WARRIOR_OF_YEAR');
    expect(woty.rows.map((r) => r.name)).toEqual(['Champ Two', 'Champ One']);
    expect(woty.rows[0]?.sub).toContain('Year 2');
  });

  it('renders stable-level awards from stableName', () => {
    const soty = board(computeAccoladeBoards(input({ awards })), 'accolade-STABLE_OF_YEAR');
    expect(soty.rows[0]?.name).toBe('Iron Gale');
  });

  it('returns no boards when awards is empty', () => {
    expect(computeAccoladeBoards(input({ awards: [] }))).toEqual([]);
  });
});

/* ── §3 championship lineage ─────────────────────────────────────────── */

describe('computeChampionshipBoards', () => {
  const arenaChampions: Record<string, ArenaTitle> = {
    arena_a: {
      champion: { warriorId: 'w1' as WarriorId, startedAbsoluteWeek: 90, defenses: 3, lastActivityWeek: 100 },
      status: 'active',
      refusals: 0,
      deferrals: 0,
      noContenderStreak: 0,
      declinedContenders: {},
      history: [
        {
          warriorId: 'w9' as WarriorId,
          warriorName: 'Old King',
          stableName: 'Iron Gale',
          startedAbsoluteWeek: 10,
          endedAbsoluteWeek: 60,
          endReason: 'defeated',
          defenses: 7,
        },
        {
          warriorId: 'w8' as WarriorId,
          warriorName: 'Brief',
          startedAbsoluteWeek: 61,
          endedAbsoluteWeek: 65,
          endReason: 'died',
          defenses: 0,
        },
      ],
    },
    arena_b: {
      champion: { warriorId: 'w1' as WarriorId, startedAbsoluteWeek: 95, defenses: 1, lastActivityWeek: 100 },
      status: 'dormant',
      refusals: 0,
      deferrals: 0,
      noContenderStreak: 0,
      declinedContenders: {},
      history: [
        {
          warriorId: 'w9' as WarriorId,
          warriorName: 'Old King',
          stableName: 'Iron Gale',
          startedAbsoluteWeek: 20,
          endedAbsoluteWeek: 45,
          endReason: 'retired',
          defenses: 2,
        },
      ],
    },
  } as unknown as Record<string, ArenaTitle>;

  const grandChampions = [
    { tournamentId: 't1', year: 1, warriorId: 'w9' as WarriorId, warriorName: 'Old King', stableName: 'Iron Gale' },
    { tournamentId: 't2', year: 2, warriorId: 'w1' as WarriorId, warriorName: 'Champ', stableName: 'Player Stable' },
  ];

  const tournaments = [
    { id: 't1', name: 'Spring Invitational', champion: 'Old King', completed: true, tierId: 'regional', season: 'Spring', week: 13 },
    { id: 't2', name: 'Live Tourney', completed: false, tierId: 'regional', season: 'Summer', week: 20 },
    { id: 't3', name: 'Fall Classic', champion: 'Old King', completed: true, tierId: 'national', season: 'Fall', week: 39 },
  ] as unknown as TournamentEntry[];

  const ctx = input({ arenaChampions, grandChampions, tournaments, absoluteWeek: 100 });

  it('lists current champions with live reign weeks and defenses', () => {
    const b = board(computeChampionshipBoards(ctx), 'currentChampions');
    expect(b.rows).toHaveLength(2);
    expect(b.rows[0]?.name).toBeDefined();
    expect(b.rows[0]?.extra?.defenses).toBe(3);
    expect(b.rows[0]?.extra?.reignWeeks).toBe(10); // 100-90
  });

  it('ranks longest reigns across history + live', () => {
    const b = board(computeChampionshipBoards(ctx), 'longestReigns');
    expect(b.rows[0]?.name).toBe('Old King');
    expect(b.rows[0]?.value).toBe(50); // 60-10
  });

  it('ranks most defenses per reign', () => {
    const b = board(computeChampionshipBoards(ctx), 'mostDefenses');
    expect(b.rows[0]?.value).toBe(7);
    expect(b.rows[0]?.name).toBe('Old King');
  });

  it('counts crowns per warrior across arenas incl. live reigns', () => {
    const b = board(computeChampionshipBoards(ctx), 'crownsWarriors');
    // w9: 2 historical reigns; w1: 2 live reigns
    const w9 = b.rows.find((r) => r.warriorId === 'w9');
    const w1 = b.rows.find((r) => r.warriorId === 'w1');
    expect(w9?.value).toBe(2);
    expect(w1?.value).toBe(2);
  });

  it('counts crowns per stable from stamped stableName', () => {
    const b = board(computeChampionshipBoards(ctx), 'crownsStables');
    const ig = b.rows.find((r) => r.name === 'Iron Gale');
    expect(ig?.value).toBe(2);
  });

  it('rolls grand champions newest year first and counts repeat winners', () => {
    const roll = board(computeChampionshipBoards(ctx), 'grandChampions');
    expect(roll.rows[0]?.name).toBe('Champ');
    const most = board(computeChampionshipBoards(ctx), 'mostGrandChampionships');
    expect(most.rows.find((r) => r.warriorId === 'w9')?.value).toBe(1);
  });

  it('rolls completed tournament victors and counts champion name matches', () => {
    const roll = board(computeChampionshipBoards(ctx), 'tournamentVictors');
    expect(roll.rows).toHaveLength(2);
    expect(roll.rows.some((r) => r.name === 'Live Tourney')).toBe(false);
    const most = board(computeChampionshipBoards(ctx), 'mostTournamentTitles');
    expect(most.rows[0]?.value).toBe(2);
    expect(most.rows[0]?.name).toBe('Old King');
  });

  it('counts reign endings by reason', () => {
    const b = board(computeChampionshipBoards(ctx), 'reignEndings');
    const defeated = b.rows.find((r) => r.name === 'defeated');
    const died = b.rows.find((r) => r.name === 'died');
    expect(defeated?.value).toBe(1);
    expect(died?.value).toBe(1);
  });
});

/* ── §4 streaks ──────────────────────────────────────────────────────── */

describe('computeStreakBoards', () => {
  // w1 wins 3 straight, loses, wins; w2 loses 2 straight
  const arenaHistory = [
    fight('f1', { warriorIdA: 'w1' as WarriorId, warriorIdD: 'w9' as WarriorId, winner: 'A', week: 1 }),
    fight('f2', { warriorIdA: 'w1' as WarriorId, warriorIdD: 'w9' as WarriorId, winner: 'A', week: 2 }),
    fight('f3', { warriorIdA: 'w1' as WarriorId, warriorIdD: 'w9' as WarriorId, winner: 'A', week: 3 }),
    fight('f4', { warriorIdA: 'w1' as WarriorId, warriorIdD: 'w2' as WarriorId, winner: 'D', week: 4 }),
    fight('f5', { warriorIdA: 'w1' as WarriorId, warriorIdD: 'w2' as WarriorId, winner: 'A', week: 5 }),
    fight('f6', { warriorIdA: 'w3' as WarriorId, warriorIdD: 'w2' as WarriorId, winner: 'A', week: 6 }),
    fight('f7', { warriorIdA: 'w2' as WarriorId, warriorIdD: 'w3' as WarriorId, winner: 'D', week: 7 }),
  ];

  const warriors = [
    w('w1', { career: { wins: 4, losses: 1 }, status: 'Active' }),
    w('w2', { career: { wins: 1, losses: 4 }, status: 'Active' }),
    w('w3', { career: { wins: 2, losses: 0 }, status: 'Dead', isDead: true }),
  ];

  it('computes best win streaks per warrior', () => {
    const b = board(
      computeStreakBoards(input({ warriors, arenaHistory })),
      'winStreaks'
    );
    expect(b.rows[0]?.warriorId).toBe('w1');
    expect(b.rows[0]?.value).toBe(3);
  });

  it('reports current streaks for active warriors only', () => {
    const b = board(
      computeStreakBoards(input({ warriors, arenaHistory })),
      'currentStreaks'
    );
    // w2's last fight (f7) was a loss; w3 is dead → excluded
    const ids = b.rows.map((r) => r.warriorId);
    expect(ids).toContain('w1'); // won f5 → streak 1
    expect(ids).not.toContain('w2');
    expect(ids).not.toContain('w3');
  });

  it('computes longest losing streaks', () => {
    const b = board(
      computeStreakBoards(input({ warriors, arenaHistory })),
      'losingStreaks'
    );
    expect(b.rows[0]?.warriorId).toBe('w2');
    expect(b.rows[0]?.value).toBe(2);
  });

  it('labels boards with the recorded-window caveat', () => {
    const boards = computeStreakBoards(input({ warriors, arenaHistory }));
    expect(boards.every((b) => b.caveat?.includes('recorded'))).toBe(true);
  });
});

/* ── §5 style & arena ────────────────────────────────────────────────── */

describe('computeStyleArenaBoards', () => {
  const warriors = [
    w('s1', {
      career: { wins: 30, losses: 5, kills: 2 },
      style: FightingStyle.TotalParry,
      name: 'Turtle',
    }),
    w('s2', {
      career: { wins: 25, losses: 5, kills: 6 },
      style: FightingStyle.TotalParry,
      name: 'Shell',
    }),
    w('s3', {
      career: { wins: 12, losses: 5, kills: 8 },
      style: FightingStyle.LungingAttack,
      name: 'Lunger',
    }),
    w('s4', {
      career: {
        wins: 10,
        losses: 5,
        kills: 1,
        byArena: { pit_a: { wins: 9, losses: 1, kills: 1 } },
      },
      style: FightingStyle.BashingAttack,
      name: 'Basher',
    }),
    w('s5', {
      career: {
        wins: 20,
        losses: 0,
        kills: 0,
        byArena: { pit_a: { wins: 3, losses: 0, kills: 0 }, pit_b: { wins: 2, losses: 0, kills: 0 } },
      },
      style: FightingStyle.BashingAttack,
      name: 'Second',
    }),
  ];

  it('picks one legend per fighting style by wins', () => {
    const b = board(computeStyleArenaBoards(input({ warriors })), 'styleLegends');
    const tp = b.rows.find((r) => r.sub === FightingStyle.TotalParry || r.name === 'Turtle');
    expect(tp?.warriorId).toBe('s1');
    expect(tp?.value).toBe(30);
    const lu = b.rows.find((r) => r.name === 'Lunger');
    expect(lu?.warriorId).toBe('s3');
  });

  it('aggregates style standings across all warriors', () => {
    const b = board(computeStyleArenaBoards(input({ warriors })), 'styleStandings');
    const tp = b.rows.find((r) => r.name === FightingStyle.TotalParry);
    expect(tp?.extra?.wins).toBe(55);
    expect(tp?.extra?.kills).toBe(8);
  });

  it('picks per-arena legends and kill leaders from byArena', () => {
    const b = board(computeStyleArenaBoards(input({ warriors })), 'arenaLegends');
    const pitA = b.rows.find((r) => r.key.includes('pit_a') || r.name.includes('pit_a'));
    expect(pitA?.warriorId).toBe('s4');
    expect(pitA?.value).toBe(9);
    const kills = board(computeStyleArenaBoards(input({ warriors })), 'arenaKills');
    const pitAKills = kills.rows.find((r) => r.key.includes('pit_a'));
    expect(pitAKills?.warriorId).toBe('s4');
  });
});

/* ── §6 fight records ────────────────────────────────────────────────── */

describe('computeFightBoards', () => {
  const warriors = [w('w1'), w('w2'), w('w3')];
  const arenaHistory = [
    fight('f1', {
      warriorIdA: 'w1' as WarriorId,
      warriorIdD: 'w2' as WarriorId,
      winner: 'A',
      by: 'Decision',
      fameA: 20,
      fameD: 200,
      week: 3,
      title: 'w1 vs w2',
    }),
    fight('f2', {
      warriorIdA: 'w1' as WarriorId,
      warriorIdD: 'w3' as WarriorId,
      winner: 'A',
      by: 'Kill',
      week: 5,
      title: 'w1 vs w3',
      analysis: { decisiveExchange: { minute: 2 } } as never,
    }),
    fight('f3', {
      warriorIdA: 'w2' as WarriorId,
      warriorIdD: 'w3' as WarriorId,
      winner: 'A',
      by: 'Kill',
      week: 7,
      title: 'w2 vs w3',
      flashyTags: ['Comeback', 'Flashy', 'Bloodbath'],
      analysis: { decisiveExchange: { minute: 9 } } as never,
    }),
    fight('f4', {
      warriorIdA: 'w2' as WarriorId,
      warriorIdD: 'w1' as WarriorId,
      winner: 'D',
      by: 'KO',
      week: 9,
      title: 'w2 vs w1',
      fameDeltaA: 40,
      fameDeltaD: 30,
      tournamentId: 't-1' as never,
    }),
  ];
  const hallOfFame: HallEntry[] = [
    { id: 'h1' as never, week: 5, label: 'Fight of the Week', fightId: 'f2' as FightId },
    { id: 'h2' as never, week: 40, label: 'Fight of the Week', fightId: 'gone' as FightId },
    { id: 'h3' as never, week: 9, label: 'Fight of the Tournament', fightId: 'f4' as FightId },
  ];

  it('resolves Fight of the Week entries and archives truncated ids', () => {
    const b = board(
      computeFightBoards(input({ warriors, arenaHistory, hallOfFame })),
      'fightOfWeek'
    );
    expect(b.rows).toHaveLength(2);
    const live = b.rows.find((r) => r.fightId === 'f2');
    expect(live?.fightTitle).toBe('w1 vs w3');
    expect(live?.fightBy).toBe('Kill');
    const archived = b.rows.find((r) => r.fightId === 'gone');
    expect(archived?.archived).toBe(true);
  });

  it('resolves Fight of the Tournament entries', () => {
    const b = board(
      computeFightBoards(input({ warriors, arenaHistory, hallOfFame })),
      'fightOfTournament'
    );
    expect(b.rows).toHaveLength(1);
    expect(b.rows[0]?.fightId).toBe('f4');
  });

  it('ranks biggest upsets by winner/loser fame gap', () => {
    const b = board(
      computeFightBoards(input({ warriors, arenaHistory, hallOfFame })),
      'upsets'
    );
    expect(b.rows[0]?.fightId).toBe('f1'); // loser 200 - winner 20 = 180
    expect(b.rows[0]?.value).toBe(180);
  });

  it('ranks fastest kills by decisive-exchange minute, analysis required', () => {
    const b = board(
      computeFightBoards(input({ warriors, arenaHistory, hallOfFame })),
      'fastestKills'
    );
    expect(b.rows.map((r) => r.fightId)).toEqual(['f2', 'f3']);
  });

  it('ranks flashiest bouts by tag count', () => {
    const b = board(
      computeFightBoards(input({ warriors, arenaHistory, hallOfFame })),
      'flashiest'
    );
    expect(b.rows[0]?.fightId).toBe('f3');
    expect(b.rows[0]?.tags).toContain('Comeback');
  });

  it('counts most-fought warrior pairings above threshold', () => {
    const pairFights = [
      ...Array.from({ length: 3 }, (_, i) =>
        fight(`p${i}`, {
          warriorIdA: 'w1' as WarriorId,
          warriorIdD: 'w2' as WarriorId,
          winner: 'A',
          week: i + 1,
          isRivalry: true,
        })
      ),
      fight('q1', { warriorIdA: 'w1' as WarriorId, warriorIdD: 'w3' as WarriorId, winner: 'A', week: 9 }),
    ];
    const b = board(
      computeFightBoards(input({ warriors, arenaHistory: pairFights })),
      'rivalriesBouts'
    );
    expect(b.rows).toHaveLength(1);
    expect(b.rows[0]?.value).toBe(3);
  });
});

/* ── §7 stable records ───────────────────────────────────────────────── */

describe('computeStableBoards', () => {
  const stables = [
    { id: 'p1', name: 'Player Stable', fame: 400, isPlayer: true },
    { id: 'r1', name: 'Iron Gale', fame: 250, isPlayer: false },
  ];
  const warriors = [
    w('w1', { career: { wins: 30, losses: 5, kills: 4 }, stableId: 'p1' as StableId }),
    w('w2', { career: { wins: 20, losses: 5, kills: 1 }, stableId: 'p1' as StableId }),
    w('w3', { career: { wins: 40, losses: 5, kills: 9 }, stableId: 'r1' as StableId }),
    w('dead-p1', {
      career: { wins: 25, losses: 5, kills: 3 },
      stableId: 'p1' as StableId,
      status: 'Dead',
      isDead: true,
    }),
    w('dead-folded', {
      career: { wins: 99, losses: 0, kills: 0 },
      stableId: 'gone' as StableId,
      status: 'Dead',
      isDead: true,
    }),
  ];
  const rivalries = [
    { id: 'rv1', stableIdA: 'p1', stableIdB: 'r1', intensity: 7, reason: 'Blood feud', startWeek: 12 },
    { id: 'rv2', stableIdA: 'p1', stableIdB: 'r2', intensity: 3, reason: 'Insult', startWeek: 30 },
  ] as never[];

  it('aggregates stable wins incl. dead warriors attributed by stableId', () => {
    const b = board(
      computeStableBoards(input({ warriors, stables })),
      'stableWins'
    );
    const p1 = b.rows.find((r) => r.name === 'Player Stable');
    expect(p1?.value).toBe(75); // 30+20+25 (dead-p1 counts; dead-folded does not)
    const r1 = b.rows.find((r) => r.name === 'Iron Gale');
    expect(r1?.value).toBe(40);
    expect(b.rows.some((r) => r.name === 'gone')).toBe(false);
  });

  it('aggregates stable kills the same way', () => {
    const b = board(
      computeStableBoards(input({ warriors, stables })),
      'stableKills'
    );
    expect(b.rows.find((r) => r.name === 'Iron Gale')?.value).toBe(9);
    expect(b.rows.find((r) => r.name === 'Player Stable')?.value).toBe(7);
  });

  it('ranks stable fame desc', () => {
    const b = board(
      computeStableBoards(input({ warriors, stables })),
      'stableFame'
    );
    expect(b.rows.map((r) => r.name)).toEqual(['Player Stable', 'Iron Gale']);
    expect(b.rows[0]?.isPlayer).toBe(true);
  });

  it('ranks stable rivalries by intensity with resolved names', () => {
    const b = board(
      computeStableBoards(input({ warriors, stables, rivalries })),
      'stableRivalries'
    );
    expect(b.rows[0]?.value).toBe(7);
    expect(b.rows[0]?.detail).toContain('Blood feud');
  });
});

/* ── §8 world stats ──────────────────────────────────────────────────── */

describe('computeWorldStats', () => {
  it('reports all-time counters', () => {
    const stats = computeWorldStats(
      input({
        warriors: [w('w1'), w('w2', { status: 'Dead', isDead: true })],
        lifetimeStats: { bouts: 1200, kills: 90, retirements: 14 },
        deadWarriorIds: ['d1', 'd2', 'd3'] as WarriorId[],
        rivals: [makeRival({ roster: [w('r1'), w('r2')] })],
        stables: [
          { id: 'p1', name: 'P', fame: 0, isPlayer: true },
          { id: 'r1', name: 'R', fame: 0, isPlayer: false },
        ],
        year: 4,
        week: 20,
      })
    );
    const get = (l: string) => stats.find((s) => s.label === l)?.value;
    expect(get('Total Bouts')).toBe(1200);
    expect(get('Total Deaths')).toBe(3);
    expect(get('Total Retirements')).toBe(14);
    expect(get('Year')).toBe(4);
  });
});

/* ── aggregate ───────────────────────────────────────────────────────── */

describe('computeAlmanac', () => {
  it('returns every section and is deterministic on repeat calls', () => {
    const inp = input({
      warriors: [w('w1', { career: { wins: 10, losses: 2, kills: 1 }, fame: 50 })],
      arenaHistory: [fight('f1', { warriorIdA: 'w1' as WarriorId, warriorIdD: 'w2' as WarriorId, winner: 'A' })],
      awards: [
        { year: 1, type: 'WARRIOR_OF_YEAR', warriorName: 'A', value: 10, reason: 'x' },
      ] as AnnualAward[],
    });
    const a = computeAlmanac(inp);
    const b = computeAlmanac(inp);
    expect(a).toEqual(b);
    expect(Object.keys(a)).toEqual([
      'career',
      'accolades',
      'championships',
      'streaks',
      'styleArena',
      'fights',
      'stables',
      'world',
    ]);
  });
});
