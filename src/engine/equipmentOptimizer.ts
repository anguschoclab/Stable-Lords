/**
 * Equipment Optimizer — recommends optimal gear by fighting style.
 * Analyzes encumbrance tradeoffs and style synergy.
 */
import { FightingStyle } from '@/types/shared.types';
import {
  type EquipmentItem,
  type EquipmentLoadout,
  getAvailableItems,
  getItemById,
  getLoadoutWeight,
} from '@/data/equipment';
import { getWeaponSuitability, type WeaponSuitability } from '@/engine/weaponSuitability';
import {
  getEncumbranceRatio,
  getEncumbranceTier,
} from '@/data/equipment/encumbrance';

/**
 * Defines the shape of gear recommendation.
 */
export interface GearRecommendation {
  loadout: EquipmentLoadout;
  label: string;
  description: string;
  totalWeight: number;
  synergy: number; // 0-100 score
  breakdown: {
    weapon: { item: EquipmentItem; preferred: boolean; suitability: WeaponSuitability };
    armor: { item: EquipmentItem };
    shield: { item: EquipmentItem; blocked: boolean };
    helm: { item: EquipmentItem };
  };
}

type BuildProfile = 'speed' | 'balanced' | 'tank' | 'damage';

const STYLE_PROFILES: Record<FightingStyle, BuildProfile[]> = {
  [FightingStyle.AimedBlow]: ['speed', 'balanced'],
  [FightingStyle.BashingAttack]: ['damage', 'tank'],
  [FightingStyle.LungingAttack]: ['speed', 'balanced'],
  [FightingStyle.ParryLunge]: ['balanced', 'speed'],
  [FightingStyle.ParryRiposte]: ['balanced', 'speed'],
  [FightingStyle.ParryStrike]: ['balanced', 'tank'],
  [FightingStyle.SlashingAttack]: ['damage', 'balanced'],
  [FightingStyle.StrikingAttack]: ['damage', 'balanced'],
  [FightingStyle.TotalParry]: ['tank', 'balanced'],
  [FightingStyle.WallOfSteel]: ['tank', 'balanced'],
};

const PROFILE_LABELS: Record<BuildProfile, string> = {
  speed: 'Lightning Build',
  balanced: 'Balanced Build',
  tank: 'Fortress Build',
  damage: 'Power Build',
};

const PROFILE_DESCS: Record<BuildProfile, string> = {
  speed: 'Minimal encumbrance for maximum initiative and mobility.',
  balanced: 'Moderate protection without sacrificing speed.',
  tank: 'Heavy armor and shields — outlast opponents through defense.',
  damage: 'Heavy weapons for maximum damage output.',
};

/** Score contribution from canonical weapon-vs-style suitability (CW > W > M > U). */
function suitabilityScore(suit: WeaponSuitability): number {
  return suit === 'CW' ? 40 : suit === 'W' ? 30 : suit === 'M' ? 5 : 0;
}

function scoreWeapon(item: EquipmentItem, style: FightingStyle, profile: BuildProfile): number {
  // Tier-aware: the canonical favorite (CW) outranks merely well-suited (W) weapons,
  // which outrank marginal (M); unorthodox (U) are already filtered from the pool.
  let score = 10 + suitabilityScore(getWeaponSuitability(item.id, style));
  if (profile === 'speed' && item.weight <= 2) score += 15;
  if (profile === 'damage' && item.weight >= 5) score += 15;
  if (profile === 'balanced' && item.weight >= 2 && item.weight <= 4) score += 10;
  if (profile === 'tank' && item.weight <= 4) score += 5;
  return score;
}

function scoreArmor(item: EquipmentItem, profile: BuildProfile): number {
  let score: number;
  if (profile === 'speed') score = item.weight <= 1 ? 30 : item.weight <= 2 ? 15 : 0;
  else if (profile === 'damage') score = item.weight <= 3 ? 20 : 10;
  else if (profile === 'tank')
    score = item.weight >= 5 ? 20 + item.weight : item.weight >= 3 ? 20 : 5;
  else score = item.weight >= 2 && item.weight <= 4 ? 15 + item.weight : 5;
  // Mitigation bonus — tank values it most, speed values it least
  const mit = item.mitigation ?? 0;
  if (profile === 'tank') score += mit * 2;
  else if (profile === 'balanced') score += mit;
  else if (profile === 'damage') score += mit * 0.5;
  // defenseMod bonus
  const defMod = item.defenseMod ?? 0;
  if (profile === 'tank') score += defMod * 3;
  else if (profile === 'balanced') score += defMod;
  // enduranceCostMod penalty — speed is most sensitive
  const endMod = item.enduranceCostMod ?? 1.0;
  if (profile === 'speed') score -= Math.max(0, (endMod - 1.0) * 20);
  else if (profile === 'balanced') score -= Math.max(0, (endMod - 1.0) * 5);
  return score;
}

