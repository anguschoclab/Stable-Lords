import { FightingStyle, STYLE_DISPLAY_NAMES } from '@/types/shared.types';
import { getItemById } from '@/data/equipment';
import narrativeContent from '@/data/narrativeContent.json';
import type { NarrativeContent } from '@/types/narrative.types';
import { NarrativeTemplateEngine } from './narrativeTemplateEngine';
import { szToHeight, getWeaponDisplayName, getWeaponType } from './narrativeUtils';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import {
  narrateAttack,
  narratePassive,
  narrateParry,
  narrateDodge,
  narrateCounterstrike,
  narrateHit,
  narrateParryBreak,
  narrateInitiative,
} from './combatNarrators';

/**
 * Defines the shape of warrior intro data.
 */
export interface WarriorIntroData {
  name: string;
  style: FightingStyle;
  weaponId?: string;
  armorId?: string;
  helmId?: string;
  height?: number;
}

/**
 * CombatNarrator - Attack, parry, hit, and defense narration.
 * Handles all combat-related narrative generation.
 */

/**
 * Generates warrior introduction lines.
 */
export function generateWarriorIntro(
  rng: IRNGService,
  data: WarriorIntroData,
  sz?: number
): string[] {
  const lines: string[] = [];
  const n = data.name;

  if (sz) lines.push(`${n} is ${szToHeight(sz)}.`);

  const hand =
    rng.next() < 0.85 ? 'right handed' : rng.next() < 0.5 ? 'left handed' : 'ambidextrous';
  lines.push(`${n} is ${hand}.`);

  // Armor & Helm
  const armorItem = data.armorId ? getItemById(data.armorId) : null;
  if (armorItem && armorItem.id !== 'none_armor') {
    const verb =
      NarrativeTemplateEngine.getFromArchive(rng, ['fanfare', 'armor_intro_verbs']) || 'is wearing';
    lines.push(`${n} ${verb} ${armorItem.name.toUpperCase()} armor.`);
  } else {
    lines.push(`${n} has chosen to fight without body armor.`);
  }

  const helmItem = data.helmId ? getItemById(data.helmId) : null;
  if (helmItem && helmItem.id !== 'none_helm') {
    lines.push(`And will wear a ${helmItem.name.toUpperCase()}.`);
  }

  // Weapon & Style
  const weaponName = getWeaponDisplayName(data.weaponId);
  if (weaponName === 'OPEN HAND') {
    lines.push(`${n} will fight using his OPEN HAND.`);
  } else {
    const verb =
      NarrativeTemplateEngine.getFromArchive(rng, ['fanfare', 'weapon_intro_verbs']) ||
      'is armed with {{weapon}}';
    lines.push(
      NarrativeTemplateEngine.interpolateTemplate(verb, { attacker: n, weapon: weaponName })
    );
  }

  lines.push(`${n} uses the ${STYLE_DISPLAY_NAMES[data.style]} style.`);
  lines.push(`${n} is well suited to the weapons selected.`);

  return lines;
}

/**
 * Generates battle opener text.
 */
export function battleOpener(rng: IRNGService): string {
  const template = NarrativeTemplateEngine.getFromArchive(rng, ['pbp', 'openers']);
  return NarrativeTemplateEngine.interpolateTemplate(template, {});
}

// Re-export from unified combatNarrators
export { narrateAttack, narratePassive, narrateParry, narrateDodge, narrateCounterstrike, narrateHit, narrateParryBreak, narrateInitiative };

/**
 * Narrates bout conclusion.
 */
export function narrateBoutEnd(
  rng: IRNGService,
  by: string,
  winnerName: string,
  loserName: string,
  weaponId?: string
): string[] {
  const wName = getWeaponDisplayName(weaponId);
  const wType = getWeaponType(weaponId);

  const categoryMap: Record<string, string> = {
    Kill: 'Kill',
    KO: 'KO',
    Stoppage: 'Stoppage',
    Exhaustion: 'Exhaustion',
  };

  const category = categoryMap[by] || 'KO';
  const conclusionPath = ['conclusions', category];
  const conclusion =
    NarrativeTemplateEngine.getFromArchive(rng, conclusionPath) || '{{winner}} defeats {{loser}}.';
  const conclusionText = NarrativeTemplateEngine.interpolateTemplate(conclusion, {
    winner: winnerName,
    loser: loserName,
  });

  if (by === 'Kill') {
    const fatalBlowTemplate =
      NarrativeTemplateEngine.getFromArchive(rng, ['strikes', wType, 'fatal']) ||
      NarrativeTemplateEngine.getFromArchive(rng, ['strikes', 'generic']);
    const fatalBlow = NarrativeTemplateEngine.interpolateTemplate(fatalBlowTemplate, {
      attacker: winnerName,
      defender: loserName,
      weapon: wName,
    });
    return [fatalBlow, conclusionText];
  }

  return [conclusionText];
}

// Helper methods

function richHitLocation(rng: IRNGService, location: string): string { // eslint-disable-line @typescript-eslint/no-unused-vars
  const hitLocations = (narrativeContent as NarrativeContent).pbp.hit_locations;
  const key = location.toLowerCase() as keyof typeof hitLocations;
  const variants = hitLocations[key];
  if (!variants) return location.toUpperCase();
  return rng.pick(variants);
}

function getStrikeSeverity( // eslint-disable-line @typescript-eslint/no-unused-vars
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
}/**
  * Combat narrator.
  */


// Backward compatibility object
/**
 * Combat narrator.
 */
export const CombatNarrator = {
  generateWarriorIntro,
  battleOpener,
  narrateAttack,
  narratePassive,
  narrateParry,
  narrateDodge,
  narrateCounterstrike,
  narrateHit,
  narrateParryBreak,
  narrateInitiative,
  narrateBoutEnd,
} as const;
