/**
 * Stage H structural guard — AIEventCause sync.
 * The union is hand-maintained with no auto-check; this file pins it both
 * ways: adding a member without a row here fails typecheck (missing key),
 * removing one fails too (excess key). The runtime assertions verify the
 * non-intent causes thread through logAgentAction without corrupting
 * currentIntent — the regression the typed cause was introduced to kill
 * (description-substring matching).
 */
import { describe, it, expect } from 'vitest';
import { logAgentAction } from '@/engine/ai/agentCore';
import { makeRival } from '@/test/_fixtures/factories';
import { AI_INTENTS } from '@/types/enumSources';
import type { AIEventCause, AIAgentMemory, AIIntent } from '@/types/state.types';

// Bidirectional sync: Record<Exclude<AIEventCause, AIIntent>, true> fails
// typecheck if the union gains a member (missing key) or loses one (excess).
const NON_INTENT_CAUSES = {
  BOUT_OUTCOME: true,
  INTEL_UPDATE: true,
  MAINTENANCE: true,
  TOURNAMENT_PREP: true,
  CROWN_DEFENSE: true,
  CROWN_RELINQUISH: true,
  CROWN_PREP: true,
} satisfies Record<Exclude<AIEventCause, AIIntent>, true>;

describe('AIEventCause sync guard', () => {
  it('covers every non-intent cause exactly once', () => {
    expect(Object.keys(NON_INTENT_CAUSES).sort()).toEqual([
      'BOUT_OUTCOME',
      'CROWN_DEFENSE',
      'CROWN_PREP',
      'CROWN_RELINQUISH',
      'INTEL_UPDATE',
      'MAINTENANCE',
      'TOURNAMENT_PREP',
    ]);
  });

  it('non-intent causes log events but never overwrite currentIntent', () => {
    let rival = makeRival({
      agentMemory: {
        lastTreasury: 0,
        burnRate: 0,
        metaAwareness: {},
        knownRivals: [],
        opponentDossiers: {},
        currentIntent: 'RECOVERY',
      } as AIAgentMemory,
    });
    for (const cause of Object.keys(NON_INTENT_CAUSES) as AIEventCause[]) {
      rival = logAgentAction({ rival: rival, type: 'ROSTER', description: `test-${cause}`, riskTier: 'Low', week: 5, cause: cause });
      expect(rival.agentMemory?.currentIntent).toBe('RECOVERY');
    }
    expect(rival.actionHistory).toHaveLength(Object.keys(NON_INTENT_CAUSES).length);
  });

  it('every AIIntent is a valid cause and updates currentIntent', () => {
    let rival = makeRival();
    for (const intent of AI_INTENTS) {
      rival = logAgentAction({ rival: rival, type: 'STRATEGY', description: `test-${intent}`, riskTier: 'Low', week: 5, cause: intent });
      expect(rival.agentMemory?.currentIntent).toBe(intent);
    }
  });
});
