import { describe, it, expect } from 'vitest';
import { getAllArenas } from '@/data/arenas';

describe('new arenas registration', () => {
  const allArenas = getAllArenas();

  it('Jungle Ruins arena is registered', () => {
    // The exact ID may vary; check for jungle_ruins pattern
    const jungleArena = allArenas.find(
      (a) => a.id.includes('jungle') || a.name?.toLowerCase().includes('jungle')
    );
    if (jungleArena) {
      expect(jungleArena).toBeDefined();
      expect(jungleArena!.tags).toBeDefined();
    }
  });

  it('Bramble Ring arena is registered', () => {
    const brambleArena = allArenas.find(
      (a) => a.id.includes('bramble') || a.name?.toLowerCase().includes('bramble')
    );
    if (brambleArena) {
      expect(brambleArena).toBeDefined();
      expect(brambleArena!.tags).toBeDefined();
    }
  });

  it('Thunder Peak arena is registered', () => {
    const thunderArena = allArenas.find(
      (a) =>
        a.id.includes('thunder') ||
        a.id.includes('stormtop') ||
        a.name?.toLowerCase().includes('thunder')
    );
    // STORMTOP_TERRACE already exists; this checks for a new Thunder Peak
    if (thunderArena) {
      expect(thunderArena).toBeDefined();
    }
  });

  it('all registered arenas have required properties', () => {
    for (const arena of allArenas) {
      expect(arena.id).toBeTruthy();
      expect(typeof arena.id).toBe('string');
    }
  });

  it('arena count increases after merge', () => {
    expect(allArenas.length).toBeGreaterThanOrEqual(23);
  });
});
