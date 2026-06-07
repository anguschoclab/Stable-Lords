import { getFromArchive, interpolateTemplate } from './narrativeTemplateEngine';
import type { IRNGService } from '@/engine/core/rng/IRNGService';

/**
 * StatusNarrator - Damage, fatigue, state change, and crowd reaction narration.
 * Handles all status-related narrative generation.
 */

/**
 * Generates damage severity line based on damage ratio.
 */
export function damageSeverityLine(rng: IRNGService, damage: number, maxHp: number): string | null {
  const ratio = damage / maxHp;
  if (ratio >= 0.35) {
    const template = getFromArchive(rng, ['pbp', 'damage_severity', 'deadly']);
    if (!template) return null;
    const templateStr = Array.isArray(template) ? template[0] : template;
    return interpolateTemplate(templateStr, {});
  }
  if (ratio >= 0.25) {
    const template = getFromArchive(rng, ['pbp', 'damage_severity', 'terrific']);
    if (!template) return null;
    const templateStr = Array.isArray(template) ? template[0] : template;
    return interpolateTemplate(templateStr, {});
  }
  if (ratio >= 0.15) {
    const template = getFromArchive(rng, ['pbp', 'damage_severity', 'powerful']);
    if (!template) return null;
    const templateStr = Array.isArray(template) ? template[0] : template;
    return interpolateTemplate(templateStr, {});
  }
  if (ratio <= 0.05) {
    const template = getFromArchive(rng, ['pbp', 'damage_severity', 'glancing']);
    if (!template) return null;
    const templateStr = Array.isArray(template) ? template[0] : template;
    return interpolateTemplate(templateStr, {});
  }
  return null;
}

/**
 * Generates state change line when HP drops below thresholds.
 */
export function stateChangeLine(
  rng: IRNGService,
  name: string,
  hpRatio: number,
  prevHpRatio: number
): string | null {
  let cat = '';
  if (hpRatio <= 0.2 && prevHpRatio > 0.2) cat = 'severe';
  else if (hpRatio <= 0.4 && prevHpRatio > 0.4) cat = 'desperate';
  else if (hpRatio <= 0.6 && prevHpRatio > 0.6) cat = 'serious';

  if (cat) {
    const template = getFromArchive(rng, ['pbp', 'status_changes', cat]);
    if (!template) return null;
    // Handle case where template might be an array
    const templateStr = Array.isArray(template) ? template[0] : template;
    return interpolateTemplate(templateStr, { name });
  }
  return null;
}

/**
 * Generates fatigue line when endurance is low.
 */
export function fatigueLine(_rng: IRNGService, name: string, endRatio: number): string | null {
  if (endRatio <= 0.15) return `${name} is tired and barely able to defend himself!`;
  if (endRatio <= 0.3) return `${name} is breathing heavily.`;
  return null;
}

/**
 * Generates crowd reaction line.
 */
export function crowdReaction(
  rng: IRNGService,
  loserName: string,
  _winnerName: string,
  hpRatio: number
): string | null {
  if (rng.next() > 0.25) return null;
  const mood = hpRatio <= 0.3 ? 'encourage' : rng.next() < 0.5 ? 'negative' : 'positive';
  const template = getFromArchive(rng, ['pbp', 'reactions', mood]);
  if (!template) return null;
  // Handle case where template might be an array
  const templateStr = Array.isArray(template) ? template[0] : template;
  return interpolateTemplate(templateStr, { name: loserName });
}

/**
 * Generates minute status line showing who's winning.
 */
export function minuteStatusLine(
  rng: IRNGService,
  _minute: number,
  nameA: string,
  nameD: string,
  hitsA: number,
  hitsD: number
): string {
  if (hitsA > hitsD + 3) return `${nameA} is beating his opponent!`;
  if (hitsD > hitsA + 3) return `${nameD} is beating his opponent!`;
  const template = getFromArchive(rng, ['pbp', 'pacing', 'stalemate']);
  if (!template) return 'The bout is evenly matched.';
  // Handle case where template might be an array
  const templateStr = Array.isArray(template) ? template[0] : template;
  return interpolateTemplate(templateStr, {});
}

/**
 * Generates popularity gain line.
 */
export function popularityLine(rng: IRNGService, name: string, popDelta: number): string | null {
  const cat = popDelta >= 3 ? 'great' : popDelta >= 1 ? 'normal' : '';
  if (!cat) return null;
  const template = getFromArchive(rng, ['pbp', 'meta', 'popularity', cat]);
  return interpolateTemplate(template, { name });
}

/**
 * Generates skill learn line.
 */
export function skillLearnLine(rng: IRNGService, name: string): string {
  const template = getFromArchive(rng, ['pbp', 'meta', 'skill_learns']);
  if (!template) return 'A fierce exchange occurs.';
  // Handle case where template might be an array
  const templateStr = Array.isArray(template) ? template[0] : template;
  return interpolateTemplate(templateStr, { attacker: name });
}

/**
 * Generates trading blows line.
 */
export function tradingBlowsLine(rng: IRNGService): string {
  const template = getFromArchive(rng, ['pbp', 'pacing', 'trading_blows']);
  if (!template) return 'A fierce exchange occurs.';
  const templateStr = Array.isArray(template) ? template[0] : template;
  return interpolateTemplate(templateStr, {});
}

/**
 * Generates stalemate line.
 */
export function stalemateLine(rng: IRNGService): string {
  const template = getFromArchive(rng, ['pbp', 'pacing', 'stalemate']);
  if (!template) return 'A fierce exchange occurs.';
  const templateStr = Array.isArray(template) ? template[0] : template;
  return interpolateTemplate(templateStr, {});
}

/**
 * Generates taunt line.
 */
export function tauntLine(rng: IRNGService, name: string, isWinner: boolean): string | null {
  if (rng.next() > 0.2) return null;
  const cat = isWinner ? 'winner' : 'loser';
  const template = getFromArchive(rng, ['pbp', 'taunts', cat]);
  if (!template) return null;
  // Handle case where template might be an array
  const templateStr = Array.isArray(template) ? template[0] : template;
  return interpolateTemplate(templateStr, { attacker: name });
}

/**
 * Generates conserving energy line.
 */
export function conservingLine(name: string): string {
  return `${name} is conserving his energy.`;
}

/**
 * Generates pressing attack line.
 */
export function pressingLine(rng: IRNGService, name: string): string {
  const template = getFromArchive(rng, ['pbp', 'pacing', 'pressing']);
  if (!template) return 'A fierce exchange occurs.';
  const templateStr = Array.isArray(template) ? template[0] : template;
  return interpolateTemplate(templateStr, { attacker: name });
}

/**
 * Generates insight hint line.
 */
export function narrateInsightHint(rng: IRNGService, attribute: string): string | null {
  const template = getFromArchive(rng, ['pbp', 'insights', attribute]);
  if (!template || template === 'A fierce exchange occurs.') return null;
  // Handle case where template might be an array
  const templateStr = Array.isArray(template) ? template[0] : template;
  return interpolateTemplate(templateStr, {});
}

export const StatusNarrator = {
  damageSeverityLine,
  stateChangeLine,
  fatigueLine,
  crowdReaction,
  minuteStatusLine,
  popularityLine,
  skillLearnLine,
  tradingBlowsLine,
  stalemateLine,
  tauntLine,
  conservingLine,
  pressingLine,
  narrateInsightHint,
};
