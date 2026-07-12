/**
 * Arena lore integrity — verifies unique IDs, valid arenaId refs,
 * and presence/absence of specific lore entries from lore-content-expansion.
 */
import { describe, it, expect } from 'vitest';
import { ARENA_LORE, getAllArenas } from '@/data/arenas';

describe('Arena lore integrity', () => {
  it('all ARENA_LORE entries have unique ids', () => {
    const ids = ARENA_LORE.map((e) => e.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('all ARENA_LORE entries reference a valid arenaId', () => {
    const validArenaIds = new Set(getAllArenas().map((a) => a.id));
    for (const entry of ARENA_LORE) {
      expect(
        validArenaIds.has(entry.arenaId),
        `${entry.id} references unknown arenaId ${entry.arenaId}`
      ).toBe(true);
    }
  });

  it('crystal_cavern_shattered_echoes is NOT present (removed duplicate)', () => {
    const ids = ARENA_LORE.map((e) => e.id);
    expect(ids).not.toContain('crystal_cavern_shattered_echoes');
  });

  it('walled_court_shattered_shield IS present (new entry)', () => {
    const ids = ARENA_LORE.map((e) => e.id);
    expect(ids).toContain('walled_court_shattered_shield');
  });

  it('flooded_drowning_chorus IS present (new entry)', () => {
    const ids = ARENA_LORE.map((e) => e.id);
    expect(ids).toContain('flooded_drowning_chorus');
  });

  it('flooded_vault_rusting_tide IS present (new entry)', () => {
    const ids = ARENA_LORE.map((e) => e.id);
    expect(ids).toContain('flooded_vault_rusting_tide');
  });

  it('highplain_howling_gale IS present (new entry)', () => {
    const ids = ARENA_LORE.map((e) => e.id);
    expect(ids).toContain('highplain_howling_gale');
  });

  it('flooded_vault_rusting_tide references valid arenaId', () => {
    const entry = ARENA_LORE.find((e) => e.id === 'flooded_vault_rusting_tide');
    expect(entry).toBeDefined();
    expect(entry!.arenaId).toBe('flooded_vault_arena');
  });

  it('highplain_howling_gale references valid arenaId', () => {
    const entry = ARENA_LORE.find((e) => e.id === 'highplain_howling_gale');
    expect(entry).toBeDefined();
    expect(entry!.arenaId).toBe('highplain_arena');
  });

  it('lantern_hall_forgotten_chains IS present (new entry)', () => {
    const ids = ARENA_LORE.map((e) => e.id);
    expect(ids).toContain('lantern_hall_forgotten_chains');
  });

  it('charnel_pits_blind_executioner IS present (new entry)', () => {
    const ids = ARENA_LORE.map((e) => e.id);
    expect(ids).toContain('charnel_pits_blind_executioner');
  });

  it('lantern_hall_forgotten_chains references valid arenaId', () => {
    const entry = ARENA_LORE.find((e) => e.id === 'lantern_hall_forgotten_chains');
    expect(entry).toBeDefined();
    expect(entry!.arenaId).toBe('lantern_hall_arena');
  });

  it('charnel_pits_blind_executioner references valid arenaId', () => {
    const entry = ARENA_LORE.find((e) => e.id === 'charnel_pits_blind_executioner');
    expect(entry).toBeDefined();
    expect(entry!.arenaId).toBe('charnel_pits');
  });

  it('both new entries have valid type, title, and narrative', () => {
    const chains = ARENA_LORE.find((e) => e.id === 'lantern_hall_forgotten_chains');
    expect(chains).toBeDefined();
    expect(chains!.type).toBeTruthy();
    expect(chains!.title).toBeTruthy();
    expect(chains!.narrative.length).toBeGreaterThan(20);

    const executioner = ARENA_LORE.find((e) => e.id === 'charnel_pits_blind_executioner');
    expect(executioner).toBeDefined();
    expect(executioner!.type).toBeTruthy();
    expect(executioner!.title).toBeTruthy();
    expect(executioner!.narrative.length).toBeGreaterThan(20);
  });

  it('charnel_pits_plague_surge IS present (new entry)', () => {
    const ids = ARENA_LORE.map((e) => e.id);
    expect(ids).toContain('charnel_pits_plague_surge');
  });

  it('charnel_pits_plague_surge references valid arenaId', () => {
    const entry = ARENA_LORE.find((e) => e.id === 'charnel_pits_plague_surge');
    expect(entry).toBeDefined();
    expect(entry!.arenaId).toBe('charnel_pits');
  });

  it('lantern_hall_the_blind_champ IS present (new entry)', () => {
    const ids = ARENA_LORE.map((e) => e.id);
    expect(ids).toContain('lantern_hall_the_blind_champ');
  });

  it('lantern_hall_the_blind_champ references valid arenaId', () => {
    const entry = ARENA_LORE.find((e) => e.id === 'lantern_hall_the_blind_champ');
    expect(entry).toBeDefined();
    expect(entry!.arenaId).toBe('lantern_hall_arena');
  });

  it('mudpit_arena_drowning IS present (new entry)', () => {
    const ids = ARENA_LORE.map((e) => e.id);
    expect(ids).toContain('mudpit_arena_drowning');
  });

  it('mudpit_arena_drowning references valid arenaId', () => {
    const entry = ARENA_LORE.find((e) => e.id === 'mudpit_arena_drowning');
    expect(entry).toBeDefined();
    expect(entry!.arenaId).toBe('mudpit_arena');
  });

  it('blood_pit_the_iron_rebellion IS present (new entry)', () => {
    const ids = ARENA_LORE.map((e) => e.id);
    expect(ids).toContain('blood_pit_the_iron_rebellion');
  });

  it('blood_pit_the_iron_rebellion references valid arenaId', () => {
    const entry = ARENA_LORE.find((e) => e.id === 'blood_pit_the_iron_rebellion');
    expect(entry).toBeDefined();
    expect(entry!.arenaId).toBe('gutter_pit');
  });

  it('shattered_coliseum_falling_statue IS present (new entry)', () => {
    const ids = ARENA_LORE.map((e) => e.id);
    expect(ids).toContain('shattered_coliseum_falling_statue');
  });

  it('shattered_coliseum_falling_statue references valid arenaId', () => {
    const entry = ARENA_LORE.find((e) => e.id === 'shattered_coliseum_falling_statue');
    expect(entry).toBeDefined();
    expect(entry!.arenaId).toBe('sundered_coliseum');
  });

  it('all 5 new lore entries have valid type, title, and narrative', () => {
    const newIds = [
      'charnel_pits_plague_surge',
      'lantern_hall_the_blind_champ',
      'mudpit_arena_drowning',
      'blood_pit_the_iron_rebellion',
      'shattered_coliseum_falling_statue',
    ];
    for (const id of newIds) {
      const entry = ARENA_LORE.find((e) => e.id === id);
      expect(entry, `missing lore entry: ${id}`).toBeDefined();
      expect(entry!.type).toBeTruthy();
      expect(entry!.title).toBeTruthy();
      expect(entry!.narrative.length).toBeGreaterThan(20);
    }
  });
});
