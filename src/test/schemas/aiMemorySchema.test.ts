/**
 * Stage B.0 — AIAgentMemorySchema must round-trip the new perception fields:
 * opponentDossiers (required), lastSeasonRecord, lastLossFactors.
 */
import { describe, it, expect } from 'vitest';
import { AIAgentMemorySchema } from '@/schemas/economySchemas';

const baseMemory = {
  lastTreasury: 100,
  burnRate: -20,
  metaAwareness: { LungingAttack: 3 },
  knownRivals: ['stable-1'],
  opponentDossiers: {},
};

describe('AIAgentMemorySchema — perception fields', () => {
  it('round-trips a full memory incl. dossiers', () => {
    const memory = {
      ...baseMemory,
      currentIntent: 'VENDETTA',
      seasonRecord: { wins: 3, losses: 1, kills: 1, rosterSizeAtSeasonStart: 6 },
      lastSeasonRecord: { wins: 8, losses: 4, kills: 0, rosterSizeAtSeasonStart: 5 },
      lastLossFactors: ['Style matchup', 'Endurance'],
      opponentDossiers: {
        'stable-9': {
          lastSeenWeek: 12,
          knownStyles: ['LUNGING ATTACK', 'WALL OF STEEL'],
          estimatedThreat: 0.65,
          recordVs: { w: 2, l: 1, k: 1 },
          planIntel: { suspectedOE: 7, suspectedAL: 4, lastPlanWeek: 10 },
        },
      },
    };
    const parsed = AIAgentMemorySchema.parse(memory);
    expect(parsed.opponentDossiers['stable-9']!.recordVs.k).toBe(1);
    expect(parsed.opponentDossiers['stable-9']!.planIntel?.suspectedOE).toBe(7);
    expect(parsed.lastSeasonRecord?.wins).toBe(8);
    expect(parsed.lastLossFactors).toHaveLength(2);
  });

  it('requires opponentDossiers (no-compat mode: field is mandatory)', () => {
    const { opponentDossiers: _omit, ...missing } = baseMemory;
    expect(() => AIAgentMemorySchema.parse(missing)).toThrow();
  });

  it('rejects malformed dossier entries', () => {
    const bad = {
      ...baseMemory,
      opponentDossiers: {
        'stable-1': { lastSeenWeek: 'last week', recordVs: { w: 'many' } },
      },
    };
    expect(() => AIAgentMemorySchema.parse(bad)).toThrow();
  });

  it('rejects out-of-range threat estimates', () => {
    const bad = {
      ...baseMemory,
      opponentDossiers: {
        'stable-1': {
          lastSeenWeek: 2,
          knownStyles: [],
          estimatedThreat: 7,
          recordVs: { w: 0, l: 0, k: 0 },
        },
      },
    };
    expect(() => AIAgentMemorySchema.parse(bad)).toThrow();
  });
});