function scoreShield(item: EquipmentItem, profile: BuildProfile): number {
  let score: number;
  if (item.id === 'none_shield') score = profile === 'speed' || profile === 'damage' ? 20 : 5;
  else if (profile === 'tank') score = item.weight >= 3 ? 30 : 20;
  else if (profile === 'speed') score = item.weight <= 1 ? 15 : 0;
  else score = item.weight <= 2 ? 15 : 10;
  // shieldParryBonus — tank and balanced value it most
  const parry = item.shieldParryBonus ?? 0;
  if (profile === 'tank') score += parry * 5;
  else if (profile === 'balanced') score += parry * 2;
  else if (profile === 'speed') score += parry;
  // shieldAttPenalty — damage and speed are most penalized
  const attPen = item.shieldAttPenalty ?? 0;
  if (profile === 'damage') score += attPen * 3;
  else if (profile === 'speed') score += attPen * 2;
  else score += attPen;
  return score;
}

function scoreHelm(item: EquipmentItem, profile: BuildProfile): number {
  let score: number;
  if (item.id === 'none_helm') score = profile === 'speed' ? 20 : 5;
  else if (profile === 'tank') score = item.weight >= 2 ? 20 + item.weight : 15;
  else if (profile === 'speed') score = item.weight <= 1 ? 20 : 5;
  else score = item.weight <= 2 ? 20 : 10;
  // Mitigation bonus
  const mit = item.mitigation ?? 0;
  if (profile === 'tank') score += mit * 2;
  else if (profile === 'balanced') score += mit;
  // defenseMod bonus
  const defMod = item.defenseMod ?? 0;
  if (profile === 'tank') score += defMod * 3;
  else if (profile === 'balanced') score += defMod;
  // enduranceCostMod penalty
  const endMod = item.enduranceCostMod ?? 1.0;
  if (profile === 'speed') score -= Math.max(0, (endMod - 1.0) * 20);
  else if (profile === 'balanced') score -= Math.max(0, (endMod - 1.0) * 5);
  return score;
}

function bestItem(items: EquipmentItem[], scorer: (i: EquipmentItem) => number): EquipmentItem {
  if (items.length === 0) {
    throw new Error('Cannot select best item from empty array');
  }
  let best = items[0];
  if (!best) throw new Error('Cannot select best item from empty array');

  let bestScore = scorer(best);
  // ⚡ Bolt: Single-pass loop to avoid redundantly evaluating the scorer for the best item
  for (let i = 1; i < items.length; i++) {
    const item = items[i];
    if (!item) continue;

    const score = scorer(item);
    if (score > bestScore) {
      best = item;
      bestScore = score;
    }
  }

  return best;
}

/**
 * Generates gear recommendations for a warrior based on their fighting style
 * and current carry capacity. Analyzes encumbrance vs performance tradeoffs.
 *
 * @param style - The warrior's fighting style
 * @param carryCap - The warrior's maximum encumbrance capacity
 * @returns Array of gear recommendations for different build profiles
 */
