/**
 * Arena events — verifies new arena event configs and constants.
 *
 * Pre-merge test: will FAIL on main because new events don't exist yet.
 */
import { describe, it, expect } from 'vitest';
import { ARENA_EVENTS, ARENA_EVENT_CONSTANTS } from '@/constants/arena/arenaEvents';

describe('arena events — new entries', () => {
  describe('geyser_eruption', () => {
    it('exists in ARENA_EVENTS', () => {
      expect(ARENA_EVENTS.geyser_eruption).toBeDefined();
    });

    it('has requiredTags water and uneven', () => {
      const event = ARENA_EVENTS.geyser_eruption;
      expect(event!.requiredTags).toContain('water');
      expect(event!.requiredTags).toContain('uneven');
    });

    it('has triggerCondition exchange_interval', () => {
      expect(ARENA_EVENTS.geyser_eruption!.triggerCondition).toBe('exchange_interval');
    });

    it('has triggerValue 6', () => {
      expect(ARENA_EVENTS.geyser_eruption!.triggerValue).toBe(6);
    });

    it('has non-empty description and narrativeText', () => {
      const event = ARENA_EVENTS.geyser_eruption;
      expect(event!.description.length).toBeGreaterThan(5);
      expect(event!.narrativeText.length).toBeGreaterThan(5);
    });
  });

  describe('shadow_tendrils', () => {
    it('exists in ARENA_EVENTS', () => {
      expect(ARENA_EVENTS.shadow_tendrils).toBeDefined();
    });

    it('has requiredTags cursed', () => {
      expect(ARENA_EVENTS.shadow_tendrils!.requiredTags).toContain('cursed');
    });

    it('has triggerCondition heavy_hit', () => {
      expect(ARENA_EVENTS.shadow_tendrils!.triggerCondition).toBe('heavy_hit');
    });

    it('has triggerValue 20', () => {
      expect(ARENA_EVENTS.shadow_tendrils!.triggerValue).toBe(20);
    });

    it('has mechanicalEffect type endurance_drain with value 5', () => {
      const effect = ARENA_EVENTS.shadow_tendrils!.mechanicalEffect;
      expect(effect).toBeDefined();
      expect(effect!.type).toBe('endurance_drain');
      expect(effect!.value).toBe(5);
    });
  });

  describe('ARENA_EVENT_CONSTANTS', () => {
    it('GEYSER_ERUPTION_TRIGGER is 6', () => {
      expect(ARENA_EVENT_CONSTANTS.GEYSER_ERUPTION_TRIGGER).toBe(6);
    });

    it('SHADOW_TENDRIL_TRIGGER is 20', () => {
      expect(ARENA_EVENT_CONSTANTS.SHADOW_TENDRIL_TRIGGER).toBe(20);
    });

    it('SHADOW_TENDRIL_DRAIN is 5', () => {
      expect(ARENA_EVENT_CONSTANTS.SHADOW_TENDRIL_DRAIN).toBe(5);
    });
  });
});
