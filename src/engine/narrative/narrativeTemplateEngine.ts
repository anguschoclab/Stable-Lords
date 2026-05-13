import narrativeContent from '@/data/narrativeContent.json';
import type { IRNGService } from '@/engine/core/rng/IRNGService';

export interface CombatContext {
  attacker?: string;
  defender?: string;
  name?: string;
  weapon?: string;
  bodyPart?: string;
  hits?: string | number;
  winner?: string;
  loser?: string;
}

/**
 * NarrativeTemplateEngine - Template interpolation and archive access.
 * Handles all narrative content retrieval and token replacement.
 */
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class NarrativeTemplateEngine {
  private constructor() {}
  /**
   * Replaces canonical tokens (%A, %D, %W, %BP, %H) and Handlebars {{token}} with contextual values.
   * ⚡ Bolt Optimization: Switched from chained .replace() to a single-pass regex dictionary
   * to drastically reduce allocations and CPU cycles when generating thousands of narrative logs.
   */
  static interpolateTemplate(template: string, ctx: CombatContext): string {
    if (!template) return 'No description available.';

    return template.replace(/%([A-Z]+)|\{\{\s*([^{}\s]+)\s*\}\}/g, (match, shortKey, longKey) => {
      if (shortKey) {
        switch (shortKey) {
          case 'A': return ctx.attacker || ctx.name || 'The warrior';
          case 'D': return ctx.defender || 'the opponent';
          case 'W': return ctx.weapon || 'weapon';
          case 'BP': return ctx.bodyPart || 'body';
          case 'H': return String(ctx.hits || '');
          case 'WINNER': return ctx.winner || 'the winner';
          case 'LOSER': return ctx.loser || 'the loser';
          default: return match;
        }
      }

      if (longKey) {
        switch (longKey) {
          case 'attacker': return ctx.attacker || ctx.name || 'The warrior';
          case 'defender': return ctx.defender || 'the opponent';
          case 'weapon': return ctx.weapon || 'weapon';
          case 'bodyPart': return ctx.bodyPart || 'body';
          case 'name': return ctx.name || ctx.attacker || 'The warrior';
          case 'winner': return ctx.winner || 'the winner';
          case 'loser': return ctx.loser || 'the loser';
          default: return match;
        }
      }

      return match;
    });
  }

  /**
   * Safely picks a template from the JSON archive or returns a generic fallback.
   */
  static getFromArchive(rng: IRNGService, path: string[]): string {
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
    } catch (e) {
      console.error(`Narrative Archive Error: Missing path ${path.join('.')}`);
    }
    return 'A fierce exchange occurs.'; // Ultimate fallback
  }
}
