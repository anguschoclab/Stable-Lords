/**
 * Megaplan Phase 5 — the name pool must sustain a 2× hard-cap world:
 * WORLD_RIVAL_HARD_CAP * 2 stables generated from templates must produce
 * unique stable names AND unique owner names (Roman-numeral suffixes cover
 * over-sampling past the authored template count).
 */
import { describe, it, expect } from 'vitest';
import { generateRivalStables } from '@/engine/rivals';
import { WORLD_RIVAL_HARD_CAP } from '@/constants/world';

describe('rival stable name pool', () => {
  it(`mints ${WORLD_RIVAL_HARD_CAP * 2} stables with unique stable names`, () => {
    const rivals = generateRivalStables(WORLD_RIVAL_HARD_CAP * 2, 424242);
    const names = rivals.map((r) => r.owner.stableName);
    expect(new Set(names).size).toBe(names.length);
  });

  it(`mints ${WORLD_RIVAL_HARD_CAP * 2} stables with unique owner names`, () => {
    const rivals = generateRivalStables(WORLD_RIVAL_HARD_CAP * 2, 777777);
    const names = rivals.map((r) => r.owner.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('keeps warrior names unique across an over-cap batch', () => {
    const rivals = generateRivalStables(WORLD_RIVAL_HARD_CAP, 135791);
    const warriorNames = rivals.flatMap((r) => r.roster.map((w) => w.name));
    expect(new Set(warriorNames).size).toBe(warriorNames.length);
  });
});
