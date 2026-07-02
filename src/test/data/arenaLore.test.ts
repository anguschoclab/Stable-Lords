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
      expect(validArenaIds.has(entry.arenaId), `${entry.id} references unknown arenaId ${entry.arenaId}`).toBe(true);
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
});
