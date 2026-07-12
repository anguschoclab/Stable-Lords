/**
 * Unit tests for extracted scouting insight helpers.
 * Tests the individual create*Insight functions directly + integration via generateScoutReport.
 */
import { describe, it, expect } from 'vitest';
import {
  generateScoutReport,
  createStyleInsight,
  createAttributeInsights,
  createTacticInsight,
  createTraitInsights,
} from '@/engine/scouting';
import { FightingStyle, type Warrior } from '@/types/game';
import { computeWarriorStats } from '@/engine/skillCalc';
import { SeededRNGService } from '@/utils/random';
import { STYLE_DISPLAY_NAMES, ATTRIBUTE_KEYS, ATTRIBUTE_LABELS } from '@/types/shared.types';
function makeWarrior(overrides?: Partial<Warrior>): Warrior {
  const attrs = { ST: 15, CN: 12, SZ: 10, WT: 14, WL: 13, SP: 16, DF: 11 };
  const { baseSkills, derivedStats } = computeWarriorStats(attrs, FightingStyle.SlashingAttack);
  return {
    id: 'w1' as import('@/types/shared.types').WarriorId,
    name: 'Opponent',
    style: FightingStyle.SlashingAttack,
    attributes: attrs,
    baseSkills,
    derivedStats,
    fame: 5,
    popularity: 0,
    titles: [],
    injuries: [],
    flair: [],
    career: { wins: 8, losses: 3, kills: 2 },
    champion: false,
    status: 'Active',
    age: 24,
    traits: [],
    plan: { OE: 7, AL: 5, killDesire: 6 } as any,
    ...overrides,
  };
}

// ─── createStyleInsight ───────────────────────────────────────────────────

describe('createStyleInsight', () => {
  it('produces exactly 1 Style insight', () => {
    const warrior = makeWarrior();
    const rng = new SeededRNGService(1);
    const styleName = STYLE_DISPLAY_NAMES[warrior.style] ?? warrior.style;
    const insight = createStyleInsight(warrior, styleName, 10, rng);

    expect(insight.type).toBe('Style');
    expect(insight.warriorId).toBe(warrior.id);
    expect(insight.warriorName).toBe(warrior.name);
    expect(insight.detail).toContain(styleName);
    expect(insight.discoveredWeek).toBe(10);
  });

  it('generates a unique id', () => {
    const warrior = makeWarrior();
    const rng1 = new SeededRNGService(1);
    const rng2 = new SeededRNGService(2);
    const styleName = STYLE_DISPLAY_NAMES[warrior.style] ?? warrior.style;
    const i1 = createStyleInsight(warrior, styleName, 1, rng1);
    const i2 = createStyleInsight(warrior, styleName, 1, rng2);

    expect(i1.id).not.toBe(i2.id);
  });
});

// ─── createAttributeInsights ──────────────────────────────────────────────

describe('createAttributeInsights', () => {
  it('returns 0 insights for Basic quality', () => {
    const warrior = makeWarrior();
    const rng = new SeededRNGService(42);
    const insights = createAttributeInsights(warrior, 'Basic', 5, rng);

    expect(insights).toHaveLength(0);
  });

  it('returns exactly 2 insights for Detailed quality', () => {
    const warrior = makeWarrior();
    const rng = new SeededRNGService(42);
    const insights = createAttributeInsights(warrior, 'Detailed', 5, rng);

    expect(insights).toHaveLength(2);
    insights.forEach((ins) => {
      expect(ins.type).toBe('Attribute');
      expect(ins.warriorId).toBe(warrior.id);
      expect(ins.discoveredWeek).toBe(5);
      expect(ATTRIBUTE_KEYS).toContain(ins.targetKey);
      expect(ins.detail).toContain(ATTRIBUTE_LABELS[ins.targetKey as keyof typeof ATTRIBUTE_LABELS] ?? ins.targetKey);
    });
  });

  it('returns exactly 4 insights for Expert quality', () => {
    const warrior = makeWarrior();
    const rng = new SeededRNGService(42);
    const insights = createAttributeInsights(warrior, 'Expert', 5, rng);

    expect(insights).toHaveLength(4);
    insights.forEach((ins) => {
      expect(ins.type).toBe('Attribute');
      expect(ATTRIBUTE_KEYS).toContain(ins.targetKey);
    });
  });
});

// ─── createTacticInsight ──────────────────────────────────────────────────