export function generateRecommendations(
  style: FightingStyle,
  carryCap: number
): GearRecommendation[] {
  const profiles = STYLE_PROFILES[style] ?? ['balanced'];
  const weapons = getAvailableItems('weapon', style);
  const armors = getAvailableItems('armor', style);
  const shields = getAvailableItems('shield', style);
  const helms = getAvailableItems('helm', style);
  const noShield = getItemById('none_shield');

  return profiles.map((profile) => {
    const weapon = bestItem(weapons, (w) => scoreWeapon(w, style, profile));
    const isTwoHanded = weapon.twoHanded ?? false;
    const armor = bestItem(armors, (a) => scoreArmor(a, profile));
    const helm = bestItem(helms, (h) => scoreHelm(h, profile));
    const shield = isTwoHanded
      ? (noShield ?? shields[0])
      : bestItem(shields, (s) => scoreShield(s, profile));
    if (!shield) throw new Error('No shield available');

    const loadout: EquipmentLoadout = {
      weapon: weapon.id,
      armor: armor.id,
      shield: shield.id,
      helm: helm.id,
    };

    const totalWeight = getLoadoutWeight(loadout);
    const suitability = getWeaponSuitability(weapon.id, style);
    const preferred = suitability === 'CW' || suitability === 'W';

    // Synergy score: 0-100 — the canonical favorite (CW) earns the most.
    let synergy = 40;
    synergy += suitability === 'CW' ? 30 : suitability === 'W' ? 25 : 0;

    // Encumbrance tier-aware synergy adjustments
    const encRatio = getEncumbranceRatio(loadout, carryCap);
    const encTier = getEncumbranceTier(encRatio);
    if (encTier === 'NONE') {
      synergy += 20;
      if (encRatio <= 0.5) synergy += 10; // very light bonus
    } else if (encTier === 'LIGHT') {
      synergy += 10;
    } else if (encTier === 'MEDIUM') {
      synergy += 0;
    } else if (encTier === 'HEAVY') {
      synergy -= 10;
    } else if (encTier === 'OVER') {
      synergy -= 25;
    }

    return {
      loadout,
      label: PROFILE_LABELS[profile],
      description: PROFILE_DESCS[profile],
      totalWeight,
      synergy: Math.min(100, synergy),
      breakdown: {
        weapon: { item: weapon, preferred, suitability },
        armor: { item: armor },
        shield: { item: shield, blocked: isTwoHanded },
        helm: { item: helm },
      },
    };
  });
}

/**
 * Retrieves style-specific equipment tips and guidance.
 *
 * @param style - The fighting style
 * @returns Array of strings containing equipment advice
 */
export function getStyleEquipmentTips(style: FightingStyle): string[] {
  const tips: Record<FightingStyle, string[]> = {
    [FightingStyle.AimedBlow]: [
      "The quarterstaff is your can't-go-wrong favorite; daggers, epées, even bare fists also suit your precision.",
      'Avoid heavy armor — you need the mobility for targeted strikes.',
      'Full helms are restricted for your style (blocks aimed shots).',
    ],
    [FightingStyle.BashingAttack]: [
      'Heavy weapons like maces, morning stars, and mauls deal devastating damage.',
      'You can afford heavier armor since mobility matters less.',
      'Two-handed weapons trade shield protection for raw power.',
    ],
    [FightingStyle.LungingAttack]: [
      'Epées and rapiers are ideal — light thrusting weapons.',
      'Stay light on armor to maintain your speed advantage.',
      'Medium+ shields are restricted — they interfere with lunging footwork.',
    ],
    [FightingStyle.ParryLunge]: [
      'Rapiers and epées complement your parry-then-thrust technique.',
      'Bucklers add parry bonus without encumbering you.',
      "Moderate armor works well — you're a hybrid fighter.",
    ],
    [FightingStyle.ParryRiposte]: [
      'Light-medium weapons give you the speed for ripostes.',
      'Shields complement your defensive foundation.',
      "Don't over-encumber — you need defense stat preservation.",
    ],
    [FightingStyle.ParryStrike]: [
      'Broadswords and longswords are your most efficient weapons.',
      'Moderate armor and a small shield is the optimal balance.',
      "You're the most gear-flexible style — experiment freely.",
    ],
    [FightingStyle.SlashingAttack]: [
      'Scimitars, longswords, and greatswords maximize slashing arcs.',
      'Large shields are restricted — they block your swing.',
      'Medium armor balances protection with mobility.',
    ],
    [FightingStyle.StrikingAttack]: [
      'Battle axes and greatswords deliver maximum striking force.',
      'You can handle moderate encumbrance without losing effectiveness.',
      'Heavy weapons + medium armor is a strong default.',
    ],
    [FightingStyle.TotalParry]: [
      'Weapon choice matters less — your defense is what wins.',
      'Maximize armor and shield for the ultimate defensive wall.',
      'Two-handed weapons and greatswords are restricted for your style.',
    ],
    [FightingStyle.WallOfSteel]: [
      'Broadswords are ideal for maintaining constant blade motion.',
      'Moderate armor keeps you mobile enough for the blade wall.',
      'Shield + medium weapon is your classic configuration.',
    ],
  };
  return tips[style] ?? [];
}
