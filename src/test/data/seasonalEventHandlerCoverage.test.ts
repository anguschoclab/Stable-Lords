/**
 * Seasonal event handler coverage — bidirectional: every JSON offseason
 * event dispatches to a registered handler and every registered handler is
 * reachable from a JSON event's effectType.
 */
import { describe, it, expect } from 'vitest';
import { narrativeContent } from '@/data/narrative';
import { EVENT_HANDLERS } from '@/engine/pipeline/seasonal';

describe('seasonal event handler coverage', () => {
  const jsonEvents = (narrativeContent.offseason_events ?? {}) as Record<
    string,
    { effectType?: string }
  >;
  const jsonKeys = Object.keys(jsonEvents);
  const jsonEffectTypes = jsonKeys.map((key) => jsonEvents[key]?.effectType);

  it('every offseason_events key has a non-empty effectType', () => {
    for (const key of jsonKeys) {
      expect(jsonEvents[key]?.effectType, `Event "${key}" missing effectType`).toBeTruthy();
    }
  });

  it('no duplicate effectTypes in offseason_events', () => {
    const uniqueTypes = new Set(jsonEffectTypes);
    expect(uniqueTypes.size, 'Duplicate effectTypes found').toBe(jsonEffectTypes.length);
  });

  it('every JSON effectType resolves to a registered handler', () => {
    for (const key of jsonKeys) {
      const effectType = jsonEvents[key]?.effectType;
      expect(
        effectType && EVENT_HANDLERS[effectType as keyof typeof EVENT_HANDLERS],
        `Event "${key}" has effectType "${effectType}" with no handler`
      ).toBeTypeOf('function');
    }
  });

  it('every registered handler is reachable from a JSON event', () => {
    const reachable = new Set(jsonEffectTypes);
    for (const handlerKey of Object.keys(EVENT_HANDLERS)) {
      expect(
        reachable.has(handlerKey),
        `Handler "${handlerKey}" has no offseason_events entry — dead code`
      ).toBe(true);
    }
  });
});
