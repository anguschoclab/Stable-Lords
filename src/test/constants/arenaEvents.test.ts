/**
 * Arena events — verifies new arena event configs and constants.
 */
import { describe, it, expect } from 'vitest';
import { ARENA_EVENTS, ARENA_EVENT_CONSTANTS } from '@/constants/arenaEvents';
import { getAllArenas } from '@/data/arenas';

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

    it('V10 event triggers are defined', () => {
      expect(ARENA_EVENT_CONSTANTS.BATHHOUSE_SCALD_TRIGGER).toBe(8);
      expect(ARENA_EVENT_CONSTANTS.HEATH_APPARITION_TRIGGER).toBe(18);
      expect(ARENA_EVENT_CONSTANTS.CRUMBLING_SPIRE_FALL_TRIGGER).toBeDefined();
      expect(ARENA_EVENT_CONSTANTS.MIST_VEIL_TRIGGER).toBeDefined();
    });
  });

  describe('V10 events (PRs #1018/#1019 union)', () => {
    it('bathhouse_scald requires water+premium+indoor tags', () => {
      const e = ARENA_EVENTS.bathhouse_scald;
      expect(e).toBeDefined();
      expect(e!.requiredTags).toEqual(['water', 'premium', 'indoor']);
      expect(e!.triggerCondition).toBe('exchange_interval');
      expect(e!.triggerValue).toBe(ARENA_EVENT_CONSTANTS.BATHHOUSE_SCALD_TRIGGER);
    });

    it('heath_apparition requires cursed+outdoor+open tags', () => {
      const e = ARENA_EVENTS.heath_apparition;
      expect(e).toBeDefined();
      expect(e!.requiredTags).toEqual(['cursed', 'outdoor', 'open']);
      expect(e!.triggerCondition).toBe('heavy_hit');
    });

    it('crumbling_spire_fall requires elevated+ruins tags', () => {
      const e = ARENA_EVENTS.crumbling_spire_fall;
      expect(e).toBeDefined();
      expect(e!.requiredTags).toEqual(['elevated', 'ruins']);
      expect(e!.triggerCondition).toBe('heavy_hit');
      expect(e!.mechanicalEffect).toEqual({ type: 'damage', value: 2 });
    });

    it('mist_veil requires cramped+outdoor tags', () => {
      const e = ARENA_EVENTS.mist_veil;
      expect(e).toBeDefined();
      expect(e!.requiredTags).toEqual(['cramped', 'outdoor']);
      expect(e!.triggerCondition).toBe('exchange_interval');
      expect(e!.mechanicalEffect).toEqual({ type: 'initiative_mod', value: -2 });
    });

    it('slick_floor requires indoor tags and suppresses ripostes', () => {
      const e = ARENA_EVENTS.slick_floor;
      expect(e).toBeDefined();
      expect(e!.requiredTags).toEqual(['indoor']);
      expect(e!.triggerCondition).toBe('exchange_interval');
      expect(e!.mechanicalEffect?.type).toBe('riposte_mod');
      expect(e!.mechanicalEffect!.value).toBeLessThan(0);
    });
  });

  describe('mechanical-effect coverage', () => {
    it('the registry exercises every declared mechanicalEffect type', () => {
      // riposte_mod was a dead union member — no event emitted it, so the
      // marker/echo path in defense.ts was inert. Every declared effect
      // type must have at least one live producer.
      const types = new Set(
        Object.values(ARENA_EVENTS).map((e) => e.mechanicalEffect?.type)
      );
      for (const t of ['damage', 'initiative_mod', 'riposte_mod', 'endurance_drain']) {
        expect(types.has(t as never), `no registry event emits ${t}`).toBe(true);
      }
    });
  });

  describe('no orphan events', () => {
    it('every event can fire at some registered arena (requiredTags ⊆ a tag union)', () => {
      const arenas = getAllArenas();
      const allTags = new Set(arenas.flatMap((a) => a.tags));
      for (const event of Object.values(ARENA_EVENTS)) {
        for (const tag of event.requiredTags) {
          expect(
            allTags.has(tag),
            `${event.id} requires tag '${tag}' that no registered arena carries`
          ).toBe(true);
        }
        // Stronger: at least one arena carries ALL of the event's required tags.
        const hostable = arenas.some((a) =>
          event.requiredTags.every((t) => a.tags.includes(t))
        );
        expect(hostable, `${event.id} can never trigger — no arena has all requiredTags`).toBe(
          true
        );
      }
    });
  });
});
