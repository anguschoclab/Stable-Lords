/**
 * Stage G — debug-drawer telemetry completeness.
 * buildExchangeLogEntry projects the CombatEvent stream into ExchangeLogEntry
 * reasonCodes; STATE_CHANGE events (psych transitions, desperate-plan
 * activation) and condition-trigger annotations are real telemetry the
 * drawer must surface, not silently drop.
 */
// @vitest-environment node
import { describe, it, expect, beforeAll } from 'vitest';
import { buildExchangeLogEntry } from '@/engine/simulate/logging';
import { simulateFight, defaultPlanForWarrior } from '@/engine/simulate';
import { makeWarrior } from '@/test/_fixtures/factories';
import { loadCombatNarrative } from '@/data/narrative';
import { FightingStyle } from '@/types/shared.types';
import type { CombatEvent } from '@/types/combat.types';

describe('buildExchangeLogEntry — telemetry completeness', () => {
  it('surfaces PSYCH_* state changes as reason codes', () => {
    const events: CombatEvent[] = [
      { type: 'STATE_CHANGE', actor: 'A', result: 'PSYCH_DESPERATE' },
      { type: 'STATE_CHANGE', actor: 'D', result: 'PSYCH_INTHEZONE' },
    ];
    const entry = buildExchangeLogEntry(3, 1, 'MID', events);
    expect(entry.reasonCodes).toContain('PSYCH_DESPERATE');
    expect(entry.reasonCodes).toContain('PSYCH_INTHEZONE');
  });

  it('surfaces desperate-plan activation', () => {
    const events: CombatEvent[] = [{ type: 'STATE_CHANGE', actor: 'A', result: 'DESPERATE' }];
    const entry = buildExchangeLogEntry(4, 2, 'LATE', events);
    expect(entry.reasonCodes).toContain('DESPERATE');
  });

  it('surfaces condition-trigger annotations with the firing trigger', () => {
    const events: CombatEvent[] = [
      {
        type: 'AI_INTENT',
        actor: 'A',
        metadata: { cause: 'AI_INTENT_PRESS', intent: 'Press' },
      },
      {
        type: 'STATE_CHANGE',
        actor: 'A',
        result: 'CONDITION_OPPONENT_HP_BELOW',
      },
    ];
    const entry = buildExchangeLogEntry(7, 3, 'LATE', events);
    expect(entry.reasonCodes).toContain('AI_INTENT_PRESS');
    expect(entry.reasonCodes).toContain('CONDITION_OPPONENT_HP_BELOW');
  });

  it('does not count cause-tagged hits as attack results, but still sums their damage', () => {
    const events: CombatEvent[] = [
      {
        type: 'HIT',
        actor: 'D',
        target: 'D',
        value: 2,
        metadata: { cause: 'ARENA_EVENT', arenaEventId: 'crowd_riot' },
      },
      {
        type: 'HIT',
        actor: 'A',
        target: 'D',
        value: 3,
        location: 'Bleed',
        metadata: { cause: 'BLEED' },
      },
    ];
    const entry = buildExchangeLogEntry(1, 1, 'MID', events);

    // Cause-tagged damage is environmental — it must not masquerade as a
    // weapon result ('hit') or a body location ('Bleed') for fightAnalysis.
    expect(entry.attResult).toBeUndefined();
    expect(entry.hitLocation).toBeUndefined();
    expect(entry.damage).toBe(5);
  });

  it('surfaces arena events as reason codes', () => {
    const events: CombatEvent[] = [
      {
        type: 'ARENA_EVENT',
        actor: 'A',
        metadata: { arenaEventId: 'geyser_eruption', hazardName: 'Geyser Eruption' },
      },
    ];
    const entry = buildExchangeLogEntry(2, 1, 'MID', events);

    expect(entry.reasonCodes).toContain('ARENA_GEYSER_ERUPTION');
  });
});

describe('exchangeLog — endDeltas telemetry', () => {
  beforeAll(async () => {
    await loadCombatNarrative();
  });

  const attributes = { ST: 14, CN: 12, SZ: 12, WT: 12, WL: 12, SP: 12, DF: 10 };
  const bout = (arenaId?: string, providedRng = 7) => {
    const wA = makeWarrior({
      name: 'A',
      style: FightingStyle.BashingAttack,
      attributes,
    });
    const wD = makeWarrior({
      name: 'D',
      style: FightingStyle.TotalParry,
      attributes,
    });
    return simulateFight({
      planA: defaultPlanForWarrior(wA),
      planD: defaultPlanForWarrior(wD),
      warriorA: wA,
      warriorD: wD,
      providedRng,
      arenaId,
      deathRateMult: 0,
    });
  };

  it('records per-exchange endurance deltas — fightAnalysis fatigue input', () => {
    const outcome = bout();
    const entries = outcome.exchangeLog ?? [];
    expect(entries.length).toBeGreaterThan(0);

    // Attack/defense costs drain endurance every fighting exchange — the
    // field findFatigueCrossover accumulates must actually be populated.
    const withDeltas = entries.filter((e) => e.endDeltas);
    expect(withDeltas.length).toBeGreaterThan(0);
    // Endurance never regenerates mid-fight: every recorded delta is <= 0.
    for (const e of withDeltas) {
      expect(e.endDeltas!.a).toBeLessThanOrEqual(0);
      expect(e.endDeltas!.d).toBeLessThanOrEqual(0);
    }
  });

  it("captures an arena endurance_drain in the firing exchange's endDeltas", () => {
    // the_gallows_tree + seed 14: shadow_tendrils (drain 5 both) fires on
    // exchange 0 — deterministic, verified via ARENA_SHADOW_TENDRILS.
    const outcome = bout('the_gallows_tree', 14);
    const entry = (outcome.exchangeLog ?? []).find((e) =>
      e.reasonCodes?.includes('ARENA_SHADOW_TENDRILS')
    );
    expect(entry).toBeTruthy();
    // Drain alone is -5; the fighter's own combat costs add on top.
    expect(entry!.endDeltas!.a).toBeLessThanOrEqual(-5);
    expect(entry!.endDeltas!.d).toBeLessThanOrEqual(-5);
  });
});
