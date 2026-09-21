/**
 * Stage B.0 — logAgentAction must take a typed `cause` instead of inferring
 * intent from English description substrings (G10). Also locks the 20-cap
 * pruning and schema acceptance of `cause`.
 */
import { describe, it, expect } from 'vitest';
import { logAgentAction } from '@/engine/ai/agentCore';
import { AIEventSchema } from '@/schemas/economySchemas';
import { makeRival } from '@/test/_fixtures/factories';

describe('logAgentAction — typed cause', () => {
  it('sets currentIntent from a typed cause, not description text', () => {
    const rival = makeRival({ actionHistory: [] });
    const out = logAgentAction(rival, 'STRATEGY', 'Routine weekly review', 'Low', 5, 'VENDETTA');
    expect(out.agentMemory!.currentIntent).toBe('VENDETTA');
  });

  it('does NOT infer intent from description substrings anymore', () => {
    const rival = makeRival({ actionHistory: [] });
    // 'aggressive'/'dominance' phrasing previously forced AGGRESSIVE_EXPANSION
    const out = logAgentAction(
      rival,
      'STRATEGY',
      'Pursuing aggressive dominance via better scouting',
      'Low',
      5
    );
    expect(out.agentMemory!.currentIntent).not.toBe('AGGRESSIVE_EXPANSION');
  });

  it('stores the cause on the event itself', () => {
    const rival = makeRival({ actionHistory: [] });
    const out = logAgentAction(rival, 'BOUT', 'Won by KO', 'Low', 5, 'BOUT_OUTCOME');
    expect(out.actionHistory![0]!.cause).toBe('BOUT_OUTCOME');
    expect(out.actionHistory![0]!.type).toBe('BOUT');
  });

  it('leaves currentIntent untouched when cause is not an intent', () => {
    const rival = makeRival({ actionHistory: [] });
    rival.agentMemory = { ...rival.agentMemory!, currentIntent: 'RECOVERY' };
    const out = logAgentAction(rival, 'STAFF', 'Hired trainer', 'Low', 5, 'MAINTENANCE');
    expect(out.agentMemory!.currentIntent).toBe('RECOVERY');
  });
});

describe('logAgentAction — daemon limits', () => {
  it('prunes history at 20 entries keeping the newest', () => {
    let rival = makeRival({ actionHistory: [] });
    for (let i = 0; i < 25; i++) {
      rival = logAgentAction(rival, 'STAFF', `Action ${i}`, 'Low', i + 1);
    }
    expect(rival.actionHistory).toHaveLength(20);
    expect(rival.actionHistory![0]!.description).toBe('Action 24');
    expect(rival.actionHistory![19]!.description).toBe('Action 5');
  });
});

describe('AIEventSchema', () => {
  it('accepts a typed cause and BOUT/INTEL event types', () => {
    expect(() =>
      AIEventSchema.parse({
        id: 'e1',
        week: 3,
        type: 'BOUT',
        description: 'Won by KO',
        riskTier: 'Low',
        cause: 'BOUT_OUTCOME',
      })
    ).not.toThrow();
    expect(() =>
      AIEventSchema.parse({
        id: 'e2',
        week: 3,
        type: 'INTEL',
        description: 'Scouted rival',
        riskTier: 'Low',
        cause: 'INTEL_UPDATE',
      })
    ).not.toThrow();
  });
});
