import { FightingStyle, type BaseSkills } from '@/types/shared.types';
import { type Warrior } from '@/types/warrior.types';
import { type FightPlan } from '@/types/combat.types';
import { type Trainer } from '@/types/state.types';
import {
  getClassicWeaponBonus,
  checkWeaponRequirements,
  getShieldModifiers,
  getStyleDefaultLoadout,
  getItemById,
} from '@/data/equipment';
import {
  getEncumbranceRatio,
  getEncumbranceTier,
  getEncumbrancePenalties,
} from '@/data/equipment/encumbrance';
import { getTrainingBonus } from '@/engine/trainers';
import { getFavoriteWeaponBonus } from '@/engine/favorites';
import { getMasteryBonus } from '@/engine/favorites/weaponMastery';
import { getStaticTraitMods, getTraitFightPlanMods } from '@/engine/traits';
import { getInjuryPenalties } from '@/engine/injuries';
import { applyLuckfactor } from '@/engine/skillCalc';
import { getVeteranDefBonus } from '@/engine/aging/veteranCompensation';
import { type FighterState } from '../combat/resolution/types';
import { clamp } from '@/utils/math';

/**
 * Calculates attribute and skill modifiers provided by a list of active trainers.
 *
 * @param trainers - Array of active trainer entities
 * @param style - The warrior's fighting style to determine specialty compatibility
 * @returns An object containing various combat modifiers (ATT, DEF, INI, etc.)
 */
function getTrainerMods(trainers: Trainer[], style: FightingStyle) {
  const bonus = getTrainingBonus(trainers, style);
  return {
    attMod: bonus.Aggression,
    parMod: Math.floor(bonus.Defense * 0.6),
    defMod: Math.floor(bonus.Defense * 0.4),
    iniMod: Math.floor(bonus.Mind * 0.6),
    decMod: Math.floor(bonus.Mind * 0.4),
    endMod: bonus.Endurance * 2,
    healMod: bonus.Healing,
  };
}

/**
 * Prepares the combat state for a single fighter.
 */
