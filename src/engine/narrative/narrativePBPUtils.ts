/**
 * Narrative PBP Utils - Core utility functions for narrative generation
 * Extracted from narrativePBP.ts to follow SRP
 */
import narrativeContent from '@/data/narrativeContent.json';
import type { NarrativeContent } from '@/types/narrative.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { escapeHtml } from '@/utils/escapeHtml';

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
  possessive?: string;
}

/**
 * Replaces canonical tokens (%A, %D, %W, %BP, %H) and Handlebars {{token}} with contextual values.
 * ⚡ Bolt Optimization: Uses a single-pass regex replace rather than multiple chained replacements
 * to eliminate O(N) string re-scanning overhead and minimize garbage collection in hot loops.
 */
export function interpolateTemplate(template: string, ctx: CombatContext): string {
  if (!template) return 'No description available.';

  return template.replace(/%([A-Z]+)|\{\{\s*([^{}\s]+)\s*\}\}/g, (match, shortKey, longKey) => {
    if (shortKey) {
      switch (shortKey) {
        case 'A':
          return escapeHtml(ctx.attacker || ctx.name || 'The warrior');
        case 'D':
          return escapeHtml(ctx.defender || 'the opponent');
        case 'W':
          return escapeHtml(ctx.weapon || 'weapon');
        case 'BP':
          return escapeHtml(ctx.bodyPart || 'body');
        case 'H':
          return escapeHtml(String(ctx.hits || ''));
        default:
          return match;
      }
    }

    if (longKey) {
      // Standard tokens always resolve to sensible text so a missing context value
      // never leaks a raw {{token}} into the play-by-play.
      switch (longKey) {
        case 'attacker':
          return escapeHtml(String(ctx.attacker ?? ctx.name ?? 'The warrior'));
        case 'name':
          return escapeHtml(String(ctx.name ?? ctx.attacker ?? 'The warrior'));
        case 'defender':
          return escapeHtml(String(ctx.defender ?? 'the opponent'));
        case 'weapon':
          return escapeHtml(String(ctx.weapon ?? 'weapon'));
        case 'bodyPart':
          return escapeHtml(String(ctx.bodyPart ?? 'body'));
        case 'winner':
          return escapeHtml(String((ctx as Record<string, unknown>).winner ?? 'the winner'));
        case 'loser':
          return escapeHtml(String((ctx as Record<string, unknown>).loser ?? 'the loser'));
        case 'possessive':
          return escapeHtml(String(ctx.possessive ?? 'their'));
        case 'pronoun':
          return escapeHtml(String((ctx as Record<string, unknown>).pronoun ?? 'he'));
        case 'reflexive':
          return escapeHtml(String((ctx as Record<string, unknown>).reflexive ?? 'himself'));
        default: {
          const value = ctx[longKey as keyof CombatContext];
          return value !== undefined && Object.hasOwn(ctx, longKey)
            ? escapeHtml(String(value))
            : match;
        }
      }
    }

    return match;
  });
}

/**
 * Maps damage/health ratio to mechanical severity categories.
 * Supports the expanded 6-tier Strike system.
 */
export function getStrikeSeverity(
  damage: number,
  maxHp: number,
  isFatal: boolean,
  isCrit: boolean,
  isFavorite: boolean,
  fame: number
): 'glancing' | 'solid' | 'mastery' | 'critical_human' | 'critical_supernatural' | 'fatal' {
  if (isFatal) return 'fatal';

  const ratio = damage / maxHp;
  if (isCrit || ratio >= 0.25) {
    return fame >= 100 ? 'critical_supernatural' : 'critical_human';
  }

  if (isFavorite) return 'mastery';

  if (ratio >= 0.1) return 'solid';
  return 'glancing';
}

/**
 * Quietly walk the archive to see if the given path resolves to a non-empty
 * string array. Returns the array (or null) without logging — intended for
 * tiered lookups where misses at lower specificity are expected.
 */
export function peekArchive(path: string[]): string[] | null {
  let current: unknown = narrativeContent;
  for (const key of path) {
    if (current && typeof current === 'object' && key in (current as Record<string, unknown>)) {
      current = (current as Record<string, unknown>)[key];
    } else {
      return null;
    }
  }
  if (Array.isArray(current) && current.length > 0) return current as string[];
  return null;
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
  return 'A fierce exchange occurs.';
}

/**
 * Gets rich hit location description.
 */
export function richHitLocation(rng: IRNGService, location: string): string {
  const hitLocations = (narrativeContent as NarrativeContent).pbp.hit_locations;
  const key = location.toLowerCase() as keyof typeof hitLocations;
  const variants = hitLocations[key];
  if (!variants) return location.toUpperCase();
  return rng.pick(variants);
}