describe('createTacticInsight', () => {
  it('returns null for Basic quality', () => {
    const warrior = makeWarrior();
    const rng = new SeededRNGService(1);
    const result = createTacticInsight(warrior, 'Basic', undefined, undefined, 5, rng);
    expect(result).toBeNull();
  });

  it('returns null for Detailed quality', () => {
    const warrior = makeWarrior();
    const rng = new SeededRNGService(1);
    const result = createTacticInsight(warrior, 'Detailed', undefined, undefined, 5, rng);
    expect(result).toBeNull();
  });

  it('returns null for Expert quality without a plan', () => {
    const warrior = makeWarrior({ plan: undefined });
    const rng = new SeededRNGService(1);
    const result = createTacticInsight(warrior, 'Expert', 'High', 'Low', 5, rng);
    expect(result).toBeNull();
  });

  it('returns 1 Tactic insight for Expert with plan', () => {
    const warrior = makeWarrior({ plan: { OE: 7, AL: 5, killDesire: 6 } as any });
    const rng = new SeededRNGService(1);
    const result = createTacticInsight(warrior, 'Expert', 'High', 'Medium', 5, rng);

    expect(result).not.toBeNull();
    expect(result!.type).toBe('Tactic');
    expect(result!.warriorId).toBe(warrior.id);
    expect(result!.detail).toContain('High');
    expect(result!.detail).toContain('Medium');
    expect(result!.discoveredWeek).toBe(5);
  });
});

// ─── createTraitInsights ──────────────────────────────────────────────────

describe('createTraitInsights', () => {
  it('returns empty array for empty suspectedTraits', () => {
    const warrior = makeWarrior();
    const rng = new SeededRNGService(1);
    const insights = createTraitInsights([], warrior, 5, rng);
    expect(insights).toHaveLength(0);
  });

  it('returns 1 Trait insight for 1 suspected trait', () => {
    const warrior = makeWarrior();
    const rng = new SeededRNGService(1);
    const insights = createTraitInsights(['orphan_resilience'], warrior, 5, rng);

    expect(insights).toHaveLength(1);
    expect(insights[0]!.type).toBe('Trait');
    expect(insights[0]!.warriorId).toBe(warrior.id);
    expect(insights[0]!.detail).toContain('orphan_resilience');
    expect(insights[0]!.discoveredWeek).toBe(5);
  });

  it('returns 2 Trait insights for 2 suspected traits', () => {
    const warrior = makeWarrior();
    const rng = new SeededRNGService(1);
    const insights = createTraitInsights(['orphan_resilience', 'street_rat_cunning'], warrior, 5, rng);

    expect(insights).toHaveLength(2);
    expect(insights[0]!.detail).toContain('orphan_resilience');
    expect(insights[1]!.detail).toContain('street_rat_cunning');
  });
});

// ─── generateScoutReport integration (insight counts) ─────────────────────

describe('generateScoutReport — insight token counts', () => {
  it('Basic produces 1 insight (Style only)', () => {
    const warrior = makeWarrior();
    const rng = new SeededRNGService(42);
    const { newInsights } = generateScoutReport(warrior, 'Basic', 1, rng);

    expect(newInsights).toHaveLength(1);
    expect(newInsights[0]!.type).toBe('Style');
  });

  it('Detailed produces 3 insights (1 Style + 2 Attribute)', () => {
    const warrior = makeWarrior();
    const rng = new SeededRNGService(42);
    const { newInsights } = generateScoutReport(warrior, 'Detailed', 1, rng);

    const styles = newInsights.filter((i) => i.type === 'Style');
    const attrs = newInsights.filter((i) => i.type === 'Attribute');
    expect(styles).toHaveLength(1);
    expect(attrs).toHaveLength(2);
    expect(newInsights).toHaveLength(3);
  });

  it('Expert produces 1 Style + 4 Attribute + 1 Tactic + N Trait', () => {
    const warrior = makeWarrior({
      traits: ['orphan_resilience', 'street_rat_cunning'],
      plan: { OE: 7, AL: 5, killDesire: 6 } as any,
    });
    const rng = new SeededRNGService(42);
    const { newInsights } = generateScoutReport(warrior, 'Expert', 1, rng);

    const styles = newInsights.filter((i) => i.type === 'Style');
    const attrs = newInsights.filter((i) => i.type === 'Attribute');
    const tactics = newInsights.filter((i) => i.type === 'Tactic');
    const traits = newInsights.filter((i) => i.type === 'Trait');

    expect(styles).toHaveLength(1);
    expect(attrs).toHaveLength(4);
    expect(tactics).toHaveLength(1);
    // Trait count depends on rng pick — just verify they're Trait type
    traits.forEach((t) => expect(t.type).toBe('Trait'));
  });

  it('all insights have unique IDs', () => {
    const warrior = makeWarrior({
      traits: ['orphan_resilience', 'street_rat_cunning'],
      plan: { OE: 7, AL: 5, killDesire: 6 } as any,
    });
    const rng = new SeededRNGService(42);
    const { newInsights } = generateScoutReport(warrior, 'Expert', 1, rng);

    const ids = newInsights.map((i) => i.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });
});
