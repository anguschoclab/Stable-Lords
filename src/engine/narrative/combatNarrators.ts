/**
 * Unified Combat Narrators - Consolidated narrative functions
 * Accepts both IRNGService and RNG types via adapter
 */
import type { FightingStyle } from '@/types/shared.types';
import { getWeaponDisplayName, getWeaponType } from './narrativeUtils';
import {
  getFromArchive,
  interpolateTemplate,
  richHitLocation,
  getStrikeSeverity,
} from './narrativePBPUtils';
import { audioManager } from '@/lib/AudioManager';
import type { RNG } from './types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';

/**
 * Adapter to convert IRNGService to RNG function
 */
function rngFromService(service: IRNGService): RNG {
  return () => service.next();
}

/**
 * Adapter to normalize RNG input
 */
function normalizeRng(rng: IRNGService | RNG): RNG {
  if (typeof rng === 'function') return rng;
  return rngFromService(rng);
}

/**
 * Narrates an attack with weapon-type-specific verbs.
 */
export function narrateAttack(
  rng: IRNGService | RNG,
  attackerName: string,
  weaponId?: string,
  _isMastery?: boolean,
  defenderName?: string
): string {
  const r = normalizeRng(rng);
  const wName = getWeaponDisplayName(weaponId);
  const wType = getWeaponType(weaponId);

  // Use weapon-type-specific attack patterns
  const template = getFromArchive(r, ['pbp', 'attacks', wType]);
  return interpolateTemplate(template, {
    attacker: attackerName,
    defender: defenderName,
    weapon: wName,
  });
}

/**
 * Narrates a passive ability activation.
 */
export function narratePassive(
  rng: IRNGService | RNG,
  style: FightingStyle,
  actorName: string
): string {
  const r = normalizeRng(rng);
  const template = getFromArchive(r, ['passives', style]);
  return interpolateTemplate(template, { attacker: actorName });
}

/**
 * Narrates a successful parry.
 */
export function narrateParry(
  rng: IRNGService | RNG,
  defenderName: string,
  weaponId?: string
): string {
  const r = normalizeRng(rng);
  const wName = getWeaponDisplayName(weaponId);
  const isShield = weaponId && ['small_shield', 'medium_shield', 'large_shield'].includes(weaponId);
  const type = isShield ? 'shield' : 'parry';

  const template = getFromArchive(r, ['pbp', 'defenses', type, 'success']);
  return interpolateTemplate(template, { defender: defenderName, weapon: wName });
}

/**
 * Narrates a successful dodge with SP-based tiering.
 */
export function narrateDodge(rng: IRNGService | RNG, defenderName: string, speed?: number): string {
  const r = normalizeRng(rng);

  // Determine tier based on SP attribute
  let tier: string;
  if (speed === undefined) {
    tier = 'tier1_low';
  } else if (speed >= 26) {
    tier = 'tier4_supernatural';
  } else if (speed >= 19) {
    tier = 'tier3_high';
  } else if (speed >= 12) {
    tier = 'tier2_medium';
  } else {
    tier = 'tier1_low';
  }

  const template = getFromArchive(r, ['pbp', 'defenses', 'dodge', tier]);
  return interpolateTemplate(template, { defender: defenderName });
}

/**
 * Narrates a knockdown.
 */
export function narrateKnockdown(rng: IRNGService | RNG, name: string): string {
  const r = normalizeRng(rng);
  const template = getFromArchive(r, ['pbp', 'knockdown', 'fall']);
  return interpolateTemplate(template, { name });
}

/**
 * Narrates a recovery from knockdown.
 */
export function narrateRecovery(rng: IRNGService | RNG, name: string): string {
  const r = normalizeRng(rng);
  const template = getFromArchive(r, ['pbp', 'knockdown', 'recovery']);
  return interpolateTemplate(template, { name });
}

/**
 * Gets an epithet for alternate warrior naming.
 */
export function getEpithet(
  rng: IRNGService | RNG,
  origin?: string,
  race?: string,
  style?: string
): string | null {
  const r = normalizeRng(rng);

  // 30% chance to use an epithet
  if (r() > 0.3) return null;

  const available: Array<{ key: string; value: string }> = [];
  if (origin) available.push({ key: 'origin', value: origin });
  if (race) available.push({ key: 'race', value: race });
  if (style) available.push({ key: 'style', value: style });

  if (available.length === 0) return null;

  // Pick a random category
  const selected = available[Math.floor(r() * available.length)];
  if (!selected) return null;

  const template = getFromArchive(r, ['pbp', 'epithets', selected.key]);

  // Interpolate the epithet template with the correct property
  const context: Record<string, string> = {};
  context[selected.key] = selected.value;

  return interpolateTemplate(template, context);
}

/**
 * Narrates context-aware commentary.
 */
