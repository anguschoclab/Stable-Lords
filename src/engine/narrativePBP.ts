import { FightingStyle, STYLE_DISPLAY_NAMES } from "@/types/game";
import { getItemById } from "@/data/equipment";
import {
  HIT_LOC_VARIANTS,
  STYLE_PBP_DESC,
  HELM_DESCS,
  ATTACK_TEMPLATES,
  INI_FEINT_TEMPLATES,
  EVEN_STATUS,
  KILL_TEMPLATES,
  STOPPAGE_TEMPLATES,
  EXHAUSTION_TEMPLATES,
  POPULARITY_TEMPLATES,
  SKILL_LEARNS,
  TRADING_BLOWS,
  STALEMATE_LINES,
  WINNER_TAUNTS,
  LOSER_TAUNTS,
  PRESSING_TEMPLATES,
  INSIGHT_ST_HINTS,
  INSIGHT_SP_HINTS,
  INSIGHT_DF_HINTS,
  INSIGHT_WL_HINTS,
  MASTERY_TEMPLATES,
  SUPER_FLASHY_TEMPLATES,
} from "./narrative/narrativeData";
import {
  pick,
  szToHeight,
  getWeaponDisplayName,
  getWeaponType,
} from "./narrative/narrativeUtils";
import {
  KO_TEMPLATES,
  ARMOR_INTRO_VERBS,
  WEAPON_INTRO_VERBS,
  BATTLE_OPENERS,
  PARRY_TEMPLATES,
  PARRY_SHIELD_TEMPLATES,
  DODGE_TEMPLATES,
  COUNTERSTRIKE_TEMPLATES,
  HIT_TEMPLATES,
  PARRY_BREAK_TEMPLATES,
  CROWD_REACTIONS_POSITIVE,
  CROWD_REACTIONS_NEGATIVE,
  CROWD_REACTIONS_ENCOURAGE,
  INI_WIN_TEMPLATES,
} from "./narrativeTemplates";

// ─── Types ──────────────────────────────────────────────────────────────────

type RNG = () => number;

// ─── Hit Location Display ───────────────────────────────────────────────────

export function richHitLocation(rng: RNG, location: string): string {
  const variants = HIT_LOC_VARIANTS[location.toLowerCase()];
  if (!variants) return location.toUpperCase();
  return pick(rng, variants);
}

// ─── Pre-Bout Intro Block ───────────────────────────────────────────────────

export interface WarriorIntroData {
  name: string;
  style: FightingStyle;
  weaponId?: string;
  armorId?: string;
  helmId?: string;
  height?: number;
}

export function generateWarriorIntro(rng: RNG, data: WarriorIntroData, sz?: number): string[] {
  const lines: string[] = [];
  const n = data.name;

  if (sz) lines.push(`${n} is ${szToHeight(sz)}.`);
  
  const hand = rng() < 0.85 ? "right handed" : rng() < 0.5 ? "left handed" : "ambidextrous";
  lines.push(`${n} is ${hand}.`);

  // Armor & Helm
  const armorItem = data.armorId ? getItemById(data.armorId) : null;
  if (armorItem && armorItem.id !== "none_armor") {
    lines.push(`${n} ${pick(rng, ARMOR_INTRO_VERBS)} ${armorItem.name.toUpperCase()} armor.`);
  } else {
    lines.push(`${n} has chosen to fight without body armor.`);
  }

  const helmItem = data.helmId ? getItemById(data.helmId) : null;
  if (helmItem && helmItem.id !== "none_helm") {
    const helmNames = HELM_DESCS[helmItem.id] ?? [helmItem.name.toUpperCase()];
    lines.push(`And will wear a ${pick(rng, helmNames)}.`);
  }

  // Weapon & Style
  const weaponName = getWeaponDisplayName(data.weaponId);
  if (weaponName === "OPEN HAND") {
    lines.push(`${n} will fight using his OPEN HAND.`);
  } else {
    lines.push(`${n} ${pick(rng, WEAPON_INTRO_VERBS).replace("%W", weaponName)}.`);
  }

  lines.push(`${n} ${STYLE_PBP_DESC[data.style] ?? `uses the ${STYLE_DISPLAY_NAMES[data.style]} style`}.`);
  lines.push(`${n} is well suited to the weapons selected.`);

  return lines;
}

