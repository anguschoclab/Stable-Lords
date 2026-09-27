/**
 * Stage G — debug-drawer telemetry completeness.
 * buildExchangeLogEntry projects the CombatEvent stream into ExchangeLogEntry
 * reasonCodes; STATE_CHANGE events (psych transitions, desperate-plan
 * activation) and condition-trigger annotations are real telemetry the
 * drawer must surface, not silently drop.
 */
// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { buildExchangeLogEntry } from '@/engine/simulate/logging';
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
    const events: CombatEvent[] = [
      { type: 'STATE_CHANGE', actor: 'A', result: 'DESPERATE' },
    ];
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
});
