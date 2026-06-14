import { SeededRNGService } from '@/utils/random';

/**
 * Stable Lords — Name Logic
 * Utilities for generating dynastic and successor names.
 */

const HONORIFICS = ['II', 'III', 'IV', 'Jr.', 'the Younger', 'the Heir', 'V'];
const PREFIXES = ['Legacy of', 'Blood of', 'Protege of', 'Shadow of']; /**
                                                                        * Generate dynastic name.
                                                                        * @param originalName - Original name.
                                                                        * @param seed - Seed.
                                                                        * @returns The result.
                                                                        */

/**
 * Generate dynastic name.
 * @param originalName - Original name.
 * @param seed - Seed.
 * @returns The result.
 */
export function generateDynasticName(originalName: string, seed: number): string {
  const trimmed = originalName.trim().replace(/\s+/g, ' ');
  if (!trimmed) {
    return 'Legacy of Unknown';
  }

  const rng = new SeededRNGService(seed);
  const roll = rng.next();

  if (roll < 0.6) {
    // Suffix style: Silas Blackwood II
    const suffix = rng.pick(HONORIFICS);
    return `${trimmed} ${suffix}`;
  } else if (roll < 0.9) {
    // Prefix style: Legacy of Silas Blackwood
    const first = trimmed.split(/\s+/)[0];
    const prefix = rng.pick(PREFIXES);
    return `${prefix} ${first}`;
  } else {
    // Surname match: Lucius Blackwood
    const parts = trimmed.split(/\s+/);
    const last = parts.slice(1).join(' ');
    const newFirst = ['Marcus', 'Lucius', 'Julius', 'Titus', 'Gaius', 'Aurelius'];
    if (!last) {
      // Single-word names fall back to prefix style
      const prefix = rng.pick(PREFIXES);
      return `${prefix} ${trimmed}`;
    }
    return `${rng.pick(newFirst)} ${last}`;
  }
}