export function createFighterState(
  label: 'A' | 'D',
  plan: FightPlan,
  warrior?: Warrior,
  trainers?: Trainer[]
): FighterState {
  const attrs = warrior?.attributes ?? { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 };
  // Apply the hidden luckfactor (canonical ±4/skill) at combat time — the overview
  // shows luck-free baseSkills, but the arena uses the luck-adjusted values.
  const skills = applyLuckfactor(
    warrior?.baseSkills ?? { ATT: 5, PAR: 5, DEF: 5, INI: 5, RIP: 5, DEC: 5 },
    warrior?.luckfactor
  );
  const derived = warrior?.derivedStats ?? { hp: 100, endurance: 100, damage: 5, encumbrance: 0 };

  // Style-aware fallback: if warrior has no equipment, use the style's classic loadout
  // (was DEFAULT_LOADOUT — broadsword for everyone, which silently advantaged ST).
  const equip = warrior?.equipment ?? getStyleDefaultLoadout(plan.style);
  const trainerMods = trainers ? getTrainerMods(trainers, plan.style) : null;
  const favWeapon = warrior ? getFavoriteWeaponBonus(warrior) : 0;
  const isMastered = favWeapon > 0;
  const mastery = getMasteryBonus(plan.style, isMastered);
  const veteranDef = warrior ? getVeteranDefBonus(warrior.age ?? 18, attrs.WL) : 0;

  const wShield = getShieldModifiers(equip.weapon);
  const oShield = getShieldModifiers(equip.shield);
  const totalShieldDef = wShield.def + oShield.def;
  const totalShieldAtt = wShield.att + oShield.att;

  const weaponReq = checkWeaponRequirements(equip.weapon, {
    ST: attrs.ST,
    SZ: attrs.SZ,
    WT: attrs.WT,
    DF: attrs.DF,
  });

  // 5-tier encumbrance system
  const encRatio = getEncumbranceRatio(equip, derived.encumbrance);
  const encTier = getEncumbranceTier(encRatio);
  const encPenalties = getEncumbrancePenalties(encTier);
  const encumbranceIniPenalty = encPenalties.iniPenalty;
  const encumbranceDefPenalty = encPenalties.defPenalty;
  const encumbranceParPenalty = encPenalties.parPenalty;
  const encumbranceEndMult = encPenalties.enduranceMult;

  // Equipment defense modifiers (armor + helm)
  const armorItem = getItemById(equip.armor);
  const helmItem = getItemById(equip.helm);
  const armorDefMod = armorItem?.defenseMod ?? 0;
  const helmDefMod = helmItem?.defenseMod ?? 0;

  const classicBonus = warrior ? getClassicWeaponBonus(plan.style, equip.weapon) : 0;

  // Skill drilling bonuses — flat additive modifiers from dedicated drill training.
  const drills = warrior?.skillDrills ?? {};

  // Static trait mods (Quick, Heavy-Handed, Agile, etc.). Conditional traits
  // (Berserker, Patient, etc.) are applied per-exchange in resolution.ts.
  const traitMods = getStaticTraitMods(warrior);

  const injuryPenalties = getInjuryPenalties(warrior?.injuries ?? []);

  const effSkills: BaseSkills = {
    ATT:
      skills.ATT +
      (trainerMods?.attMod ?? 0) +
      mastery.att +
      classicBonus +
      weaponReq.attPenalty +
      totalShieldAtt +
      (drills.ATT ?? 0) +
      traitMods.attMod +
      (injuryPenalties['ATT'] ?? 0),
    PAR:
      skills.PAR +
      (trainerMods?.parMod ?? 0) +
      totalShieldDef +
      encumbranceParPenalty +
      (drills.PAR ?? 0) +
      traitMods.parMod +
      (injuryPenalties['PAR'] ?? 0),
    DEF:
      skills.DEF +
      (trainerMods?.defMod ?? 0) +
      totalShieldDef +
      armorDefMod +
      helmDefMod +
      encumbranceDefPenalty +
      veteranDef +
      mastery.def +
      (drills.DEF ?? 0) +
      traitMods.defMod +
      (injuryPenalties['DEF'] ?? 0),
    INI:
      skills.INI +
      (trainerMods?.iniMod ?? 0) +
      encumbranceIniPenalty +
      mastery.ini +
      (drills.INI ?? 0) +
      traitMods.iniMod +
      (injuryPenalties['INI'] ?? 0),
    RIP:
      skills.RIP +
      mastery.rip +
      (drills.RIP ?? 0) +
      traitMods.ripMod +
      (injuryPenalties['RIP'] ?? 0),
    DEC:
      skills.DEC +
      (trainerMods?.decMod ?? 0) +
      (drills.DEC ?? 0) +
      traitMods.decMod +
      (injuryPenalties['DEC'] ?? 0),
  };

  // Personality trait FightPlan mods (Aggressive +OE, Cunning +feint, etc.)
  // Bake into the BASE plan so evaluateConditions (which resets activePlan to
  // plan each exchange) doesn't silently erase personality-driven behaviour.
  const aiMods = getTraitFightPlanMods(warrior);
  const traitPlan = { ...plan };
  if (aiMods.OE != null) traitPlan.OE = clamp(traitPlan.OE + aiMods.OE, 0, 10);
  if (aiMods.AL != null) traitPlan.AL = clamp(traitPlan.AL + aiMods.AL, 0, 10);
  if (aiMods.killDesire != null)
    traitPlan.killDesire = Math.max(
      0,
      Math.min(100, (traitPlan.killDesire ?? 0) + aiMods.killDesire)
    );
  if (aiMods.feintTendency != null)
    traitPlan.feintTendency = Math.max(
      0,
      Math.min(100, (traitPlan.feintTendency ?? 0) + aiMods.feintTendency)
    );

  return {
    label,
    style: traitPlan.style,
    attributes: attrs,
    skills: effSkills,
    derived: {
      ...derived,
      damage: derived.damage + mastery.dmg + traitMods.dmgBonus,
    },
    plan: traitPlan,
    activePlan: { ...traitPlan },
    psychState: 'Neutral',
    hp: derived.hp,
    maxHp: derived.hp,
    endurance: derived.endurance + (trainerMods?.endMod ?? 0),
    maxEndurance: derived.endurance + (trainerMods?.endMod ?? 0),
    hitsLanded: 0,
    hitsTaken: 0,
    ripostes: 0,
    consecutiveHits: 0,
    armHits: 0,
    legHits: 0,
    favorites: warrior?.favorites,
    traits: warrior?.traits,
    staticEnduranceMult: traitMods.enduranceMult,
    totalFights: warrior?.career ? warrior.career.wins + warrior.career.losses : 0,
    encumbrancePenalty: {
      iniPenalty: encumbranceIniPenalty,
      defPenalty: encumbranceDefPenalty,
      parPenalty: encumbranceParPenalty,
      enduranceMult: encumbranceEndMult,
    },
    weaponId: equip.weapon,
    armorId: equip.armor,
    shieldId: equip.shield,
    helmId: equip.helm,
    bleedStacks: 0,
    momentum: 0,
    riposteStreak: 0,
    parDegrade: 0,
    committed: false,
    survivalStrike: false,
    counterstrikePrimed: false,
    recoveryDebt: 0,
  };
}
