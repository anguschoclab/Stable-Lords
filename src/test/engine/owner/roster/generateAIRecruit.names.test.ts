/**
 * generateAIRecruit naming — recruits draw from the owner's cultural naming
 * convention and honor the shared usedNames set (previously no uniqueness
 * check existed).
 */
import { describe, it, expect } from 'vitest';
import { generateAIRecruit } from '@/engine/owner/roster/recruitGenerator';
import { makeRival, makeWarrior } from '@/test/_fixtures/factories';
import type { Warrior } from '@/types/warrior.types';

const NAME_RE = /^[A-Z][A-Z '-]{1,19}$/;

describe('generateAIRecruit — naming', () => {
  it('produces arena-format names', () => {
    const rival = makeRival();
    for (let seed = 0; seed < 30; seed++) {
      const w = generateAIRecruit(rival, seed + 1, undefined, seed);
      expect(w).not.toBeNull();
      expect(w!.name, `bad format: ${w!.name}`).toMatch(NAME_RE);
    }
  });

  it('does not collide with existing roster names when given usedNames', () => {
    const usedNames = new Set<string>();
    const rival = makeRival({
      roster: Array.from({ length: 8 }, (_, i) => makeWarrior({ name: `EXISTING WARRIOR ${i}` })),
    });
    // Pre-fill usedNames with the roster (callers pass this set).
    for (const w of rival.roster) usedNames.add(w.name);

    const seen = new Set<string>();
    for (let seed = 0; seed < 40; seed++) {
      const w = generateAIRecruit(rival, seed + 1, undefined, seed, usedNames);
      expect(w).not.toBeNull();
      expect(usedNames.has(w!.name), `collision: ${w!.name}`).toBe(false);
      expect(seen.has(w!.name), `repeat in run: ${w!.name}`).toBe(false);
      seen.add(w!.name);
      usedNames.add(w!.name);
    }
  });

  it('is deterministic for a seed', () => {
    const rival = makeRival();
    const a = generateAIRecruit(rival, 10, undefined, 42) as Warrior;
    const b = generateAIRecruit(rival, 10, undefined, 42) as Warrior;
    expect(a.name).toBe(b.name);
  });
});
