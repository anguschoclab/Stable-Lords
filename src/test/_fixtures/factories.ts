/**
 * Shared test fixtures — schema-valid builders for warriors, rivals, offers,
 * fight summaries, and full game states with week caches wired.
 *
 * Replaces the per-suite local `makeWarrior`/`makeRival` copies. Every builder
 * returns objects that parse cleanly through the matching Zod schema.
 */
import type { Warrior } from '@/types/warrior.types';
import type { FighterState } from '@/engine/combat/resolution/types';
import type { ResolutionContext } from '@/engine/combat/resolution/types';
import type { WeatherType } from '@/types/shared.types';
import type {
  AIAgentMemory,
  AIEvent,
  AIStrategy,
  BoutOffer,
  GameState,
  Owner,
  Promoter,
  RivalStableData,
} from '@/types/state.types';
import type { FightOutcome, FightSummary } from '@/types/combat.types';
import type { ArenaConfig, Attributes, FightPlan, Trainer } from '@/types/shared.types';
import type { Rivalry, OwnerGrudge } from '@/types/state.types';
import type { DerivedRivalry } from '@/types/rivalry.types';
import type { WarriorRow } from '@/types/leaderboard';
import {
  FightingStyle,
  type BoutOfferId,
  type FightId,
  type PromoterId,
  type StableId,
  type WarriorId,
} from '@/types/shared.types';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import type { PoolWarrior } from '@/engine/recruitment/recruitment';
import { computeWarriorStats } from '@/engine/warrior/skillCalc';
import { getStablePairKey } from '@/utils/keyUtils';

let idCounter = 0;
function nextId(prefix: string): string {
  return `${prefix}_${++idCounter}`;
}

/** Reset the id counter between tests when deterministic ids matter. */
export function resetFixtureIds(): void {
  idCounter = 0;
}

/**
 * Schema-valid Warrior. Override any field via `over`; nested objects
 * (attributes/career/derivedStats) are replaced wholesale, not deep-merged.
 */
export const ATTRS_10: Attributes = { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 };

