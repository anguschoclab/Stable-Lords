/**
 * Unified Combat Narrators - Consolidated narrative functions
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
import type { IRNGService } from '@/engine/core/rng/IRNGService';

/**
 * Narrates an attack with weapon-type-specific verbs.
 */
export function narrateAttack(
  rng: IRNGService,
  attackerName: string,
  weaponId?: string,
  _isMastery?: boolean,
  defenderName?: string,
  style?: FightingStyle
): string {
  const wName = getWeaponDisplayName(weaponId);
  const wType = getWeaponType(weaponId, style);

  // Use weapon-type-specific attack patterns
  const template = getFromArchive(rng, ['pbp', 'attacks', wType]);
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
  rng: IRNGService,
  style: FightingStyle,
  actorName: string
): string {
  const template = getFromArchive(rng, ['passives', style]);
  return interpolateTemplate(template, { attacker: actorName });
}

/**
 * Narrates a successful parry.
 */
export function narrateParry(
  rng: IRNGService,
  defenderName: string,
  weaponId?: string,
  attackerName?: string
): string {
  const wName = getWeaponDisplayName(weaponId);
  const isShield = weaponId && ['small_shield', 'medium_shield', 'large_shield'].includes(weaponId);
  const type = isShield ? 'shield' : 'parry';

  const template = getFromArchive(rng, ['pbp', 'defenses', type, 'success']);
  return interpolateTemplate(template, {
    defender: defenderName,
    weapon: wName,
    attacker: attackerName,
  });
}

/**
 * Narrates a successful dodge with SP-based tiering.
 */
export function narrateDodge(
  rng: IRNGService,
  defenderName: string,
  speed?: number,
  attackerName?: string
): string {
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

  const template = getFromArchive(rng, ['pbp', 'defenses', 'dodge', tier]);
  return interpolateTemplate(template, { defender: defenderName, attacker: attackerName });
}

/**
 * Narrates a knockdown.
 */
export function narrateKnockdown(rng: IRNGService, name: string): string {
  const template = getFromArchive(rng, ['pbp', 'knockdown', 'fall']);
  return interpolateTemplate(template, { name });
}

/**
 * Narrates a recovery from knockdown.
 */
export function narrateRecovery(rng: IRNGService, name: string): string {
  const template = getFromArchive(rng, ['pbp', 'knockdown', 'recovery']);
  return interpolateTemplate(template, { name });
}

/**
 * Gets an epithet for alternate warrior naming.
 */
export function getEpithet(
  rng: IRNGService,
  origin?: string,
  race?: string,
  style?: string
): string | null {
  // 30% chance to use an epithet
  if (rng.next() > 0.3) return null;

  const available: Array<{ key: string; value: string }> = [];
  if (origin) available.push({ key: 'origin', value: origin });
  if (race) available.push({ key: 'race', value: race });
  if (style) available.push({ key: 'style', value: style });

  if (available.length === 0) return null;

  // Pick a random category
  const selected = available[Math.floor(rng.next() * available.length)];
  if (!selected) return null;

  const template = getFromArchive(rng, ['pbp', 'epithets', selected.key]);

  // Interpolate the epithet template with the correct property
  const context: Record<string, string> = {};
  context[selected.key] = selected.value;

  return interpolateTemplate(template, context);
}

/**
 * Narrates context-aware commentary.
 */
export function narrateContextLine(
  rng: IRNGService,
  context: {
    isRivalry?: boolean;
    fameA?: number;
    fameD?: number;
    styleA?: string;
    styleD?: string;
    name?: string;
  }
): string | null {
  // Check for rivalry context
  if (context.isRivalry && rng.next() < 0.4) {
    return getFromArchive(rng, ['pbp', 'context', 'rivalry']);
  }

  // Check for fame differences
  if (context.fameA !== undefined && context.fameD !== undefined) {
    const fameDiff = Math.abs(context.fameA - context.fameD);
    if (fameDiff > 20) {
      const category = context.fameA > context.fameD ? 'fame_great' : 'fame_unknown';
      if (rng.next() < 0.3) {
        const template = getFromArchive(rng, ['pbp', 'context', category]);
        return interpolateTemplate(template, { name: context.name });
      }
    }
  }

  // Check for style matchups
  if (context.styleA && context.styleD && rng.next() < 0.2) {
    const matchupKey = `${context.styleA.toLowerCase()}_vs_${context.styleD.toLowerCase()}`;
    const template = getFromArchive(rng, ['pbp', 'context', 'style_matchups', matchupKey]);
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
  rng: IRNGService,
  mood: 'positive' | 'negative' | 'encourage' | 'gasp' | 'cheer' | 'boo',
  name?: string
): string {
  const template = getFromArchive(rng, ['pbp', 'reactions', mood]);
  return interpolateTemplate(template, { name });
}

/**
 * Narrates taunt with rivalry support.
 */
export function narrateTaunt(
  rng: IRNGService,
  attackerName: string,
  defenderName: string,
  isWinner: boolean,
  isRivalry?: boolean
): string | null {
  // Fire ~40% of the time (winners taunt more)
  const threshold = isWinner ? 0.45 : 0.3;
  if (rng.next() > threshold) return null;

  // Use rivalry taunts if applicable
  const category = isRivalry
    ? isWinner
      ? 'rivalry_winner'
      : 'rivalry_loser'
    : isWinner
      ? 'winner'
      : 'loser';

  const template = getFromArchive(rng, ['pbp', 'taunts', category]);
  return interpolateTemplate(template, {
    attacker: attackerName,
    defender: defenderName,
  });
}

/**
 * Narrates a counterstrike.
 */
export function narrateCounterstrike(
  rng: IRNGService,
  defenderName: string,
  attackerName?: string
): string {
  const template =
    getFromArchive(rng, ['pbp', 'defenses', 'counterstrike']) || '{{defender}} counters!';
  return interpolateTemplate(template, { defender: defenderName, attacker: attackerName });
}

/**
 * Narrates a hit with severity-based flavor.
 */
export function narrateHit(
  rng: IRNGService,
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
  isFavorite?: boolean,
  style?: FightingStyle
): string {
  const richLoc = richHitLocation(rng, location);
  const wName = getWeaponDisplayName(weaponId);
  const wType = getWeaponType(weaponId, style);

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
    template = getFromArchive(rng, ['pbp', 'executions']);
  }

  if (!template || template === 'A fierce exchange occurs.') {
    template = getFromArchive(rng, ['strikes', wType, severity]);
  }

  if (!template || template === 'A fierce exchange occurs.') {
    template =
      getFromArchive(rng, ['strikes', 'generic']) || getFromArchive(rng, ['pbp', 'hits', 'generic']);
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
  rng: IRNGService,
  attackerName: string,
  weaponId?: string
): string {
  const wName = getWeaponDisplayName(weaponId);
  const template =
    getFromArchive(rng, ['pbp', 'defenses', 'parry_break']) || '{{attacker}} breaks the guard!';
  return interpolateTemplate(template, { attacker: attackerName, weapon: wName });
}

/**
 * Narrates initiative win.
 */
export function narrateInitiative(
  rng: IRNGService,
  winnerName: string,
  isFeint: boolean,
  defenderName?: string
): string {
  const path = isFeint ? ['pbp', 'feints'] : ['pbp', 'initiative'];
  const template = getFromArchive(rng, path);
  return interpolateTemplate(template, { attacker: winnerName, defender: defenderName });
}
