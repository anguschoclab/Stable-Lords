/**
 * Guards the shared fixture builders: every factory must emit objects that
 * parse through the matching Zod schema, and makeGameState must wire the
 * same week caches the pipeline builds.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  makeWarrior,
  makeRival,
  makeOwner,
  makeStrategy,
  makeAIEvent,
  makeAgentMemory,
  makeBoutOffer,
  makeFightSummary,
  makeGameState,
  resetFixtureIds,
} from './factories';
import { WarriorSchema, RivalStableDataSchema } from '@/schemas/gameStateSchema';
import { BoutOfferSchema } from '@/schemas/fightSchemas';
import { AIEventSchema, AIAgentMemorySchema, AIStrategySchema } from '@/schemas/economySchemas';
import { FightingStyle } from '@/types/shared.types';
import type { WarriorId } from '@/types/shared.types';

describe('fixture factories — schema validity', () => {
  beforeEach(() => resetFixtureIds());

  it('makeWarrior produces a schema-valid warrior', () => {
    expect(() => WarriorSchema.parse(makeWarrior())).not.toThrow();
  });

  it('makeWarrior applies overrides', () => {
    const w = makeWarrior({ name: 'Vex', style: FightingStyle.LungingAttack, fame: 200 });
    expect(w.name).toBe('Vex');
    expect(w.style).toBe(FightingStyle.LungingAttack);
    expect(w.fame).toBe(200);
    expect(() => WarriorSchema.parse(w)).not.toThrow();
  });

  it('makeRival produces a schema-valid rival', () => {
    expect(() => RivalStableDataSchema.parse(makeRival())).not.toThrow();
  });

  it('makeRival honors nested builders', () => {
    const rival = makeRival({
      strategy: makeStrategy({ intent: 'VENDETTA' }),
      agentMemory: makeAgentMemory({ burnRate: 42 }),
      actionHistory: [makeAIEvent({ type: 'FINANCE' })],
      roster: [makeWarrior()],
    });
    expect(() => RivalStableDataSchema.parse(rival)).not.toThrow();
    expect(rival.strategy?.intent).toBe('VENDETTA');
    expect(rival.agentMemory?.burnRate).toBe(42);
    expect(rival.actionHistory?.[0]?.type).toBe('FINANCE');
  });

  it('makeAIEvent / makeAgentMemory / makeStrategy are schema-valid', () => {
    expect(() => AIEventSchema.parse(makeAIEvent())).not.toThrow();
    expect(() => AIAgentMemorySchema.parse(makeAgentMemory())).not.toThrow();
    expect(() => AIStrategySchema.parse(makeStrategy())).not.toThrow();
  });

  it('makeBoutOffer produces a schema-valid offer', () => {
    expect(() => BoutOfferSchema.parse(makeBoutOffer())).not.toThrow();
  });

  it('makeFightSummary carries required fields', () => {
    const f = makeFightSummary({ winner: 'D', by: 'Kill' });
    expect(f.winner).toBe('D');
    expect(f.by).toBe('Kill');
    expect(f.warriorIdA).toBeTruthy();
    expect(f.warriorIdD).toBeTruthy();
  });

  it('makeOwner produces a usable owner', () => {
    const o = makeOwner({ personality: 'Aggressive' });
    expect(o.personality).toBe('Aggressive');
    expect(o.stableName).toBeTruthy();
  });
});

describe('makeGameState — cache wiring', () => {
  beforeEach(() => resetFixtureIds());

  it('wires warriorMap / warriorToStableMap / rivalMap like buildWeekCaches', () => {
    const pw = makeWarrior({ id: 'pw1' as WarriorId });
    const rw = makeWarrior({ id: 'rw1' as WarriorId });
    const rival = makeRival({ id: 'rival-1' as never, roster: [rw] });
    const state = makeGameState({ roster: [pw], rivals: [rival] });

    expect(state.warriorMap?.get('pw1' as WarriorId)).toBe(pw);
    // makeRival stamps stableId on roster warriors — the map holds the stamped copy
    expect(state.warriorMap?.get('rw1' as WarriorId)).toEqual({
      ...rw,
      stableId: 'rival-1',
    });
    expect(state.warriorToStableMap?.get('pw1')).toEqual({
      stableId: state.player.id,
      isPlayer: true,
    });
    expect(state.warriorToStableMap?.get('rw1')).toEqual({
      stableId: 'rival-1',
      isPlayer: false,
    });
    expect(state.rivalMap?.get('rival-1')).toBe(rival);
  });

  it('wires rivalryMap and grudgeMap with order-insensitive keys', () => {
    const state = makeGameState({
      rivalries: [
        {
          id: 'rv1' as never,
          stableIdA: 'b' as never,
          stableIdB: 'a' as never,
          intensity: 3,
          reason: 'test',
          startWeek: 1,
        },
      ],
      ownerGrudges: [
        {
          id: 'g1' as never,
          ownerIdA: 'x' as never,
          ownerIdB: 'y' as never,
          intensity: 2,
          reason: 'test',
          startWeek: 1,
          lastEscalation: 1,
        },
      ],
    });
    expect(state.rivalryMap?.get('a|b')?.intensity).toBe(3);
    expect(state.grudgeMap?.get('x|y')?.intensity).toBe(2);
  });
});
