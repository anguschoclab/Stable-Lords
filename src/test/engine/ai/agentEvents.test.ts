/**
 * Stage B.0 — logAgentAction must take a typed `cause` instead of inferring
 * intent from English description substrings (G10). Also locks the 40-cap
 * pruning and schema acceptance of `cause`.
 */
import { describe, it, expect } from 'vitest';
import { logAgentAction, logFinanceEvent } from '@/engine/ai/agentCore';
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
  it('prunes history at 40 entries keeping the newest', () => {
    let rival = makeRival({ actionHistory: [] });
    for (let i = 0; i < 45; i++) {
      rival = logAgentAction(rival, 'STAFF', `Action ${i}`, 'Low', i + 1);
    }
    expect(rival.actionHistory).toHaveLength(40);
    expect(rival.actionHistory![0]!.description).toBe('Action 44');
    expect(rival.actionHistory![39]!.description).toBe('Action 5');
  });

  it('rare STRATEGY events survive a burst of INTEL noise', () => {
    // The 40-deep cap exists so high-volume INTEL/BOUT events can't evict a
    // scarce STRATEGY/FINANCE decision within an audit horizon.
    let rival = makeRival({ actionHistory: [] });
    rival = logAgentAction(rival, 'STRATEGY', 'Adopted VENDETTA', 'Low', 1, 'VENDETTA');
    for (let i = 0; i < 39; i++) {
      rival = logAgentAction(rival, 'INTEL', `Intel ping ${i}`, 'Low', i + 2, 'INTEL_UPDATE');
    }
    expect(rival.actionHistory).toHaveLength(40);
    const strategyEvents = rival.actionHistory!.filter((e) => e.type === 'STRATEGY');
    expect(strategyEvents).toHaveLength(1);
    expect(strategyEvents[0]!.description).toBe('Adopted VENDETTA');
  });
});

describe('logFinanceEvent', () => {
  it('writes a categorized ledger entry AND a FINANCE action event', () => {
    const rival = makeRival({ actionHistory: [], ledger: [] });
    const out = logFinanceEvent(rival, {
      label: 'Recruit signing — Kaeso',
      amount: -250,
      week: 7,
      category: 'recruit',
      description: 'Paid 250g draft fee.',
      riskTier: 'Medium',
    });
    expect(out.ledger).toHaveLength(1);
    expect(out.ledger![0]!.category).toBe('recruit');
    expect(out.ledger![0]!.amount).toBe(-250);
    expect(out.ledger![0]!.week).toBe(7);
    expect(out.actionHistory![0]!.type).toBe('FINANCE');
    expect(out.actionHistory![0]!.description).toBe('Paid 250g draft fee.');
  });

  it('caps the rival ledger at 500 entries', () => {
    const rival = makeRival({
      actionHistory: [],
      ledger: Array.from({ length: 500 }, (_, i) => ({
        id: `l${i}` as any,
        week: i,
        label: 'old',
        amount: 1,
        category: 'upkeep' as const,
      })),
    });
    const out = logFinanceEvent(rival, {
      label: 'Gear',
      amount: -150,
      week: 3,
      category: 'other',
    });
    expect(out.ledger).toHaveLength(500);
    expect(out.ledger![499]!.label).toBe('Gear');
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
