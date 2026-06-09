import narrativeContent from '@/data/narrativeContent.json';
import type { IRNGService } from '@/engine/core/rng/IRNGService';

/**
 * Defines the shape of combat context.
 */
export interface CombatContext {
  attacker?: string;
  defender?: string;
  name?: string;
  weapon?: string;
  bodyPart?: string;
  hits?: string | number;
  winner?: string;
  loser?: string;
  possessive?: string;
}

/**
 * Replaces canonical tokens (%A, %D, %W, %BP, %H) and Handlebars {{token}} with contextual values.
 */
export function interpolateTemplate(template: string, ctx: CombatContext): string {
  if (!template) return 'No description available.';

  return template.replace(/%([A-Z]+)|\{\{\s*([^{}\s]+)\s*\}\}/g, (match, shortKey, longKey) => {
    if (shortKey) {
      switch (shortKey) {
        case 'A':
          return ctx.attacker || ctx.name || 'The warrior';
        case 'D':
          return ctx.defender || 'the opponent';
        case 'W':
          return ctx.weapon || 'weapon';
        case 'BP':
          return ctx.bodyPart || 'body';
        case 'H':
          return String(ctx.hits || '');
        case 'WINNER':
          return ctx.winner || 'the winner';
        case 'LOSER':
          return ctx.loser || 'the loser';
        default:
          return match;
      }
    }

    if (longKey) {
      switch (longKey) {
        case 'attacker':
          return ctx.attacker || ctx.name || 'The warrior';
        case 'defender':
          return ctx.defender || 'the opponent';
        case 'weapon':
          return ctx.weapon || 'weapon';
        case 'bodyPart':
          return ctx.bodyPart || 'body';
        case 'name':
          return ctx.name || ctx.attacker || 'The warrior';
        case 'winner':
          return ctx.winner || 'the winner';
        case 'loser':
          return ctx.loser || 'the loser';
        case 'possessive':
          return ctx.possessive ?? 'their';
        case 'pronoun':
          return ((ctx as Record<string, unknown>).pronoun as string) ?? 'he';
        case 'reflexive':
          return ((ctx as Record<string, unknown>).reflexive as string) ?? 'himself';
        default:
          return match;
      }
    }

    return match;
  });
}

/**
 * Safely picks a template from the JSON archive or returns a generic fallback.
 */
export function getFromArchive(rng: IRNGService, path: string[]): string {
  try {
    let current: unknown = narrativeContent;
    for (const key of path) {
      if (current && typeof current === 'object' && key in current) {
        current = (current as Record<string, unknown>)[key];
      } else {
        throw new Error(`Invalid path: ${key}`);
      }
    }
    if (Array.isArray(current) && current.length > 0) {
      return rng.pick(current);
    }
  } catch {
    console.error(`Narrative Archive Error: Missing path ${path.join('.')}`);
  }
  return 'A fierce exchange occurs.'; // Ultimate fallback
}

/**
 * Compatibility namespace wrapping the standalone functions.
 */
export const NarrativeTemplateEngine = {
  interpolateTemplate,
  getFromArchive,
} as const;
