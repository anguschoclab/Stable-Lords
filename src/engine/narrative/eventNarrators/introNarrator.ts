import { FightingStyle, STYLE_DISPLAY_NAMES } from '@/types/shared.types';
import { getItemById } from '@/data/equipment';
import { NarrativeTemplateEngine } from '../narrativeTemplateEngine';
import { szToHeight, getWeaponDisplayName } from '../narrativeUtils';
import type { IRNGService } from '@/engine/core/rng/IRNGService';

export interface WarriorIntroData {
  name: string;
  style: FightingStyle;
  weaponId?: string;
  armorId?: string;
  helmId?: string;
  height?: number;
}

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
