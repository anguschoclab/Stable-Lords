/**
 * V31 canon — knack / "luck factor" scout-rumor surface (Terrablood archive,
 * Hoser Report; V27-§5 adjudicated DN: land the rumor surface).
 *
 * Canon: warriors roll a hidden ±4-per-skill "luck factor" at creation —
 * bonused or hosed in specific channels. Rumor-grade scouting senses a strong
 * knack without naming numbers: vague 'Knack'-type InsightTokens naming the
 * skill channel only.
 */
import { describe, it, expect } from 'vitest';
import { generateScoutReport } from '@/engine/scouting/scouting';
import { makeWarrior } from '@/test/_fixtures/factories';
import { SeededRNG } from '@/utils/random';
import type { BaseSkills } from '@/types/warrior.types';

const STRONG = { ATT: 0, PAR: 0, DEF: 0, INI: 0, RIP: 4, DEC: 0 } as BaseSkills;
const HOSED = { ATT: 0, PAR: 0, DEF: -4, INI: 0, RIP: 0, DEC: 0 } as BaseSkills;
const MILD = { ATT: 0, PAR: 0, DEF: 0, INI: 1, RIP: 0, DEC: -1 } as BaseSkills;

const knackTokens = (insights: { type: string; detail?: string }[]) =>
  insights.filter((t) => t.type === 'Knack');

describe('knack (luck-factor) scout-rumor surface', () => {
  it('Expert scouting a strongly bonused warrior emits a vague Knack hint', () => {
    const w = makeWarrior({ luckfactor: STRONG });
    const { newInsights } = generateScoutReport(w, 'Expert', 10, new SeededRNG(1));
    const k = knackTokens(newInsights);
    expect(k.length).toBeGreaterThanOrEqual(1);
    // Rumor-grade: names the channel, never a number.
    expect(k[0]!.detail).toMatch(/riposte/i);
    expect(k[0]!.detail).not.toMatch(/\d/);
  });

  it('Expert scouting a hosed warrior surfaces the jinxed channel', () => {
    const w = makeWarrior({ luckfactor: HOSED });
    const { newInsights } = generateScoutReport(w, 'Expert', 10, new SeededRNG(1));
    const k = knackTokens(newInsights);
    expect(k.length).toBeGreaterThanOrEqual(1);
    expect(k[0]!.detail).toMatch(/defen|hosed|jinx|curs/i);
  });

  it('mild luck factors produce no knack rumor', () => {
    const w = makeWarrior({ luckfactor: MILD });
    const { newInsights } = generateScoutReport(w, 'Expert', 10, new SeededRNG(1));
    expect(knackTokens(newInsights)).toEqual([]);
  });

  it('Basic and Detailed scouting never reach the knack channel', () => {
    const w = makeWarrior({ luckfactor: STRONG });
    for (const q of ['Basic', 'Detailed'] as const) {
      const { newInsights } = generateScoutReport(w, q, 10, new SeededRNG(1));
      expect(knackTokens(newInsights)).toEqual([]);
    }
  });
});
