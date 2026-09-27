// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { AIIntentSchema } from '@/schemas/schemaEnums';
import { AIStrategySchema, AIAgentMemorySchema } from '@/schemas/economySchemas';

describe('crown-campaign schema additions', () => {
  it('AIIntentSchema accepts CROWN_CAMPAIGN', () => {
    expect(AIIntentSchema.safeParse('CROWN_CAMPAIGN').success).toBe(true);
  });

  it('AIStrategySchema accepts a targetArenaId', () => {
    const parsed = AIStrategySchema.safeParse({
      intent: 'CROWN_CAMPAIGN',
      planWeeksRemaining: 6,
      targetArenaId: 'arena_a',
    });
    expect(parsed.success).toBe(true);
    expect(parsed.success && parsed.data.targetArenaId).toBe('arena_a');
  });

  it('AIAgentMemorySchema accepts crownAssessment and pendingRelinquish', () => {
    const parsed = AIAgentMemorySchema.safeParse({
      lastTreasury: 1000,
      burnRate: 0,
      metaAwareness: {},
      knownRivals: [],
      opponentDossiers: {},
      crownAssessment: {
        arenaId: 'arena_a',
        warriorId: 'w1',
        score: 4,
        reason: 'Vacant crown',
      },
      pendingRelinquish: 'arena_b',
    });
    expect(parsed.success).toBe(true);
  });

  it('AIAgentMemorySchema rejects a malformed crownAssessment', () => {
    const parsed = AIAgentMemorySchema.safeParse({
      lastTreasury: 1000,
      burnRate: 0,
      metaAwareness: {},
      knownRivals: [],
      opponentDossiers: {},
      crownAssessment: { arenaId: 'arena_a' },
    });
    expect(parsed.success).toBe(false);
  });
});