// ─── Battle Openers ─────────────────────────────────────────────────────────

export function battleOpener(rng: RNG): string {
  return pick(rng, BATTLE_OPENERS);
}

// ─── Attack Narration ───────────────────────────────────────────────────────

export function narrateAttack(rng: RNG, attackerName: string, weaponId?: string, isMastery?: boolean): string {
  const wType = getWeaponType(weaponId);
  const wName = getWeaponDisplayName(weaponId);

  if (isMastery && MASTERY_TEMPLATES[wType]) {
    const template = pick(rng, MASTERY_TEMPLATES[wType]);
    return template.replace(/%N/g, attackerName).replace(/%W/g, wName);
  }

  const template = pick(rng, ATTACK_TEMPLATES[wType]);
  return template.replace(/%N/g, attackerName).replace(/%W/g, wName);
}

export function narrateParry(rng: RNG, defenderName: string, weaponId?: string): string {
  const wName = getWeaponDisplayName(weaponId);
  const isShield = weaponId && ["small_shield", "medium_shield", "large_shield"].includes(weaponId);
  return pick(rng, isShield ? PARRY_SHIELD_TEMPLATES : PARRY_TEMPLATES)
    .replace(/%D/g, defenderName)
    .replace(/%W/g, wName);
}

export function narrateDodge(rng: RNG, defenderName: string): string {
  return pick(rng, DODGE_TEMPLATES).replace(/%D/g, defenderName);
}

export function narrateCounterstrike(rng: RNG, name: string): string {
  return pick(rng, COUNTERSTRIKE_TEMPLATES).replace(/%D/g, name);
}

export function narrateHit(rng: RNG, defenderName: string, location: string, isMastery?: boolean, isSuperFlashy?: boolean, attackerName?: string, weaponId?: string): string {
  const richLoc = richHitLocation(rng, location);
  const wName = getWeaponDisplayName(weaponId);

  if (isSuperFlashy) {
    const template = pick(rng, SUPER_FLASHY_TEMPLATES);
    return template.replace(/%N/g, attackerName || "The warrior").replace(/%W/g, wName).replace(/%D/g, defenderName).replace(/%L/g, richLoc);
  }

  const template = pick(rng, HIT_TEMPLATES);
  return template.replace(/%D/g, defenderName).replace(/%L/g, richLoc);
}

export function narrateParryBreak(rng: RNG, attackerName: string, weaponId?: string): string {
  const wName = getWeaponDisplayName(weaponId);
  return pick(rng, PARRY_BREAK_TEMPLATES).replace(/%A/g, attackerName).replace(/%W/g, wName);
}

// ─── Status & Feedback ──────────────────────────────────────────────────────

export function damageSeverityLine(rng: RNG, damage: number, maxHp: number): string | null {
  const ratio = damage / maxHp;
  if (ratio >= 0.35) return pick(rng, ["It was a deadly attack!", "What a massive blow!", "What a devastating attack!"]);
  if (ratio >= 0.25) return pick(rng, ["It was an incredible blow!", "It is a terrific blow!"]);
  if (ratio >= 0.15) return pick(rng, ["It is a tremendous blow!", "It was a powerful blow!"]);
  if (ratio <= 0.05) return pick(rng, ["The attack is a glancing blow only.", "The stroke lands ineffectively."]);
  return null;
}

