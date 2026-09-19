/**
 * Shared test fixtures — schema-valid builders for warriors, rivals, offers,
 * fight summaries, and full game states with week caches wired.
 *
 * Replaces the per-suite local `makeWarrior`/`makeRival` copies. Every builder
 * returns objects that parse cleanly through the matching Zod schema.
 */
import type { Warrior } from '@/types/warrior.types';
import type {
  AIAgentMemory,
  AIEvent,
  AIStrategy,
  BoutOffer,
  GameState,
  Owner,
  RivalStableData,
} from '@/types/state.types';
import type { FightSummary } from '@/types/combat.types';
import {
  FightingStyle,
  type BoutOfferId,
  type FightId,
  type PromoterId,
  type StableId,
  type WarriorId,
} from '@/types/shared.types';
import { createFreshState } from '@/engine/factories/gameStateFactory';
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
export function makeGameState(over: Partial<GameState> = {}): GameState {
  const base = createFreshState('fixture-seed', '2026-01-01T00:00:00Z');
  const state: GameState = { ...base, ...over };

  const warriorMap = new Map<WarriorId, Warrior>();
  state.roster.forEach((w) => warriorMap.set(w.id, w));
  (state.rivals || []).forEach((r) => r.roster.forEach((w) => warriorMap.set(w.id, w)));
  state.warriorMap = warriorMap;

  const warriorToStableMap = new Map<string, { stableId: string; isPlayer: boolean }>();
  state.roster.forEach((w) =>
    warriorToStableMap.set(w.id, { stableId: state.player.id, isPlayer: true })
  );
  (state.rivals || []).forEach((r) =>
    r.roster.forEach((w) => warriorToStableMap.set(w.id, { stableId: r.id, isPlayer: false }))
  );
  state.warriorToStableMap = warriorToStableMap;

  const rivalMap = new Map<string, RivalStableData>();
  (state.rivals || []).forEach((r) => rivalMap.set(r.id, r));
  state.rivalMap = rivalMap;

  const rivalryMap = new Map<string, (typeof state.rivalries)[number]>();
  (state.rivalries || []).forEach((rv) => rivalryMap.set(getStablePairKey(rv.stableIdA, rv.stableIdB), rv));
  state.rivalryMap = rivalryMap;

  const grudgeMap = new Map<string, (typeof state.ownerGrudges)[number]>();
  (state.ownerGrudges || []).forEach((g) => grudgeMap.set(getStablePairKey(g.ownerIdA, g.ownerIdB), g));
  state.grudgeMap = grudgeMap;

  return state;
}
