import { describe, it, expect } from 'vitest';
import { runSeasonalPass } from '@/engine/pipeline/seasonal';
import narrativeContent from '@/data/narrativeContent.json';
const eventCount = Object.keys((narrativeContent as any).offseason_events).length;
import type { GameState } from '@/types/state.types';
import { SeededRNGService } from '@/utils/random';
import type { WarriorId } from '@/types/shared.types';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import type { Warrior } from '@/types/warrior.types';

describe('runSeasonalPass', () => {
  it('should trigger the chaos_rift offseason event, updating XP, Fame, treasury and adding an Insight Token', () => {
    const rng = new SeededRNGService(99);
    const originalNext = rng.next.bind(rng);
    let callCount = 0;
    const mockNext = () => {
      callCount++;
      if (callCount === 1)
        return (
          (Object.keys((narrativeContent as any).offseason_events).indexOf('chaos_rift') + 0.5) /
          eventCount
        );
      return originalNext();
    };
    rng.next = mockNext;
    const warriorId = 'w-chaos' as WarriorId;
    const state: Partial<GameState> = {
      year: 1,
      roster: [{ id: warriorId, name: 'Slippery Pete', status: 'Active' } as any],
      newsletter: [],
      treasury: 1000,
    };
    const impact = runSeasonalPass(state as GameState, 1, rng);
    expect(impact.treasuryDelta).toBe(150);
    const updates = impact.rosterUpdates?.get(warriorId);
    expect(updates?.xp).toBe(25);
    expect(updates?.fame).toBe(15);
    expect(impact.insightTokens?.length).toBe(1);
    expect(impact.insightTokens![0]!.type).toBe('Style');
    expect(impact.insightTokens![0]!.origin).toBe('Chaos Rift');
    expect(impact.newsletterItems?.[0]?.title).toBe('The Chaos Rift');
  });
  it('should trigger the wandering_fortune_teller offseason event, deducting gold, adding XP, and adding an Insight Token', () => {
    const rng = new SeededRNGService(99);
    const originalNext = rng.next.bind(rng);
    let callCount = 0;
    const mockNext = () => {
      callCount++;
      if (callCount === 1)
        return (
          (Object.keys((narrativeContent as any).offseason_events).indexOf('wandering_fortune_teller') + 0.5) /
          eventCount
        );
      return originalNext();
    };
    rng.next = mockNext;
    const warriorId = 'w-fortune' as WarriorId;
    const state: Partial<GameState> = {
      year: 1,
      roster: [{ id: warriorId, name: 'Lucky Leo', status: 'Active' } as any],
      newsletter: [],
      treasury: 1000,
    };
    const impact = runSeasonalPass(state as GameState, 1, rng);

    expect(impact.treasuryDelta).toBe(-30);
    const updates = impact.rosterUpdates?.get(warriorId);
    expect(updates?.xp).toBe(15);
    expect(impact.insightTokens?.length).toBe(1);
    expect(impact.insightTokens![0]!.type).toBe('Style');
    expect(impact.insightTokens![0]!.origin).toBe('Wandering Fortune Teller');
    expect(impact.newsletterItems?.[0]?.title).toBe('The Wandering Fortune Teller');
  });

  it('should not do anything if nextWeek is not 1', () => {
    const impact = runSeasonalPass({ year: 1 } as GameState, 2);
    expect(impact).toEqual({});
  });

  it('should trigger the black_market_raid offseason event, deduct gold, and newsletter', () => {
    const rng = new SeededRNGService(99);
    const originalNext = rng.next.bind(rng);
    let callCount = 0;
    const mockNext = () => {
      callCount++;
      if (callCount === 1)
        return (
          (Object.keys((narrativeContent as any).offseason_events).indexOf('black_market_raid') +
            0.5) /
          eventCount
        ); // picks black_market_raid
      return originalNext();
    };
    rng.next = mockNext;

    const warriorId = 'w-seasonal-raid' as WarriorId;
    const state: Partial<GameState> = {
      year: 1,
      roster: [{ id: warriorId, name: 'Slippery Pete', status: 'Active' } as any],
      newsletter: [],
      treasury: 1000,
    };

    const impact = runSeasonalPass(state as GameState, 1, rng);

    expect(impact.treasuryDelta).toBeDefined();
    expect(impact.treasuryDelta).toBeLessThanOrEqual(-50);
    expect(impact.treasuryDelta).toBeGreaterThanOrEqual(-150);

    expect(impact.ledgerEntries).toHaveLength(1);
    expect(impact.ledgerEntries?.[0]?.label).toBe('Black Market Fines');

    expect(impact.newsletterItems).toHaveLength(1);
    expect(impact.newsletterItems?.[0]?.title).toBe('Black Market Raid');
  });

  it('should trigger the grand_feast offseason event, deduct gold, award XP to all active', () => {
    const rng = new SeededRNGService(99);
    const originalNext = rng.next.bind(rng);
    let callCount = 0;
    const mockNext = () => {
      callCount++;
      if (callCount === 1)
        return (
          (Object.keys((narrativeContent as any).offseason_events).indexOf('grand_feast') + 0.5) /
          eventCount
        ); // picks grand_feast
      return originalNext();
    };
    rng.next = mockNext;

    const state: Partial<GameState> = {
      year: 1,
      roster: [
        { id: 'w1', name: 'Bob', status: 'Active', xp: 5 } as any,
        { id: 'w2', name: 'Alice', status: 'Active', xp: 10 } as any,
        { id: 'w3', name: 'Retired Dan', status: 'Retired', xp: 20 } as any,
      ],
      newsletter: [],
      treasury: 1000,
    };

    const impact = runSeasonalPass(state as GameState, 1, rng);

    expect(impact.treasuryDelta).toBeDefined();
    expect(impact.treasuryDelta).toBeLessThanOrEqual(-200);
    expect(impact.treasuryDelta).toBeGreaterThanOrEqual(-400);

    expect(impact.ledgerEntries).toHaveLength(1);
    expect(impact.ledgerEntries?.[0]?.label).toBe('Grand Feast Expenses');

    // w1 and w2 should get +10 xp. w3 gets nothing
    const w1Update = impact.rosterUpdates?.get('w1' as WarriorId);
    expect(w1Update?.xp).toBe(15);

    const w2Update = impact.rosterUpdates?.get('w2' as WarriorId);
    expect(w2Update?.xp).toBe(20);

    expect(impact.rosterUpdates?.has('w3' as WarriorId)).toBe(false);

    expect(impact.newsletterItems).toHaveLength(1);
    expect(impact.newsletterItems?.[0]?.title).toBe('A Grand Feast');
  });
  // Adding basic coverage to make sure the seasonal pass doesn't crash
  it('should run offseason event when nextWeek is 1', () => {
    const state: Partial<GameState> = {
      year: 1,
      roster: [{ id: 'w1', name: 'Bob', status: 'Active', injuries: [] } as any],
    };

    const rng = new SeededRNGService(42);
    const impact = runSeasonalPass(state as GameState, 1, rng);

    // Impact should have some changes, let's just make sure it doesn't crash
    // and returns a state impact object.
    expect(impact).toBeDefined();
    // In our SeededRNGService, 42 will pick a specific event, we just want to know it didn't throw.
  });

  it('should trigger the tavern_brawl offseason event, award fame, and add a Bruised Ribs injury', () => {
    // Offseason event keys in order: festival_of_blades(0), harsh_winter(1),
    // merchant_blessing(2), offseason_epiphany(3), tavern_brawl(4)
    // To pick index 4 out of 5: Math.floor(x * 5) === 4 → x in [0.8, 1.0)
    const rng = new SeededRNGService(99);
    const originalNext = rng.next.bind(rng);
    let callCount = 0;
    const mockNext = () => {
      callCount++;
      if (callCount === 1)
        return (
          (Object.keys((narrativeContent as any).offseason_events).indexOf('tavern_brawl') + 0.5) /
          eventCount
        ); // picks tavern_brawl
      return originalNext();
    };
    rng.next = mockNext;

    const warriorId = 'w-seasonal' as WarriorId;
    const state: Partial<GameState> = {
      year: 1,
      roster: [{ id: warriorId, name: 'Ragnar', status: 'Active', fame: 10, injuries: [] } as any],
      newsletter: [],
    };

    const impact = runSeasonalPass(state as GameState, 1, rng);

    // The warrior should have received fame (+10 to +20)
    const update = impact.rosterUpdates?.get(warriorId);
    expect(update).toBeDefined();
    expect(update?.fame).toBeGreaterThanOrEqual(20);
    expect(update?.fame).toBeLessThanOrEqual(30);

    // The warrior should have a Bruised Ribs injury
    expect(update?.injuries).toHaveLength(1);
    expect(update?.injuries?.[0]?.name).toBe('Bruised Ribs');
    expect(update?.injuries?.[0]?.severity).toBe('Minor');
    expect(update?.injuries?.[0]?.penalties).toEqual({ CN: -1 });

    // Newsletter should reference the brawl
    expect(impact.newsletterItems).toHaveLength(1);
    expect(impact.newsletterItems?.[0]?.title).toBe('Tavern Brawl');
  });

  it('should not add a Bruised Ribs injury to an already-injured warrior in tavern_brawl', () => {
    const rng = new SeededRNGService(99);
    const originalNext = rng.next.bind(rng);
    let callCount = 0;
    const mockNext = () => {
      callCount++;
      if (callCount === 1)
        return (
          (Object.keys((narrativeContent as any).offseason_events).indexOf('tavern_brawl') + 0.5) /
          eventCount
        ); // picks tavern_brawl
      return originalNext();
    };
    rng.next = mockNext;

    const warriorId = 'w-injured' as WarriorId;
    const state: Partial<GameState> = {
      year: 1,
      roster: [
        {
          id: warriorId,
          name: 'Scarred Ulf',
          status: 'Active',
          fame: 5,
          injuries: [
            {
              id: 'inj-1' as any,
              name: 'Cracked Ribs',
              severity: 'Moderate',
              weeksRemaining: 3,
              penalties: { CN: -2 },
            },
          ],
        } as any,
      ],
      newsletter: [],
    };

    const impact = runSeasonalPass(state as GameState, 1, rng);

    // No roster updates for the injured warrior — they were skipped
    expect(impact.rosterUpdates?.has(warriorId)).toBeFalsy();
  });

  it('should trigger wandering_healer and cure an injury if someone is injured', () => {
    const rng = new SeededRNGService(99);
    const originalNext = rng.next.bind(rng);
    let callCount = 0;
    const mockNext = () => {
      callCount++;
      if (callCount === 1)
        return (
          (Object.keys((narrativeContent as any).offseason_events).indexOf('wandering_healer') +
            0.5) /
          eventCount
        ); // picks wandering_healer
      return originalNext();
    };
    rng.next = mockNext;

    const warriorId = 'w-injured' as WarriorId;
    const state: Partial<GameState> = {
      year: 1,
      roster: [
        {
          id: warriorId,
          name: 'Sickly Bob',
          status: 'Active',
          injuries: [
            {
              id: 'inj-1' as any,
              name: 'Cracked Ribs',
              severity: 'Moderate',
              weeksRemaining: 3,
              penalties: { CN: -2 },
            },
            {
              id: 'inj-2' as any,
              name: 'Sprained Ankle',
              severity: 'Minor',
              weeksRemaining: 1,
              penalties: { AG: -1 },
            },
          ],
        } as any,
      ],
      newsletter: [],
      treasury: 1000,
    };

    const impact = runSeasonalPass(state as GameState, 1, rng);

    expect(impact.treasuryDelta).toBeDefined();
    expect(impact.treasuryDelta).toBeLessThanOrEqual(-50);
    expect(impact.treasuryDelta).toBeGreaterThanOrEqual(-100);

    expect(impact.ledgerEntries).toHaveLength(1);
    expect(impact.ledgerEntries?.[0]?.label).toBe('Medical Tonics');

    // Should have 1 injury removed
    const wUpdate = impact.rosterUpdates?.get(warriorId);
    expect(wUpdate).toBeDefined();
    expect(wUpdate?.injuries).toHaveLength(1);

    expect(impact.newsletterItems).toHaveLength(1);
    expect(impact.newsletterItems?.[0]?.title).toBe('A Wandering Healer');
    expect(impact.newsletterItems?.[0]?.items[0]).toContain('cured Sickly Bob of an injury');
  });

  it('should trigger wandering_healer and offer snake oil if no one is injured', () => {
    const rng = new SeededRNGService(99);
    const originalNext = rng.next.bind(rng);
    let callCount = 0;
    const mockNext = () => {
      callCount++;
      if (callCount === 1)
        return (
          (Object.keys((narrativeContent as any).offseason_events).indexOf('wandering_healer') +
            0.5) /
          eventCount
        ); // picks wandering_healer
      return originalNext();
    };
    rng.next = mockNext;

    const state: Partial<GameState> = {
      year: 1,
      roster: [
        {
          id: 'w-healthy' as WarriorId,
          name: 'Healthy Bob',
          status: 'Active',
          injuries: [],
        } as any,
      ],
      newsletter: [],
      treasury: 1000,
    };

    const impact = runSeasonalPass(state as GameState, 1, rng);

    expect(impact.treasuryDelta).toBeDefined();
    expect(impact.treasuryDelta).toBeLessThanOrEqual(-50);
    expect(impact.treasuryDelta).toBeGreaterThanOrEqual(-100);

    expect(impact.ledgerEntries).toHaveLength(1);
    expect(impact.ledgerEntries?.[0]?.label).toBe('Medical Tonics');

    // Should have no roster updates
    expect(impact.rosterUpdates?.has('w-healthy' as WarriorId)).toBeFalsy();

    expect(impact.newsletterItems).toHaveLength(1);
    expect(impact.newsletterItems?.[0]?.title).toBe('A Wandering Healer');
    expect(impact.newsletterItems?.[0]?.items[0]).toContain('snake oil tonics');
  });

  it('should trigger the mystic_vision offseason event, award xp and fame, and add a newsletter item', () => {
    const rng = new SeededRNGService(99);
    const originalNext = rng.next.bind(rng);
    let callCount = 0;
    const mockNext = () => {
      callCount++;
      if (callCount === 1)
        return (
          (Object.keys((narrativeContent as any).offseason_events).indexOf('mystic_vision') + 0.5) /
          eventCount
        ); // picks mystic_vision
      return originalNext();
    };
    rng.next = mockNext;

    const warriorId = 'w-mystic' as WarriorId;
    const state: Partial<GameState> = {
      year: 1,
      roster: [{ id: warriorId, name: 'Grok', status: 'Active', xp: 5, fame: 5 } as any],
      newsletter: [],
    };

    const impact = runSeasonalPass(state as GameState, 1, rng);

    // The warrior should have received XP (+15) and Fame (+10)
    const update = impact.rosterUpdates?.get(warriorId);
    expect(update).toBeDefined();
    expect(update?.xp).toBe(20);
    expect(update?.fame).toBe(15);

    // Newsletter should reference the mystic vision
    expect(impact.newsletterItems).toHaveLength(1);
    expect(impact.newsletterItems?.[0]?.title).toBe('A Mystic Vision');
  });

  it('should trigger the wild_animal_attack offseason event, award fame, and add a Bite Wound injury', () => {
    const rng = new SeededRNGService(99);
    const originalNext = rng.next.bind(rng);
    let callCount = 0;
    const mockNext = () => {
      callCount++;
      if (callCount === 1)
        return (
          (Object.keys((narrativeContent as any).offseason_events).indexOf('wild_animal_attack') +
            0.5) /
          eventCount
        ); // picks wild_animal_attack
      return originalNext();
    };
    rng.next = mockNext;

    const warriorId = 'w-animal' as WarriorId;
    const state: Partial<GameState> = {
      year: 1,
      roster: [{ id: warriorId, name: 'Grok', status: 'Active', fame: 5, injuries: [] } as any],
    };

    const impact = runSeasonalPass(state as GameState, 1, rng);

    expect(impact.rosterUpdates?.get(warriorId)?.fame).toBeGreaterThan(5);
    expect(impact.rosterUpdates?.get(warriorId)?.injuries?.[0]?.name).toBe('Bite Wound');
    expect(impact.newsletterItems?.[0]?.title).toBe('Wild Beast Encounter');
  });

  it('should trigger the loyal_stray offseason event, award xp and fame, and deduct gold', () => {
    const rng = new SeededRNGService(99);
    const originalNext = rng.next.bind(rng);
    let callCount = 0;
    const mockNext = () => {
      callCount++;
      if (callCount === 1)
        return (
          (Object.keys((narrativeContent as any).offseason_events).indexOf('loyal_stray') + 0.5) /
          eventCount
        ); // picks loyal_stray
      return originalNext();
    };
    rng.next = mockNext;

    const warriorId = 'w-stray' as WarriorId;
    const state: Partial<GameState> = {
      year: 1,
      roster: [{ id: warriorId, name: 'Grok', status: 'Active', xp: 5, fame: 5 } as any],
      treasury: 100,
      newsletter: [],
    };

    const impact = runSeasonalPass(state as GameState, 1, rng);

    expect(impact.treasuryDelta).toBe(-25);
    expect(impact.ledgerEntries).toHaveLength(1);
    expect(impact.ledgerEntries?.[0]?.label).toBe('Dog Food & Treats');

    const update = impact.rosterUpdates?.get(warriorId);
    expect(update).toBeDefined();
    expect(update?.xp).toBe(15);
    expect(update?.fame).toBe(10);

    expect(impact.newsletterItems).toHaveLength(1);
    expect(impact.newsletterItems?.[0]?.title).toBe('A Loyal Stray');
  });

  it('should trigger the street_performance offseason event, gaining fame and gold, and adding a tag', () => {
    const rng = new SeededRNGService(99);
    const originalNext = rng.next.bind(rng);
    let callCount = 0;
    const mockNext = () => {
      callCount++;
      if (callCount === 1)
        return (
          (Object.keys((narrativeContent as any).offseason_events).indexOf('street_performance') +
            0.5) /
          eventCount
        ); // picks street_performance
      return originalNext();
    };
    rng.next = mockNext;

    const warriorId = 'w-performer' as WarriorId;
    const state: Partial<GameState> = {
      year: 1,
      roster: [{ id: warriorId, name: 'Busk the Great', status: 'Active', flair: [] } as any],
      newsletter: [],
      treasury: 1000,
    };

    const impact = runSeasonalPass(state as GameState, 1, rng);

    expect(impact.treasuryDelta).toBeDefined();
    expect(impact.treasuryDelta).toBeGreaterThan(0);

    expect(impact.ledgerEntries).toBeDefined();
    expect(impact.ledgerEntries?.[0]?.label).toBe('Street Performance Tips');

    expect(impact.newsletterItems).toHaveLength(1);
    expect(impact.newsletterItems?.[0]?.items[0]).toContain('Busk the Great');

    const wUpdate = impact.rosterUpdates?.get(warriorId);
    expect(wUpdate).toBeDefined();
    expect(wUpdate?.fame).toBe(15);
    expect(wUpdate?.flair).toContain('Local Hero');
  });

  it('should trigger the chaotic_spells offseason event and award xp (roll < 0.33)', () => {
    const rng = new SeededRNGService(99);
    const originalNext = rng.next.bind(rng);
    let callCount = 0;
    const mockNext = () => {
      callCount++;
      if (callCount === 1)
        return (
          (Object.keys((narrativeContent as any).offseason_events).indexOf('chaotic_spells') +
            0.5) /
          eventCount
        ); // picks chaotic_spells
      if (callCount === 3) return 0.2; // roll < 0.33, triggers XP gain
      if (callCount === 4) return 0.5; // for xp roll
      return originalNext();
    };
    rng.next = mockNext;

    const warriorId = 'w-magic' as WarriorId;
    const state: Partial<GameState> = {
      year: 1,
      roster: [{ id: warriorId, name: 'Grok', status: 'Active', xp: 5, fame: 5 } as any],
      newsletter: [],
    };

    const impact = runSeasonalPass(state as GameState, 1, rng);

    const update = impact.rosterUpdates?.get(warriorId);
    expect(update).toBeDefined();
    expect(update?.xp).toBe(20); // 5 + 10 + Math.floor(0.5 * 11) = 20

    expect(impact.newsletterItems).toHaveLength(1);
    expect(impact.newsletterItems?.[0]?.title).toBe('Chaotic Spells');
    expect(impact.newsletterItems?.[0]?.items[0]).toContain('surge of unnatural energy');
  });

  it('should trigger the chaotic_spells offseason event and add injury (roll < 0.66)', () => {
    const rng = new SeededRNGService(99);
    const originalNext = rng.next.bind(rng);
    let callCount = 0;
    const mockNext = () => {
      callCount++;
      if (callCount === 1)
        return (
          (Object.keys((narrativeContent as any).offseason_events).indexOf('chaotic_spells') +
            0.5) /
          eventCount
        ); // picks chaotic_spells
      if (callCount === 3) return 0.5; // roll < 0.66, triggers minor injury
      if (callCount === 4) return 0.5; // for weeksRemaining roll
      return originalNext();
    };
    rng.next = mockNext;

    const warriorId = 'w-magic' as WarriorId;
    const state: Partial<GameState> = {
      year: 1,
      roster: [
        { id: warriorId, name: 'Grok', status: 'Active', xp: 5, fame: 5, injuries: [] } as any,
      ],
      newsletter: [],
    };

    const impact = runSeasonalPass(state as GameState, 1, rng);

    const update = impact.rosterUpdates?.get(warriorId);
    expect(update).toBeDefined();
    expect(update?.injuries).toHaveLength(1);
    expect(update?.injuries?.[0]?.name).toBe('Arcane Burns');

    expect(impact.newsletterItems).toHaveLength(1);
    expect(impact.newsletterItems?.[0]?.items[0]).toContain('sustained mild arcane burns');
  });

  it('should trigger the chaotic_spells offseason event and reduce fame (roll >= 0.66)', () => {
    const rng = new SeededRNGService(99);
    const originalNext = rng.next.bind(rng);
    let callCount = 0;
    const mockNext = () => {
      callCount++;
      if (callCount === 1)
        return (
          (Object.keys((narrativeContent as any).offseason_events).indexOf('chaotic_spells') +
            0.5) /
          eventCount
        ); // picks chaotic_spells
      if (callCount === 3) return 0.8; // roll >= 0.66, triggers fame loss
      if (callCount === 4) return 0.5; // for fame roll
      return originalNext();
    };
    rng.next = mockNext;

    const warriorId = 'w-magic' as WarriorId;
    const state: Partial<GameState> = {
      year: 1,
      roster: [{ id: warriorId, name: 'Grok', status: 'Active', xp: 5, fame: 15 } as any],
      newsletter: [],
    };

    const impact = runSeasonalPass(state as GameState, 1, rng);

    const update = impact.rosterUpdates?.get(warriorId);
    expect(update).toBeDefined();
    expect(update?.fame).toBe(7); // 15 - (5 + Math.floor(0.5 * 6)) = 15 - 8 = 7

    expect(impact.newsletterItems).toHaveLength(1);
    expect(impact.newsletterItems?.[0]?.items[0]).toContain('shade of purple');
  });

  it('should trigger the gladiator_olympics offseason event, award xp and fame, and add a newsletter item', () => {
    const rng = new SeededRNGService(99);
    const originalNext = rng.next.bind(rng);
    let callCount = 0;
    const mockNext = () => {
      callCount++;
      if (callCount === 1)
        return (
          (Object.keys((narrativeContent as any).offseason_events).indexOf('gladiator_olympics') +
            0.5) /
          eventCount
        ); // picks gladiator_olympics
      return originalNext();
    };
    rng.next = mockNext;

    const warriorId = 'w-olympic' as WarriorId;
    const state: Partial<GameState> = {
      year: 1,
      roster: [{ id: warriorId, name: 'Hercules', status: 'Active', xp: 10, fame: 20 } as any],
      newsletter: [],
    };

    const impact = runSeasonalPass(state as GameState, 1, rng);

    const update = impact.rosterUpdates?.get(warriorId);
    expect(update).toBeDefined();
    expect(update?.xp).toBeGreaterThanOrEqual(25); // 10 + 15 to 25
    expect(update?.xp).toBeLessThanOrEqual(35);
    expect(update?.fame).toBeGreaterThanOrEqual(30); // 20 + 10 to 20
    expect(update?.fame).toBeLessThanOrEqual(40);

    expect(impact.newsletterItems).toHaveLength(1);
    expect(impact.newsletterItems?.[0]?.title).toBe('Gladiator Olympics');
    expect(impact.newsletterItems?.[0]?.items[0]).toContain('Hercules');
  });

  it('should trigger the meteor_shower offseason event and award xp and fame', () => {
    const rng = new SeededRNGService(99);
    const originalNext = rng.next.bind(rng);
    let callCount = 0;
    const mockNext = () => {
      callCount++;
      if (callCount === 1)
        return (
          (Object.keys((narrativeContent as any).offseason_events).indexOf('meteor_shower') + 0.5) /
          eventCount
        ); // picks meteor_shower
      return originalNext();
    };
    rng.next = mockNext;

    const warriorId = 'w-meteor' as WarriorId;
    const state: Partial<GameState> = {
      year: 1,
      roster: [{ id: warriorId, name: 'Orion', status: 'Active', xp: 10, fame: 20 } as any],
      newsletter: [],
    };

    const impact = runSeasonalPass(state as GameState, 1, rng);

    const update = impact.rosterUpdates?.get(warriorId);
    expect(update).toBeDefined();
    expect(update?.xp).toBeGreaterThanOrEqual(25); // 10 + 15 to 25
    expect(update?.xp).toBeLessThanOrEqual(35);
    expect(update?.fame).toBeGreaterThanOrEqual(30); // 20 + 10 to 15
    expect(update?.fame).toBeLessThanOrEqual(35);

    expect(impact.newsletterItems).toHaveLength(1);
    expect(impact.newsletterItems?.[0]?.title).toBe('Meteor Shower');
    expect(impact.newsletterItems?.[0]?.items[0]).toContain('Orion');
  });

  it('should trigger the underground_pit_fight offseason event, award fame and add an injury', () => {
    const rng = new SeededRNGService(99);
    const originalNext = rng.next.bind(rng);
    let callCount = 0;
    const mockNext = () => {
      callCount++;
      if (callCount === 1)
        return (
          (Object.keys((narrativeContent as any).offseason_events).indexOf(
            'underground_pit_fight'
          ) +
            0.5) /
          eventCount
        ); // picks underground_pit_fight
      return originalNext();
    };
    rng.next = mockNext;

    const warriorId = 'w-pit' as WarriorId;
    const state: Partial<GameState> = {
      year: 1,
      roster: [
        { id: warriorId, name: 'Brutus', status: 'Active', xp: 10, fame: 20, injuries: [] } as any,
      ],
      newsletter: [],
    };

    const impact = runSeasonalPass(state as GameState, 1, rng);

    const update = impact.rosterUpdates?.get(warriorId);
    expect(update).toBeDefined();
    expect(update?.fame).toBeGreaterThanOrEqual(35); // 20 + 15 to 30
    expect(update?.fame).toBeLessThanOrEqual(50);
    expect(update?.injuries).toBeDefined();
    expect(update?.injuries?.length).toBeGreaterThanOrEqual(1);

    expect(impact.newsletterItems).toHaveLength(1);
    expect(impact.newsletterItems?.[0]?.title).toBe('Underground Pit Fight');
    expect(impact.newsletterItems?.[0]?.items[0]).toContain('Brutus');
  });

  it('should trigger the rogue_alchemist offseason event and award xp (success)', () => {
    const rng = new SeededRNGService(99);
    const originalNext = rng.next.bind(rng);
    let callCount = 0;
    const mockNext = () => {
      callCount++;
      if (callCount === 1)
        return (
          (Object.keys((narrativeContent as any).offseason_events).indexOf('rogue_alchemist') +
            0.5) /
          eventCount
        ); // picks rogue_alchemist
      if (callCount === 3) return 0.2; // roll < 0.5, success
      if (callCount === 4) return 0.5; // xp roll
      if (callCount === 5) return 0.5; // fame roll
      return originalNext();
    };
    rng.next = mockNext;

    const warriorId = 'w-alch-success' as WarriorId;
    const state: Partial<GameState> = {
      year: 1,
      roster: [
        { id: warriorId, name: 'Potion Drinker', status: 'Active', xp: 10, fame: 20 } as any,
      ],
      newsletter: [],
    };

    const impact = runSeasonalPass(state as GameState, 1, rng);

    const update = impact.rosterUpdates?.get(warriorId);
    expect(update).toBeDefined();
    expect(update?.xp).toBe(35); // 10 + (20 + 5)
    expect(update?.fame).toBe(28); // 20 + (5 + 3)

    expect(impact.newsletterItems).toHaveLength(1);
    expect(impact.newsletterItems?.[0]?.title).toBe('Rogue Alchemist');
    expect(impact.newsletterItems?.[0]?.items[0]).toContain('mutagenic success');
  });

  it('should trigger the rogue_alchemist offseason event and add an injury (failure)', () => {
    const rng = new SeededRNGService(99);
    const originalNext = rng.next.bind(rng);
    let callCount = 0;
    const mockNext = () => {
      callCount++;
      if (callCount === 1)
        return (
          (Object.keys((narrativeContent as any).offseason_events).indexOf('rogue_alchemist') +
            0.5) /
          eventCount
        ); // picks rogue_alchemist
      if (callCount === 3) return 0.8; // roll >= 0.5, failure
      return originalNext();
    };
    rng.next = mockNext;

    const warriorId = 'w-alch-fail' as WarriorId;
    const state: Partial<GameState> = {
      year: 1,
      roster: [{ id: warriorId, name: 'Poor Drinker', status: 'Active', injuries: [] } as any],
      newsletter: [],
    };

    const impact = runSeasonalPass(state as GameState, 1, rng);

    const update = impact.rosterUpdates?.get(warriorId);
    expect(update).toBeDefined();
    expect(update?.injuries).toBeDefined();
    expect(update?.injuries).toHaveLength(1);
    expect(update?.injuries?.[0]?.name).toBe('Alchemical Sickness');

    expect(impact.newsletterItems).toHaveLength(1);
    expect(impact.newsletterItems?.[0]?.title).toBe('Rogue Alchemist');
    expect(impact.newsletterItems?.[0]?.items[0]).toContain('battery acid');
  });

  it('should trigger the dreamweaver_visit offseason event, award xp and insight token', () => {
    const rng = new SeededRNGService(99);
    const originalNext = rng.next.bind(rng);
    let callCount = 0;
    const mockNext = () => {
      callCount++;
      if (callCount === 1)
        return (
          (Object.keys((narrativeContent as any).offseason_events).indexOf('dreamweaver_visit') +
            0.5) /
          eventCount
        ); // picks dreamweaver_visit
      if (callCount === 2) return 0.5; // pick active warrior
      if (callCount === 3) return 0.5; // xp roll
      return originalNext();
    };
    rng.next = mockNext;

    const warriorId = 'w-dream' as WarriorId;
    const state: Partial<GameState> = {
      year: 1,
      roster: [{ id: warriorId, name: 'Dreamer', status: 'Active', xp: 10 } as any],
      newsletter: [],
    };

    const impact = runSeasonalPass(state as GameState, 1, rng);

    expect(impact.rosterUpdates?.get(warriorId)).toBeDefined();
    expect(impact.rosterUpdates?.get(warriorId)?.xp).toBe(10 + 15 + Math.floor(0.5 * 11)); // base 10 + 15 + 5 = 30
    expect(impact.insightTokens).toHaveLength(1);
    expect(impact.insightTokens?.[0]?.origin).toBe('Dreamweaver');

    expect(impact.newsletterItems).toHaveLength(1);
    expect(impact.newsletterItems?.[0]?.title).toBe("Dreamweaver's Visit");
  });
  it('should trigger the tavern_brawl_surprise offseason event, updating fame and applying injury', () => {
    const rng = new SeededRNGService(99);
    const originalNext = rng.next.bind(rng);
    let callCount = 0;
    const mockNext = () => {
      callCount++;
      if (callCount === 1)
        return (
          (Object.keys((narrativeContent as any).offseason_events).indexOf(
            'tavern_brawl_surprise'
          ) +
            0.5) /
          eventCount
        ); // picks tavern_brawl_surprise
      if (callCount === 2) return 0.0; // rng.pick(activeWarriors) - picks index 0 ('Spartacus')
      if (callCount === 3) return 0.5; // fame roll
      if (callCount === 4) return 0.5; // injury weeks roll
      return originalNext();
    };
    rng.next = mockNext;

    const baseState = createFreshState('test-seed');
    baseState.year = 1;
    baseState.week = 12; // about to become 1
    baseState.roster = [
      {
        id: 'w1' as WarriorId,
        name: 'Spartacus',
        fame: 10,
        status: 'Active',
        injuries: [],
        isDead: false,
      } as unknown as Warrior,
    ];

    const impact = runSeasonalPass(baseState, 1, rng);

    expect(impact.rosterUpdates).toBeDefined();
    const update = impact.rosterUpdates!.get('w1' as WarriorId);
    expect(update).toBeDefined();
    expect(update?.fame).toBe(10 + 15 + Math.floor(0.5 * 11)); // 10 base + 15 base gain + 5 from roll = 30
    expect(update?.injuries).toBeDefined();
    expect(update?.injuries!.length).toBe(1);
    expect(update?.injuries![0]!.name).toBe('Tavern Bruises');
    expect(update?.injuries![0]!.severity).toBe('Minor');
    expect(update?.injuries![0]!.penalties?.SP).toBe(-1);

    expect(impact.newsletterItems).toBeDefined();
    expect(impact.newsletterItems!.length).toBe(1);
    expect(impact.newsletterItems![0]!.title).toBe('A Spontaneous Tavern Brawl');
    expect(impact.newsletterItems![0]!.items[0]).toContain('Spartacus');
  });
});
