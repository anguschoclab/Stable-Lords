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
 * Narrates an attack/whiff.
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
  const template = getFromArchive(r, ['pbp', 'whiffs']);
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
 * Narrates a successful dodge.
 */
export function narrateDodge(rng: IRNGService | RNG, defenderName: string): string {
  const r = normalizeRng(rng);
  const template = getFromArchive(r, ['pbp', 'defenses', 'dodge', 'success']);
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
      getFromArchive(r, ['strikes', 'generic']) ||
      getFromArchive(r, ['pbp', 'hits', 'generic']);
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