export function stateChangeLine(rng: RNG, name: string, hpRatio: number, prevHpRatio: number): string | null {
  if (hpRatio <= 0.2 && prevHpRatio > 0.2) return pick(rng, [`${name} is severely hurt!!`, `${name} is dangerously stunned!`]);
  if (hpRatio <= 0.4 && prevHpRatio > 0.4) return `${name} appears DESPERATE!`;
  if (hpRatio <= 0.6 && prevHpRatio > 0.6) return `${name} has sustained serious wounds!`;
  return null;
}

export function fatigueLine(rng: RNG, name: string, endRatio: number): string | null {
  if (endRatio <= 0.15) return `${name} is tired and barely able to defend himself!`;
  if (endRatio <= 0.3) return `${name} is breathing heavily.`;
  return null;
}

export function crowdReaction(rng: RNG, loserName: string, winnerName: string, hpRatio: number): string | null {
  if (rng() > 0.25) return null;
  if (hpRatio <= 0.3) return pick(rng, CROWD_REACTIONS_ENCOURAGE).replace(/%N/g, loserName);
  return pick(rng, rng() < 0.5 ? CROWD_REACTIONS_NEGATIVE : CROWD_REACTIONS_POSITIVE).replace(/%N/g, loserName);
}

export function narrateInitiative(rng: RNG, winnerName: string, isFeint: boolean): string {
  const templates = isFeint ? INI_FEINT_TEMPLATES : INI_WIN_TEMPLATES;
  return pick(rng, templates).replace(/%N/g, winnerName);
}

export function minuteStatusLine(rng: RNG, minute: number, nameA: string, nameD: string, hitsA: number, hitsD: number): string {
  if (hitsA > hitsD + 3) return `${nameA} is beating his opponent!`;
  if (hitsD > hitsA + 3) return `${nameD} is beating his opponent!`;
  return pick(rng, EVEN_STATUS);
}

// ─── Post-Bout ──────────────────────────────────────────────────────────────

export function narrateBoutEnd(rng: RNG, by: string, winnerName: string, loserName: string): string[] {
  let templates: string[];
  switch (by) {
    case "Kill": templates = KILL_TEMPLATES; break;
    case "KO": templates = KO_TEMPLATES; break;
    case "Stoppage": templates = STOPPAGE_TEMPLATES; break;
    case "Exhaustion": templates = EXHAUSTION_TEMPLATES; break;
    default: return [`${winnerName} is the victor of the match!`];
  }
  return pick(rng, templates).replace(/%A/g, winnerName).replace(/%D/g, loserName).split("\n");
}

export function popularityLine(name: string, popDelta: number): string | null {
  if (popDelta >= 3) return POPULARITY_TEMPLATES.great.replace(/%N/g, name);
  if (popDelta >= 1) return POPULARITY_TEMPLATES.normal.replace(/%N/g, name);
  return null;
}

export function skillLearnLine(rng: RNG, name: string): string {
  return pick(rng, SKILL_LEARNS).replace(/%N/g, name);
}

export function tradingBlowsLine(rng: RNG): string {
  return pick(rng, TRADING_BLOWS);
}

export function stalemateLine(rng: RNG): string {
  return pick(rng, STALEMATE_LINES);
}

export function tauntLine(rng: RNG, name: string, isWinner: boolean): string | null {
  if (rng() > 0.2) return null;
  return pick(rng, isWinner ? WINNER_TAUNTS : LOSER_TAUNTS).replace(/%N/g, name);
}

export function conservingLine(name: string): string {
  return `${name} is conserving his energy.`;
}

export function pressingLine(rng: RNG, name: string): string {
  return pick(rng, PRESSING_TEMPLATES).replace(/%N/g, name);
}

export function narrateInsightHint(rng: RNG, attribute: string): string | null {
  if (rng() > 0.4) return null;
  switch (attribute) {
    case 'ST': return pick(rng, INSIGHT_ST_HINTS);
    case 'SP': return pick(rng, INSIGHT_SP_HINTS);
    case 'DF': return pick(rng, INSIGHT_DF_HINTS);
    case 'WL': return pick(rng, INSIGHT_WL_HINTS);
    default: return null;
  }
}
