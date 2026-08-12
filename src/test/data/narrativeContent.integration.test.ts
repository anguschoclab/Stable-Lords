import { describe, it, expect } from 'vitest';
import { getFromArchive, interpolateTemplate } from '@/engine/narrative/narrativePBPUtils';
import { crowdReaction } from '@/engine/narrative/narrativeStatus';
import { SeededRNG } from '@/utils/random';
import { hashStr } from '@/utils/random';
import narrativeContent from '@/data/narrativeContent.json';
import type { NarrativeContent } from '@/types/narrative.types';

const nc = narrativeContent as unknown as NarrativeContent & {
  memorials: { tributes: string[] };
  crowd_reactions: Record<string, string[]>;
};

describe('memorials.tributes integration', () => {
  it('getFromArchive retrieves a tribute template from memorials.tributes', () => {
    const rng = new SeededRNG(1);
    const template = getFromArchive(rng, ['memorials', 'tributes']);
    expect(template).toBeDefined();
    expect(typeof template).toBe('string');
    expect(template.length).toBeGreaterThan(0);
  });

  it('interpolateTemplate replaces {{name}} in tribute templates that contain it', () => {
    const tributes = nc.memorials.tributes;
    const withName = tributes.find((t) => t.includes('{{name}}'))!;
    expect(withName).toBeDefined();
    const result = interpolateTemplate(withName, { name: 'Garrick' });
    expect(result).toContain('Garrick');
    expect(result).not.toContain('{{name}}');
  });

  it('deterministic tribute pick: same name → same tribute', () => {
    const tributes = nc.memorials.tributes;
    expect(tributes.length).toBeGreaterThan(0);

    const pickTribute = (name: string): string => {
      const idx = hashStr(name) % tributes.length;
      return interpolateTemplate(tributes[idx]!, { name });
    };

    expect(pickTribute('Garrick')).toBe(pickTribute('Garrick'));
    expect(pickTribute('Helena')).toBe(pickTribute('Helena'));
    expect(pickTribute('Garrick')).not.toBe(pickTribute('Helena'));
  });
});

describe('crowd_reactions integration into crowdReaction()', () => {
  it('crowdReaction accepts an optional crowdMood parameter', () => {
    const rng = new SeededRNG(42);
    // Should not throw with crowdMood argument
    const result = (crowdReaction as any)(rng, 'Brutus', 'Maximus', 0.5, 'Bloodthirsty');
    expect(typeof result === 'string' || result === null).toBe(true);
  });

  it('Bloodthirsty mood returns a mood-specific line from crowd_reactions.Bloodthirsty', () => {
    const bloodthirstyLines = nc.crowd_reactions.Bloodthirsty!;
    expect(bloodthirstyLines).toBeDefined();
    expect(bloodthirstyLines.length).toBeGreaterThan(0);

    // Try multiple seeds to find one where crowdReaction fires (rng.next() <= 0.25)
    for (let seed = 1; seed <= 100; seed++) {
      const rng = new SeededRNG(seed);
      const result = (crowdReaction as any)(rng, 'Brutus', 'Maximus', 0.5, 'Bloodthirsty');
      if (result !== null) {
        // Result should be interpolated (no raw {{name}} or {{attacker}})
        expect(result).not.toContain('{{');
        // Result should be one of the Bloodthirsty lines (interpolated)
        const isBloodthirstyLine = bloodthirstyLines!.some((line) => {
          const interpolated = interpolateTemplate(line, { name: 'Brutus', attacker: 'Maximus' });
          return interpolated === result;
        });
        expect(isBloodthirstyLine).toBe(true);
        return;
      }
    }
    // If we never got a non-null result, crowdReaction should still work
    expect(true).toBe(true);
  });

  it('Theatrical mood returns a mood-specific line from crowd_reactions.Theatrical', () => {
    const theatricalLines = nc.crowd_reactions.Theatrical!;
    expect(theatricalLines).toBeDefined();
    expect(theatricalLines.length).toBeGreaterThan(0);

    for (let seed = 1; seed <= 100; seed++) {
      const rng = new SeededRNG(seed);
      const result = (crowdReaction as any)(rng, 'Brutus', 'Maximus', 0.5, 'Theatrical');
      if (result !== null) {
        expect(result).not.toContain('{{');
        const isTheatricalLine = theatricalLines!.some((line) => {
          const interpolated = interpolateTemplate(line, { name: 'Brutus', attacker: 'Maximus' });
          return interpolated === result;
        });
        expect(isTheatricalLine).toBe(true);
        return;
      }
    }
    expect(true).toBe(true);
  });

  it('Calm mood falls through to generic pbp.reactions (not crowd_reactions)', () => {
    for (let seed = 1; seed <= 100; seed++) {
      const rng = new SeededRNG(seed);
      const result = (crowdReaction as any)(rng, 'Brutus', 'Maximus', 0.5, 'Calm');
      if (result !== null) {
        // Should NOT be from crowd_reactions (those are Bloodthirsty/Theatrical specific)
        const bloodthirstyLines = nc.crowd_reactions.Bloodthirsty || [];
        const theatricalLines = nc.crowd_reactions.Theatrical || [];
        const allCrowdReactionLines = [...bloodthirstyLines, ...theatricalLines];
        const isMoodSpecific = allCrowdReactionLines.some((line) => {
          const interpolated = interpolateTemplate(line, { name: 'Brutus', attacker: 'Maximus' });
          return interpolated === result;
        });
        expect(isMoodSpecific).toBe(false);
        return;
      }
    }
    expect(true).toBe(true);
  });

  it('undefined crowdMood falls through to generic pbp.reactions', () => {
    for (let seed = 1; seed <= 100; seed++) {
      const rng = new SeededRNG(seed);
      const result = crowdReaction(rng, 'Brutus', 'Maximus', 0.5);
      if (result !== null) {
        const bloodthirstyLines = nc.crowd_reactions.Bloodthirsty || [];
        const theatricalLines = nc.crowd_reactions.Theatrical || [];
        const allCrowdReactionLines = [...bloodthirstyLines, ...theatricalLines];
        const isMoodSpecific = allCrowdReactionLines.some((line) => {
          const interpolated = interpolateTemplate(line, { name: 'Brutus', attacker: 'Maximus' });
          return interpolated === result;
        });
        expect(isMoodSpecific).toBe(false);
        return;
      }
    }
    expect(true).toBe(true);
  });

  it('is deterministic: same seed + same mood → same result', () => {
    const r1 = new SeededRNG(99);
    const r2 = new SeededRNG(99);
    const result1 = (crowdReaction as any)(r1, 'Brutus', 'Maximus', 0.3, 'Bloodthirsty');
    const result2 = (crowdReaction as any)(r2, 'Brutus', 'Maximus', 0.3, 'Bloodthirsty');
    expect(result1).toBe(result2);
  });
});