export function narrateContextLine(
  rng: IRNGService | RNG,
  context: {
    isRivalry?: boolean;
    fameA?: number;
    fameD?: number;
    styleA?: string;
    styleD?: string;
    name?: string;
  }
): string | null {
  const r = normalizeRng(rng);

  // Check for rivalry context
  if (context.isRivalry && r() < 0.4) {
    return getFromArchive(r, ['pbp', 'context', 'rivalry']);
  }

  // Check for fame differences
  if (context.fameA !== undefined && context.fameD !== undefined) {
    const fameDiff = Math.abs(context.fameA - context.fameD);
    if (fameDiff > 20) {
      const category = context.fameA > context.fameD ? 'fame_great' : 'fame_unknown';
      if (r() < 0.3) {
        const template = getFromArchive(r, ['pbp', 'context', category]);
        return interpolateTemplate(template, { name: context.name });
      }
    }
  }

  // Check for style matchups
  if (context.styleA && context.styleD && r() < 0.2) {
    const matchupKey = `${context.styleA.toLowerCase()}_vs_${context.styleD.toLowerCase()}`;
    const template = getFromArchive(r, ['pbp', 'context', 'style_matchups', matchupKey]);
    if (template && template !== 'A fierce exchange occurs.') {
      return template;
    }
  }

  return null;
}

/**
 * Narrates crowd reaction with expanded variety.
 */
export function narrateCrowdReaction(
  rng: IRNGService | RNG,
  mood: 'positive' | 'negative' | 'encourage' | 'gasp' | 'cheer' | 'boo',
  name?: string
): string {
  const r = normalizeRng(rng);
  const template = getFromArchive(r, ['pbp', 'reactions', mood]);
  return interpolateTemplate(template, { name });
}

/**
 * Narrates taunt with rivalry support.
 */
export function narrateTaunt(
  rng: IRNGService | RNG,
  attackerName: string,
  defenderName: string,
  isWinner: boolean,
  isRivalry?: boolean
): string | null {
  const r = normalizeRng(rng);

  // Fire ~40% of the time (winners taunt more)
  const threshold = isWinner ? 0.45 : 0.3;
  if (r() > threshold) return null;

  // Use rivalry taunts if applicable
  const category = isRivalry
    ? isWinner
      ? 'rivalry_winner'
      : 'rivalry_loser'
    : isWinner
      ? 'winner'
      : 'loser';

  const template = getFromArchive(r, ['pbp', 'taunts', category]);
  return interpolateTemplate(template, {
    attacker: attackerName,
    defender: defenderName,
  });
}

/**
 * Narrates insight hint with expanded attributes.
 */
export function narrateInsightHint(
  rng: IRNGService | RNG,
  attribute: 'ST' | 'SP' | 'DF' | 'WL' | 'CN' | 'CT',
  defenderName?: string
): string | null {
  const r = normalizeRng(rng);

  // Fire ~25% of the time
  if (r() > 0.25) return null;

  const template = getFromArchive(r, ['pbp', 'insights', attribute]);
  if (!template || template === 'A fierce exchange occurs.') return null;

  return interpolateTemplate(template, { defender: defenderName });
}

/**
 * Narrates a counterstrike.
 */
export function narrateCounterstrike(rng: IRNGService | RNG, name: string): string {
  const r = normalizeRng(rng);
  const template =
    getFromArchive(r, ['pbp', 'defenses', 'counterstrike']) || '{{attacker}} counters!';
  return interpolateTemplate(template, { attacker: name });
}

/**
 * Narrates a hit with severity-based flavor.
 */
export function narrateHit(
  rng: IRNGService | RNG,
  defenderName: string,
  location: string,
  _isMastery?: boolean,
  isSuperFlashy?: boolean,
  attackerName?: string,
  weaponId?: string,
  damage?: number,
  maxHp?: number,
  isFatal?: boolean,
  attackerFame?: number,
  isFavorite?: boolean
): string {
  const r = normalizeRng(rng);
  const richLoc = richHitLocation(r, location);
  const wName = getWeaponDisplayName(weaponId);
  const wType = getWeaponType(weaponId);

  const severity = getStrikeSeverity(
    damage || 0,
    maxHp || 100,
    isFatal || false,
    isSuperFlashy || false,
    isFavorite || false,
    attackerFame || 0
  );

  if (severity === 'critical_human' || severity === 'critical_supernatural') {
    audioManager.play('crit');
  }

  let template = '';
  if (isFatal) {
    template = getFromArchive(r, ['pbp', 'executions']);
  }

  if (!template || template === 'A fierce exchange occurs.') {
    template = getFromArchive(r, ['strikes', wType, severity]);
  }

  if (!template || template === 'A fierce exchange occurs.') {
    template =
      getFromArchive(r, ['strikes', 'generic']) || getFromArchive(r, ['pbp', 'hits', 'generic']);
  }

  return interpolateTemplate(template, {
    attacker: attackerName,
    defender: defenderName,
    weapon: wName,
    bodyPart: richLoc,
  });
}

/**
 * Narrates a broken parry.
 */
export function narrateParryBreak(
  rng: IRNGService | RNG,
  attackerName: string,
  weaponId?: string
): string {
  const r = normalizeRng(rng);
  const wName = getWeaponDisplayName(weaponId);
  const template =
    getFromArchive(r, ['pbp', 'defenses', 'parry_break']) || '{{attacker}} breaks the guard!';
  return interpolateTemplate(template, { attacker: attackerName, weapon: wName });
}

/**
 * Narrates initiative win.
 */
export function narrateInitiative(
  rng: IRNGService | RNG,
  winnerName: string,
  isFeint: boolean,
  defenderName?: string
): string {
  const r = normalizeRng(rng);
  const path = isFeint ? ['pbp', 'feints'] : ['pbp', 'initiative'];
  const template = getFromArchive(r, path);
  return interpolateTemplate(template, { attacker: winnerName, defender: defenderName });
}
