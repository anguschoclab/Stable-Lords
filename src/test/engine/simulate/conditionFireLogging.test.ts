// @vitest-environment node
/**
 * Stage E — structured condition-fire telemetry.
 * `reasonCodes` carries CONDITION_* strings for telemetry, but the fighter
 * side is lost in the code string. `buildExchangeLogEntry` now projects a
 * structured `conditionFire` field so the Corner Analysis panel can
 * attribute every plan shift — and every corner intervention — to a side.
 */
import { describe, it, expect } from 'vitest';
import { buildExchangeLogEntry } from '@/engine/simulate/logging';
import type { CombatEvent } from '@/types/combat.types';

describe('buildExchangeLogEntry — conditionFire projection', () => {
  it('projects a side-attributed structured fire from STATE_CHANGE', () => {
    const events: CombatEvent[] = [
      { type: 'STATE_CHANGE', actor: 'D', result: 'CONDITION_OPPONENT_MOMENTUM_LEAD' },
    ];
    const entry = buildExchangeLogEntry(3, 2, 'MID', events);
    expect(entry.conditionFire).toEqual({
      actor: 'D',
      trigger: 'OPPONENT_MOMENTUM_LEAD',
      corner: false,
    });
    // reasonCodes keep the legacy string for existing telemetry consumers.
    expect(entry.reasonCodes).toContain('CONDITION_OPPONENT_MOMENTUM_LEAD');
  });

  it('marks corner-forced re-checks', () => {
    const events: CombatEvent[] = [
      { type: 'STATE_CHANGE', actor: 'A', result: 'CONDITION_HP_BELOW@CORNER' },
    ];
    const entry = buildExchangeLogEntry(1, 1, 'OPENING', events);
    expect(entry.conditionFire).toEqual({ actor: 'A', trigger: 'HP_BELOW', corner: true });
  });

  it('leaves conditionFire absent on non-condition STATE_CHANGEs', () => {
    const events: CombatEvent[] = [{ type: 'STATE_CHANGE', actor: 'A', result: 'DESPERATE' }];
    const entry = buildExchangeLogEntry(0, 1, 'OPENING', events);
    expect(entry.conditionFire).toBeUndefined();
  });
});
