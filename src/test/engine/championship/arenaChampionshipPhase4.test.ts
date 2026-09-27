// @vitest-environment node
/**
 * Phase 4 — NPC-AI, leaderboards, narrative, progression for arena titles.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  makeWarrior,
  makeRival,
  makeBoutOffer,
  makeGameState,
  resetFixtureIds,
} from '@/test/_fixtures/factories';
import { evaluateBoutOffer } from '@/engine/ai/workers/competitionWorker/boutAcceptance';
import { processAllRivalsBoutOffers } from '@/engine/ai/workers/competitionWorker/offerProcessor';
import { convertBidsToOffers } from '@/engine/ai/workers/competitionWorker/boutBidding';
import { buildPerceptionSnapshot } from '@/engine/ai/memory/perceptionSnapshot';
import { evaluateBoutOffers } from '@/engine/advisor/boutOfferAdvisor';
import {
  calculateArenaStyleLeaders,
  calculateArenaStableStandings,
} from '@/engine/core/leaderboards';
import { describeArenaEffects } from '@/engine/narrative/arenaNarrative';
import { runProgressionPass } from '@/engine/pipeline/passes/ProgressionPass';
import type { ArenaTitle, BoutOffer } from '@/types/state.types';
import type { CareerRecord } from '@/types/warrior.types';
import type { WarriorId, BoutOfferId, StableId } from '@/types/shared.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { FightingStyle } from '@/types/shared.types';

const ARENA = 'standard_arena';

const rng = {
  uuid: (p = 'id') => `${p}-t1`,
  next: () => 0.99,
  int: (_a: number, _b: number) => _a,
} as unknown as IRNGService;

function career(wins: number, losses: number, kills = 0): CareerRecord {
  return { wins, losses, kills, byArena: { [ARENA]: { wins, losses, kills } } };
}

function title(champId: string | null, status: ArenaTitle['status'] = 'active'): ArenaTitle {
  return {
    champion: champId
      ? { warriorId: champId as WarriorId, startedAbsoluteWeek: 1, defenses: 0, lastActivityWeek: 1 }
      : null,
    status,
    history: [],
    refusals: 0,
    deferrals: 0,
    noContenderStreak: 0,
    declinedContenders: {},
  };
}

function titleOffer(a: string, d: string, over: Partial<BoutOffer> = {}): BoutOffer {
  return makeBoutOffer({
    warriorIds: [a as WarriorId, d as WarriorId],
    titleArenaId: ARENA,
    arenaId: ARENA,
    status: 'Proposed',
    responses: { [a as WarriorId]: 'Pending', [d as WarriorId]: 'Pending' },
    ...over,
  });
}

beforeEach(() => resetFixtureIds());

// ─── evaluateBoutOffer title branch ─────────────────────────────────────────

describe('evaluateBoutOffer — title bouts', () => {
  const rival = makeRival({ id: 'r1' as StableId, treasury: 5000 });

  it('accepts a title shot even when the purse is below the fame floor', () => {
    const w = makeWarrior({ id: 'w1' as WarriorId, fame: 500 });
    const opp = makeWarrior({ id: 'w2' as WarriorId, fame: 500 });
    const offer = titleOffer('w1', 'w2', { purse: 50 });
    // 500 fame → ordinary offer would Counter; a crown shot accepts.
    expect(evaluateBoutOffer(offer, rival, w, 10, 'Clear', opp)).toBe('Accepted');
  });

  it('still declines on a blocking injury (medical postponement)', () => {
    const w = makeWarrior({
      id: 'w1' as WarriorId,
      injuries: [{ name: 'Broken Rib', severity: 'Severe', weeksRemaining: 2 } as never],
    });
    const opp = makeWarrior({ id: 'w2' as WarriorId });
    const offer = titleOffer('w1', 'w2');
    expect(evaluateBoutOffer(offer, rival, w, 10, 'Clear', opp)).toBe('Declined');
  });

  it('never returns Countered for a title offer', () => {
    const w = makeWarrior({ id: 'w1' as WarriorId, fame: 2000 });
    const opp = makeWarrior({ id: 'w2' as WarriorId, fame: 2000 });
    const offer = titleOffer('w1', 'w2', { purse: 10 });
    const verdict = evaluateBoutOffer(offer, rival, w, 10, 'Clear', opp);
    expect(verdict).not.toBe('Countered');
  });
});

// ─── Title-first slate in offer processing ──────────────────────────────────

describe('processAllRivalsBoutOffers — title-first slate', () => {
  it('a rival answers a title bout before a richer ordinary offer', () => {
    const w = makeWarrior({ id: 'w1' as WarriorId, stableId: 'r1' as StableId });
    const opp = makeWarrior({ id: 'w2' as WarriorId, stableId: 'r2' as StableId });
    const opp2 = makeWarrior({ id: 'w3' as WarriorId, stableId: 'r2' as StableId });
    const rival = makeRival({ id: 'r1' as StableId, roster: [w], treasury: 5000 });
    const rival2 = makeRival({ id: 'r2' as StableId, roster: [opp, opp2], treasury: 5000 });

    const ordinary = makeBoutOffer({
      id: 'o-rich' as BoutOfferId,
      warriorIds: ['w1' as WarriorId, 'w3' as WarriorId],
      status: 'Proposed',
      responses: { ['w1' as WarriorId]: 'Pending', ['w3' as WarriorId]: 'Pending' },
      hype: 999,
      purse: 9999,
    });
    const t = titleOffer('w1', 'w2', {
      id: 'o-title' as BoutOfferId,
      hype: 10,
      purse: 10,
    });

    const state = makeGameState({
      absoluteWeek: 10,
      week: 10,
      rivals: [rival, rival2],
      boutOffers: { [ordinary.id]: ordinary, [t.id]: t },
      warriorMap: new Map([
        [w.id, w],
        [opp.id, opp],
        [opp2.id, opp2],
      ] as never),
      warriorToStableMap: new Map([
        ['w1', { stableId: 'r1', isPlayer: false }],
        ['w2', { stableId: 'r2', isPlayer: false }],
        ['w3', { stableId: 'r2', isPlayer: false }],
      ] as never),
    });

    const impact = processAllRivalsBoutOffers(state, [rival, rival2]);
    const out = impact.boutOffers!;
    // The title bout gets answered (not the richer ordinary one for w1).
    expect(out[t.id]?.responses?.['w1' as WarriorId]).toBe('Accepted');
    expect(out[ordinary.id]?.responses?.['w1' as WarriorId]).toBe('Pending');
  });
});

// ─── Contender-venue bias in convertBidsToOffers ────────────────────────────

describe('convertBidsToOffers — contender-venue bias', () => {
  it('books a venue-qualified proposer at their best contender arena', () => {
    const proposer = makeWarrior({ id: 'wp' as WarriorId, career: career(4, 0) });
    const opponent = makeWarrior({ id: 'wo' as WarriorId });
    const r1 = makeRival({ id: 'r1' as StableId, roster: [proposer] });
    const r2 = makeRival({ id: 'r2' as StableId, roster: [opponent] });
    const state = makeGameState({
      absoluteWeek: 10,
      week: 10,
      rivals: [r1, r2],
      warriorMap: new Map([
        [proposer.id, proposer],
        [opponent.id, opponent],
      ] as never),
    });
    const offers = convertBidsToOffers(
      [{ bid: { proposingWarriorId: 'wp', priority: 5 }, rivalId: 'r1' }],
      [r1, r2],
      state,
      rng,
      new Set()
    );
    expect(offers).toHaveLength(1);
    expect(offers[0]!.arenaId).toBe(ARENA);
  });
});

// ─── Perception snapshot champion maps ──────────────────────────────────────

describe('buildPerceptionSnapshot — champion maps', () => {
  it('indexes live reigns both directions', () => {
    const state = makeGameState({
      arenaChampions: {
        arena_a: title('w-a'),
        arena_b: title('w-b', 'dormant'),
        arena_c: title(null),
      },
    });
    const snap = buildPerceptionSnapshot(state);
    expect(snap.championByArena.get('arena_a')).toBe('w-a');
    expect(snap.championByArena.get('arena_b')).toBe('w-b');
    expect(snap.championByArena.has('arena_c')).toBe(false);
    expect(snap.arenasHeldByChampion.get('w-a' as WarriorId)).toEqual(['arena_a']);
  });
});

// ─── Advisor title headline + bump ──────────────────────────────────────────

describe('evaluateBoutOffers — title bout advice', () => {
  it('headlines a title bout and bumps it over an ordinary offer', () => {
    const w = makeWarrior({ id: 'w1' as WarriorId, fame: 100 });
    const opp = makeWarrior({ id: 'w2' as WarriorId, fame: 100 });
    const t = titleOffer('w1', 'w2', {
      boutWeek: 11,
      expirationWeek: 11,
      createdAbsoluteWeek: 10,
      purse: 10,
    });
    const ordinary = makeBoutOffer({
      warriorIds: ['w1' as WarriorId, 'w2' as WarriorId],
      boutWeek: 11,
      expirationWeek: 11,
      createdAbsoluteWeek: 10,
      purse: 500,
      status: 'Proposed',
    });
    const state = makeGameState({
      absoluteWeek: 10,
      week: 10,
      roster: [w],
      rivals: [makeRival({ roster: [opp] })],
      boutOffers: { [t.id]: t, [ordinary.id]: ordinary },
      warriorMap: new Map([
        [w.id, w],
        [opp.id, opp],
      ] as never),
    });
    const advice = evaluateBoutOffers(w, state, 'PURSE_HUNTER');
    expect(advice.action).toBe('ACCEPT_OFFER');
    expect(advice.recommendedOfferId).toBe(t.id);
    expect(advice.headline.toLowerCase()).toContain('title');
  });
});

// ─── Arena style leaders + stable standings ─────────────────────────────────

describe('arena leaderboards — style leaders and stable standings', () => {
  it('returns the best warrior per style at the arena', () => {
    const striker = makeWarrior({ id: 'w-s' as WarriorId, style: FightingStyle.StrikingAttack, career: career(5, 0) });
    const basher = makeWarrior({ id: 'w-b' as WarriorId, style: FightingStyle.BashingAttack, career: career(3, 2) });
    const leaders = calculateArenaStyleLeaders(ARENA, [striker, basher], 'Player', []);
    expect(leaders[FightingStyle.StrikingAttack]?.warriorId).toBe('w-s');
    expect(leaders[FightingStyle.BashingAttack]?.warriorId).toBe('w-b');
  });

  it('ranks stables by aggregate venue wins including champion count', () => {
    const mine = makeWarrior({ id: 'w-m' as WarriorId, career: career(6, 0) });
    const theirs = makeWarrior({ id: 'w-t' as WarriorId, career: career(2, 0) });
    const rival = makeRival({ id: 'r1' as StableId, roster: [theirs] });
    const state = makeGameState({
      roster: [mine],
      rivals: [rival],
      arenaChampions: { [ARENA]: title('w-m') },
    });
    const standings = calculateArenaStableStandings(state, ARENA);
    expect(standings[0]!.stableName).toBe(state.player.stableName);
    expect(standings[0]!.wins).toBe(6);
    expect(standings[0]!.champions).toBe(1);
    expect(standings[1]!.wins).toBe(2);
    expect(standings[1]!.champions).toBe(0);
  });
});

// ─── Arena effects prose ────────────────────────────────────────────────────

describe('describeArenaEffects', () => {
  it('describes a neutral arena plainly', () => {
    const lines = describeArenaEffects('standard_arena');
    expect(lines.length).toBeGreaterThan(0);
    expect(lines.join(' ')).toContain('Proving Grounds');
  });

  it('translates surface modifiers into readable effects', () => {
    const lines = describeArenaEffects('narrow_bridge'); // enduranceMult 1.2
    expect(lines.join(' ').toLowerCase()).toMatch(/endur|stamina|drain|breath/);
  });
});

// ─── Progression objectives ─────────────────────────────────────────────────

describe('progression — arena title objectives', () => {
  function passWith(state: Parameters<typeof makeGameState>[0]) {
    const s = makeGameState(state);
    const impact = runProgressionPass(s, s.week + 1, s.year);
    return impact.progression!;
  }

  it('ARENA_TITLE completes when the player stable holds a reign', () => {
    const champ = makeWarrior({ id: 'w-c' as WarriorId });
    const prog = passWith({ roster: [champ], arenaChampions: { [ARENA]: title('w-c') } });
    expect(prog.objectives.find((o) => o.id === 'ARENA_TITLE')?.completed).toBe(true);
  });

  it('CIRCUIT_LORD needs three titles on three different warriors', () => {
    const w1 = makeWarrior({ id: 'w-1' as WarriorId });
    const w2 = makeWarrior({ id: 'w-2' as WarriorId });
    const w3 = makeWarrior({ id: 'w-3' as WarriorId });
    const twoOnly = passWith({
      roster: [w1, w2, w3],
      arenaChampions: { arena_a: title('w-1'), arena_b: title('w-2') },
    });
    expect(twoOnly.objectives.find((o) => o.id === 'CIRCUIT_LORD')?.completed).toBe(false);

    const three = passWith({
      roster: [w1, w2, w3],
      arenaChampions: { arena_a: title('w-1'), arena_b: title('w-2'), arena_c: title('w-3') },
    });
    expect(three.objectives.find((o) => o.id === 'CIRCUIT_LORD')?.completed).toBe(true);
  });

  it('GRAND_CHAMPION completes for a player-owned Grand Championship winner', () => {
    const w = makeWarrior({ id: 'w-g' as WarriorId });
    const prog = passWith({
      roster: [w],
      grandChampions: [{ tournamentId: 't-52', year: 1, warriorId: 'w-g' as WarriorId, warriorName: 'W G' }],
    });
    expect(prog.objectives.find((o) => o.id === 'GRAND_CHAMPION')?.completed).toBe(true);
  });
});