/** make Warrior. */
export function makeWarrior(over: Partial<Warrior> = {}): Warrior {
  const id = (over.id as string) ?? nextId('w');
  return {
    id: id as WarriorId,
    name: `Warrior ${id}`,
    style: FightingStyle.BashingAttack,
    attributes: { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
    fame: 50,
    popularity: 0,
    titles: [],
    injuries: [],
    flair: [],
    career: { wins: 0, losses: 0, kills: 0 },
    champion: false,
    status: 'Active',
    age: 21,
    fatigue: 0,
    traits: [],
    derivedStats: { hp: 100, endurance: 100, damage: 5, encumbrance: 0 },
    ...over,
  };
}

/**
 * Warrior with REAL derived stats — attributes are merged over the 10s
 * baseline, then baseSkills/derivedStats come from computeWarriorStats so
 * combat/training tests see internally-consistent numbers. Replaces the
 * per-suite copies that hand-rolled the same literal.
 */
export function makeComputedWarrior(
  attrs: Partial<Warrior['attributes']> = {},
  style: FightingStyle = FightingStyle.StrikingAttack,
  over: Partial<Warrior> = {}
): Warrior {
  const attributes = { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10, ...attrs };
  const { baseSkills, derivedStats } = computeWarriorStats(attributes, style);
  return makeWarrior({ attributes, baseSkills, derivedStats, style, ...over });
}

/**
 * Canonical "named test warrior" — the Spartacus profile shared across
 * component tests (StrikingAttack, all-10 base skills, 5-3-1 career, fame 7).
 */
export function makeSpartacusWarrior(over: Partial<Warrior> = {}): Warrior {
  return makeWarrior({
    id: (over.id ?? 'w1') as WarriorId,
    name: 'Spartacus',
    style: FightingStyle.StrikingAttack,
    baseSkills: { ATT: 10, DEF: 10, INI: 10, PAR: 10, RIP: 10, DEC: 10 },
    career: { wins: 5, losses: 3, kills: 1 },
    fame: 7,
    popularity: 3,
    ...over,
  });
}

/** Schema-valid Owner. */
export function makeOwner(over: Partial<Owner> = {}): Owner {
  const id = (over.id as string) ?? nextId('owner');
  return {
    id: id as StableId,
    name: `Owner ${id}`,
    stableName: `Stable ${id}`,
    fame: 100,
    renown: 50,
    titles: 0,
    personality: 'Pragmatic',
    ...over,
  };
}

/** Schema-valid AIStrategy. */
export function makeStrategy(over: Partial<AIStrategy> = {}): AIStrategy {
  return {
    intent: 'CONSOLIDATION',
    planWeeksRemaining: 4,
    ...over,
  };
}

/** Schema-valid AIEvent. */
export function makeAIEvent(over: Partial<AIEvent> = {}): AIEvent {
  return {
    id: nextId('event'),
    week: 1,
    type: 'STRATEGY',
    description: 'Test event',
    riskTier: 'Low',
    ...over,
  };
}

/** Schema-valid AIAgentMemory. */
export function makeAgentMemory(over: Partial<AIAgentMemory> = {}): AIAgentMemory {
  return {
    lastTreasury: 1000,
    burnRate: 0,
    metaAwareness: {},
    knownRivals: [],
    opponentDossiers: {},
    ...over,
  };
}

/** Schema-valid RivalStableData. Owner defaults to a Pragmatic owner. */
export function makeRival(over: Partial<RivalStableData> = {}): RivalStableData {
  const id = (over.id as string) ?? nextId('rival');
  const owner = over.owner ?? makeOwner({ id: id as StableId });
  // Production rival warriors carry stableId — stamp it on roster entries
  // that lack one so w.stableId lookups (isNPCWarrior, getNPCPlan) resolve.
  const roster = (over.roster ?? []).map((w) =>
    w.stableId ? w : { ...w, stableId: id as StableId }
  );
  return {
    id: id as StableId,
    owner,
    fame: 100,
    treasury: 1000,
    ledger: [],
    trainingAssignments: [],
    agentMemory: makeAgentMemory(),
    actionHistory: [],
    ...over,
    roster,
  };
}

/**
 * Rival with a named owner and roster — the "Established rival" shape shared
 * across AI/pipeline tests.
 */
export function makeRivalStable(
  id: string,
  roster: Warrior[],
  over: Partial<RivalStableData> = {}
): RivalStableData {
  return makeRival({
    id: id as StableId,
    fame: 50,
    owner: makeOwner({
      id: `owner-${id}` as StableId,
      name: `Owner ${id}`,
      fame: 50,
      stableName: `Stable ${id}`,
      renown: 5,
      titles: 0,
    }),
    roster,
    treasury: 1000,
    tier: 'Established',
    ...over,
  });
}

/**
 * Rival with the canonical "Owner / Stable / Pragmatic" owner — the default
 * rival shape shared across AI worker tests.
 */
export function makePragmaticRival(
  over: Partial<RivalStableData> = {},
  ownerOver: Partial<Owner> = {}
): RivalStableData {
  return makeRival({
    id: 'rival-1' as any,
    owner: makeOwner({
      id: 'owner-1' as any,
      name: 'Owner',
      stableName: 'Stable',
      ...ownerOver,
    }),
    ...over,
  });
}

/**
 * Combat-resolution FighterState (distinct from roster Warrior). Override
 * style/endurance/plan via `over` — fields are replaced wholesale.
 */
export function makeFighterState(over: Partial<FighterState> = {}): FighterState {
  return {
    label: 'A',
    style: FightingStyle.StrikingAttack,
    attributes: { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
    skills: { ATT: 10, PAR: 10, DEF: 10, INI: 10, RIP: 10, DEC: 10 },
    derived: { hp: 100, endurance: 100, damage: 5, encumbrance: 0 },
    plan: { style: FightingStyle.StrikingAttack, OE: 5, AL: 5 } as FighterState['plan'],
    activePlan: { style: FightingStyle.StrikingAttack, OE: 5, AL: 5 } as FighterState['activePlan'],
    psychState: 'Neutral',
    hp: 100,
    maxHp: 100,
    endurance: 100,
    maxEndurance: 100,
    hitsLanded: 0,
    hitsTaken: 0,
    ripostes: 0,
    consecutiveHits: 0,
    armHits: 0,
    legHits: 0,
    totalFights: 0,
    momentum: 0,
    committed: false,
    survivalStrike: false,
    recoveryDebt: 0,
    ...over,
  } as FighterState;
}

/** Schema-valid ResolutionContext for combat-exchange tests. */
export function makeResolutionContext(over: Partial<ResolutionContext> = {}): ResolutionContext {
  return {
    rng: () => 0.5,
    phase: 'OPENING',
    exchange: 0,
    weather: 'Clear' as WeatherType,
    weatherEffect: {
      staminaMult: 1,
      initiativeMod: 0,
      riposteMod: 0,
      damageMult: 1,
      description: '',
    },
    matchupA: 0,
    matchupD: 0,
    trainerModsA: {},
    trainerModsD: {},
    weaponReqA: { endurancePenalty: 1, attPenalty: 0 },
    weaponReqD: { endurancePenalty: 1, attPenalty: 0 },
    tacticStreakA: 0,
    tacticStreakD: 0,
    range: 'Striking' as ResolutionContext['range'],
    zone: 'Center' as ResolutionContext['zone'],
    arenaConfig: { tags: [] } as unknown as ResolutionContext['arenaConfig'],
    surfaceMod: { initiativeMod: 0, enduranceMult: 1.0, riposteMod: 0 },
    maxRange: 'Extended' as ResolutionContext['maxRange'],
    zoneStepBias: 0,
    ...over,
  } as ResolutionContext;
}

/** Schema-valid PoolWarrior (recruit pool entry). */
export function makePoolWarrior(over: Partial<PoolWarrior> = {}): PoolWarrior {
  const id = (over.id as string) ?? nextId('pw');
  const flat = { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 };
  const skills = { ATT: 10, DEF: 10, INI: 10, PAR: 10, RIP: 10, DEC: 10 };
  return {
    id,
    name: `Recruit ${id}`,
    style: FightingStyle.StrikingAttack,
    attributes: { ...flat },
    potential: { ST: 20, CN: 20, SZ: 10, WT: 20, WL: 20, SP: 20, DF: 20 },
    baseSkills: { ...skills },
    derivedStats: { hp: 100, endurance: 100, damage: 5, encumbrance: 0 },
    tier: 'Common',
    cost: 50,
    age: 20,
    lore: 'A young fighter.',
    traits: [],
    addedWeek: 1,
    favorites: {
      weaponId: 'shortsword',
      rhythm: { oe: 5, al: 5 },
      discovered: { weapon: false, rhythm: false, weaponHints: 0, rhythmHints: 0 },
    },
    luckfactor: { ...skills },
    ...over,
  } as PoolWarrior;
}

/** 'Promising'-tier recruit preset shared by the recruitment/draft tests. */
export function makeTestRecruit(over: Partial<PoolWarrior> = {}): PoolWarrior {
  return {
    id: 'recruit_test',
    name: 'Test Recruit',
    style: FightingStyle.StrikingAttack,
    attributes: { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
    potential: { ST: 15, CN: 15, SZ: 15, WT: 15, WL: 15, SP: 15, DF: 15 },
    baseSkills: { ATT: 5, PAR: 5, DEF: 5, INI: 5, RIP: 5, DEC: 5 },
    derivedStats: { hp: 100, endurance: 100, damage: 5, encumbrance: 12 },
    tier: 'Promising',
    cost: 100,
    age: 18,
    lore: 'A test recruit.',
    traits: ['IronWill'],
    addedWeek: 1,
    favorites: {
      weaponId: 'longsword',
      rhythm: { oe: 7, al: 5 },
      discovered: { weapon: true, rhythm: false, weaponHints: 1, rhythmHints: 0 },
    },
    lineage: { generation: 1, pedigree: 'Commoner' },
    ...over,
  } as any;
}

/** Leaderboard row — rank varies by index so tables render sorted data. */
export function makeWarriorRow(i: number, over: Partial<WarriorRow> = {}): WarriorRow {
  return {
    id: `w${i}`,
    name: `Warrior${i}`,
    stableName: `Stable${i % 5}`,
    stableId: `s${i % 5}`,
    fame: 100 - i,
    wins: 20 - (i % 10),
    losses: i % 10,
    kills: i % 5,
    winRate: 100 - (i % 20),
    style: ['Brawler', 'Technician', 'Striker'][i % 3]!,
    isPlayer: i === 0,
    officialRank: i + 1,
    compositeScore: 90 - i,
    ...over,
  };
}

/** Ordered leaderboard rows (rank/score vary per row). */
export function makeWarriorRows(n: number): WarriorRow[] {
  return Array.from({ length: n }, (_, i) => makeWarriorRow(i));
}

/** Schema-valid Promoter. */
export function makePromoter(over: Partial<Promoter> = {}): Promoter {
  const id = (over.id as string) ?? nextId('promoter');
  return {
    id: id as PromoterId,
    name: `Promoter ${id}`,
    age: 45,
    personality: 'Honorable',
    tier: 'Local',
    capacity: 2,
    biases: [FightingStyle.StrikingAttack],
    history: { totalPursePaid: 0, notableBouts: [], legacyFame: 0 },
    ...over,
  };
}

/** Schema-valid BoutOffer. */
export function makeBoutOffer(over: Partial<BoutOffer> = {}): BoutOffer {
  const id = (over.id as string) ?? nextId('offer');
  const warriorIds = (over.warriorIds as WarriorId[]) ?? [
    nextId('w') as WarriorId,
    nextId('w') as WarriorId,
  ];
  return {
    id: id as BoutOfferId,
    promoterId: 'promoter-1' as PromoterId,
    warriorIds,
    boutWeek: 3,
    expirationWeek: 2,
    purse: 150,
    hype: 80,
    status: 'Proposed',
    responses: { [warriorIds[0]!]: 'Pending', [warriorIds[1]!]: 'Pending' },
    ...over,
  };
}

/** Schema-valid FightSummary. */
export function makeFightSummary(over: Partial<FightSummary> = {}): FightSummary {
  const a = (over.warriorIdA as string) ?? nextId('w');
  const d = (over.warriorIdD as string) ?? nextId('w');
  return {
    id: nextId('fight') as FightId,
    week: 1,
    absoluteWeek: 1,
    title: `${a} vs ${d}`,
    warriorIdA: a as WarriorId,
    warriorIdD: d as WarriorId,
    winner: 'A',
    by: 'Decision',
    styleA: FightingStyle.BashingAttack,
    styleD: FightingStyle.LungingAttack,
    createdAt: 'Y1 W1',
    ...over,
  };
}

/**
 * GameState built on `createFreshState`, with overrides applied and the
 * per-week lookup caches (warriorMap / warriorToStableMap / rivalMap /
 * rivalryMap / grudgeMap) wired exactly as `buildWeekCaches` does in the
 * week pipeline — so tests exercise the same lookup surface the engine sees.
 */
export function makeGameState(over: Partial<GameState> | Record<string, any> = {}): GameState {
  const base = createFreshState('fixture-seed', '2026-01-01T00:00:00Z');
  const state: GameState = { ...base, ...(over as Partial<GameState>) };

  const warriorMap = new Map<WarriorId, Warrior>();
  state.roster.forEach((w) => w && warriorMap.set(w.id, w));
  (state.rivals || []).forEach((r) =>
    (r.roster || []).forEach((w) => w && warriorMap.set(w.id, w))
  );
  state.warriorMap = warriorMap;

  const warriorToStableMap = new Map<string, { stableId: string; isPlayer: boolean }>();
  state.roster.forEach(
    (w) => w && warriorToStableMap.set(w.id, { stableId: state.player.id, isPlayer: true })
  );
  (state.rivals || []).forEach((r) =>
    (r.roster || []).forEach(
      (w) => w && warriorToStableMap.set(w.id, { stableId: r.id, isPlayer: false })
    )
  );
  state.warriorToStableMap = warriorToStableMap;

  const rivalMap = new Map<string, RivalStableData>();
  (state.rivals || []).forEach((r) => rivalMap.set(r.id, r));
  state.rivalMap = rivalMap;

  const rivalryMap = new Map<string, (typeof state.rivalries)[number]>();
  (state.rivalries || []).forEach((rv) =>
    rivalryMap.set(getStablePairKey(rv.stableIdA, rv.stableIdB), rv)
  );
  state.rivalryMap = rivalryMap;

  const grudgeMap = new Map<string, (typeof state.ownerGrudges)[number]>();
  (state.ownerGrudges || []).forEach((g) =>
    grudgeMap.set(getStablePairKey(g.ownerIdA, g.ownerIdB), g)
  );
  state.grudgeMap = grudgeMap;

  return state;
}

/** Minimal FightPlan — neutral tactics, mid OE/AL. */
export function makePlan(over: Partial<FightPlan> = {}): FightPlan {
  return {
    style: FightingStyle.StrikingAttack,
    OE: 7,
    AL: 6,
    killDesire: 5,
    target: 'Any',
    protect: 'Any',
    ...over,
  };
}

/** Schema-valid Trainer. */
export function makeTrainer(over: Partial<Trainer> = {}): Trainer {
  return {
    id: 't1',
    name: 'Trainer',
    tier: 'Novice',
    focus: 'Aggression',
    fame: 0,
    age: 40,
    contractWeeksLeft: 10,
    ...over,
  };
}

/** Schema-valid Rivalry between two stables. */
export function makeRivalry(over: Partial<Rivalry> = {}): Rivalry {
  return {
    id: 'rv-1' as Rivalry['id'],
    stableIdA: 'StableA' as Rivalry['stableIdA'],
    stableIdB: 'StableB' as Rivalry['stableIdB'],
    intensity: 1,
    reason: 'Test rivalry',
    startWeek: 1,
    ...over,
  };
}

/** Schema-valid OwnerGrudge between two owners. */
export function makeGrudge(over: Partial<OwnerGrudge> = {}): OwnerGrudge {
  return {
    id: 'g1' as OwnerGrudge['id'],
    ownerIdA: 'a' as OwnerGrudge['ownerIdA'],
    ownerIdB: 'b' as OwnerGrudge['ownerIdB'],
    intensity: 1,
    reason: 'Test grudge',
    startWeek: 1,
    lastEscalation: 1,
    ...over,
  };
}

/** Dashboard-level DerivedRivalry (H2H aggregates, not the state entity). */
export function makeDerivedRivalry(over: Partial<DerivedRivalry> = {}): DerivedRivalry {
  return {
    stableName: 'Iron Wolves',
    ownerId: 'owner-1',
    intensity: 3,
    kills: [],
    bouts: 10,
    playerWins: 6,
    playerLosses: 4,
    ...over,
  } as DerivedRivalry;
}

/** FightOutcome with a 3-exchange kill log (fatal crit on exchange 2). */
export function makeKillOutcome(over: Partial<FightOutcome> = {}): FightOutcome {
  return {
    winner: 'A',
    by: 'Kill',
    minutes: 7,
    log: [],
    exchangeLog: [
      {
        exchangeIndex: 0,
        minute: 1,
        iniWinner: 'A',
        attResult: 'hit',
        damage: 4,
        endDeltas: { a: -3, d: -5 },
      },
      {
        exchangeIndex: 1,
        minute: 2,
        iniWinner: 'A',
        attResult: 'hit',
        damage: 6,
        endDeltas: { a: -3, d: -6 },
      },
      {
        exchangeIndex: 2,
        minute: 3,
        iniWinner: 'A',
        attResult: 'crit',
        damage: 12,
        killWindow: true,
        executionFlag: true,
        reasonCodes: ['AI_PUSH_FATIGUE'],
      },
    ],
    post: {
      xpA: 10,
      xpD: 2,
      hitsA: 3,
      hitsD: 0,
      gotKillA: true,
      causeBucket: 'FATAL_DAMAGE',
      fatalExchangeIndex: 2,
    },
    ...over,
  };
}

/** Positional warrior preset used by the page-level component tests. */
export function makeNamedWarrior(
  name: string,
  status: Warrior['status'],
  wins: number,
  losses: number,
  fame: number,
  over: Partial<Warrior> = {}
): Warrior {
  return {
    id: name,
    name,
    status,
    style: FightingStyle.AimedBlow,
    age: 20,
    attributes: { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
    fame,
    popularity: 0,
    career: { wins, losses, kills: 0 },
    titles: [],
    injuries: [],
    flair: [],
    champion: false,
    ...over,
  } as Warrior;
}

/** Schema-valid ArenaConfig with a neutral spatial profile. */
export function makeArena(over: Partial<ArenaConfig> = {}): ArenaConfig {
  return {
    id: 'test_arena',
    name: 'Test Arena',
    tags: [],
    tier: 1,
    description: 'Test arena',
    size: 'standard',
    zoneDef: { Edge: -2, Corner: -4 },
    surfaceMod: { initiativeMod: 0, enduranceMult: 1.0, riposteMod: 0 },
    startingZone: 'Center',
    ...over,
  };
}
