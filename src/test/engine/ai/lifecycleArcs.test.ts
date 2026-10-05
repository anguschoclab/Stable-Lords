/**
 * Stage C — owner ambition arcs. `deriveAmbitionArc` maps an owner's
 * lifecycle position onto ASCENDANT / PRIME / DECLINING from competence,
 * generation, age, and recent track record. The arc colors season
 * objectives and retirement posture: ASCENDANT stables reach for crowns,
 * DECLINING ones consolidate and sell.
 */
import { describe, it, expect } from 'vitest';
import { deriveAmbitionArc } from '@/engine/ai/ambition';
import { makeRival, makeOwner, makeAgentMemory } from '@/test/_fixtures/factories';

const rivalWith = (over: {
  competence?: 'Novice' | 'Journeyman' | 'Veteran' | 'Master';
  generation?: number;
  age?: number;
  fame?: number;
  wins?: number;
  losses?: number;
}) =>
  makeRival({
    owner: makeOwner({
      competence: over.competence,
      generation: over.generation,
      age: over.age,
      fame: over.fame ?? 100,
    }),
    agentMemory: makeAgentMemory({
      seasonRecord: { wins: over.wins ?? 0, losses: over.losses ?? 0, kills: 0, rosterSizeAtSeasonStart: 6 },
    }),
  });

describe('deriveAmbitionArc', () => {
  it('a young Master on a winning run is ASCENDANT', () => {
    const rival = rivalWith({ competence: 'Master', generation: 0, age: 30, wins: 8, losses: 2 });
    expect(deriveAmbitionArc(rival)).toBe('ASCENDANT');
  });

  it('a mid-career Journeyman at .500 is PRIME', () => {
    const rival = rivalWith({ competence: 'Journeyman', generation: 1, age: 45, wins: 5, losses: 5 });
    expect(deriveAmbitionArc(rival)).toBe('PRIME');
  });

  it('an aging Novice on a losing skid is DECLINING', () => {
    const rival = rivalWith({ competence: 'Novice', generation: 3, age: 62, wins: 2, losses: 9 });
    expect(deriveAmbitionArc(rival)).toBe('DECLINING');
  });

  it('is deterministic — same inputs, same arc', () => {
    const rival = rivalWith({ competence: 'Veteran', generation: 1, age: 40, wins: 6, losses: 4 });
    expect(deriveAmbitionArc(rival)).toBe(deriveAmbitionArc(rival));
  });
});
