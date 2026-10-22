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
import { getTrainingBonus, trainerBonusToMods } from '@/engine/trainers/trainers';
import { getFavoriteWeaponBonus } from '@/engine/favorites';
import { getMasteryBonus } from '@/engine/favorites/weaponMastery';
import { getStaticTraitMods, getTraitFightPlanMods } from '@/engine/traits';
import { getInjuryPenalties } from '@/engine/injuries';
import { applyLuckfactor } from '@/engine/warrior/skillCalc';
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
  return trainerBonusToMods(getTrainingBonus(trainers, style));
}

/** Equipment/encumbrance/trait context gathered once for skill aggregation. */
interface ModifierContext {
  warrior?: Warrior;
  trainers?: Trainer[];
  plan: FightPlan;
  attrs: Warrior['attributes'];
  skills: BaseSkills;
  equip: NonNullable<Warrior['equipment']>;
}

/** Every flat skill modifier gathered once — trainers, favorites/mastery,
 * shields, weapon reqs, encumbrance, armor, classic bonus, drills, traits,
 * injuries. Conditional traits are applied per-exchange in resolution.ts. */
function gatherSkillModifiers(ctx: ModifierContext) {
  const { warrior, trainers, plan, attrs, equip } = ctx;

  const trainerMods = trainers ? getTrainerMods(trainers, plan.style) : null;
  const favWeapon = warrior ? getFavoriteWeaponBonus(warrior) : 0;
  const mastery = getMasteryBonus(plan.style, favWeapon > 0);
  const veteranDef = warrior ? getVeteranDefBonus(warrior.age ?? 18, attrs.WL) : 0;

  const wShield = getShieldModifiers(equip.weapon);
  const oShield = getShieldModifiers(equip.shield);

  const weaponReq = checkWeaponRequirements(equip.weapon, {
    ST: attrs.ST,
    SZ: attrs.SZ,
    WT: attrs.WT,
    DF: attrs.DF,
  });

  // 5-tier encumbrance system
  const encPenalties = getEncumbrancePenalties(
    getEncumbranceTier(getEncumbranceRatio(equip, warrior?.derivedStats?.encumbrance ?? 0))
  );

  const classicBonus = warrior ? getClassicWeaponBonus(plan.style, equip.weapon) : 0;
  return {
    trainerMods,
    mastery,
    veteranDef,
    totalShieldDef: wShield.def + oShield.def,
    totalShieldAtt: wShield.att + oShield.att,
    weaponReq,
    encPenalties,
    // Equipment defense modifiers (armor + helm)
    armorDefMod: getItemById(equip.armor)?.defenseMod ?? 0,
    helmDefMod: getItemById(equip.helm)?.defenseMod ?? 0,
    classicBonus,
    // Weapon-linked slice of the bakes above — subtracted/re-added when the
    // held weapon swaps (disarm/rearm).
    weaponMods: {
      att: classicBonus + weaponReq.attPenalty + wShield.att,
      par: wShield.def,
      def: wShield.def,
    },
    // Skill drilling bonuses — flat additive modifiers from dedicated drill training.
    drills: warrior?.skillDrills ?? {},
    // Static trait mods (Quick, Heavy-Handed, Agile, etc.). Conditional traits
    // (Berserker, Patient, etc.) are applied per-exchange in resolution.ts.
    traitMods: getStaticTraitMods(warrior),
    injuryPenalties: getInjuryPenalties(warrior?.injuries ?? []),
  };
}

type SkillMods = ReturnType<typeof gatherSkillModifiers>;

/** Per-skill addend table — every flat modifier's contribution by skill. */
function skillAddends(m: SkillMods): BaseSkills {
  return {
    ATT:
      (m.trainerMods?.attMod ?? 0) +
      m.mastery.att +
      m.classicBonus +
      m.weaponReq.attPenalty +
      m.totalShieldAtt +
      (m.drills.ATT ?? 0) +
      m.traitMods.attMod +
      (m.injuryPenalties['ATT'] ?? 0),
    PAR:
      (m.trainerMods?.parMod ?? 0) +
      m.totalShieldDef +
      m.encPenalties.parPenalty +
      (m.drills.PAR ?? 0) +
      m.traitMods.parMod +
      (m.injuryPenalties['PAR'] ?? 0),
    DEF:
      (m.trainerMods?.defMod ?? 0) +
      m.totalShieldDef +
      m.armorDefMod +
      m.helmDefMod +
      m.encPenalties.defPenalty +
      m.veteranDef +
      m.mastery.def +
      (m.drills.DEF ?? 0) +
      m.traitMods.defMod +
      (m.injuryPenalties['DEF'] ?? 0),
    INI:
      (m.trainerMods?.iniMod ?? 0) +
      m.encPenalties.iniPenalty +
      m.mastery.ini +
      (m.drills.INI ?? 0) +
      m.traitMods.iniMod +
      (m.injuryPenalties['INI'] ?? 0),
    RIP:
      m.mastery.rip +
      (m.drills.RIP ?? 0) +
      m.traitMods.ripMod +
      (m.injuryPenalties['RIP'] ?? 0),
    DEC:
      (m.trainerMods?.decMod ?? 0) +
      (m.drills.DEC ?? 0) +
      m.traitMods.decMod +
      (m.injuryPenalties['DEC'] ?? 0),
  };
}

/** Aggregate every flat modifier into the fighter's effective skill scores. */
function computeEffectiveSkills(ctx: ModifierContext): {
  effSkills: BaseSkills;
  mastery: ReturnType<typeof getMasteryBonus>;
  traitMods: ReturnType<typeof getStaticTraitMods>;
  encPenalties: ReturnType<typeof getEncumbrancePenalties>;
  weaponMods: { att: number; par: number; def: number };
} {
  const m = gatherSkillModifiers(ctx);
  const a = skillAddends(m);
  const effSkills: BaseSkills = {
    ATT: ctx.skills.ATT + a.ATT,
    PAR: ctx.skills.PAR + a.PAR,
    DEF: ctx.skills.DEF + a.DEF,
    INI: ctx.skills.INI + a.INI,
    RIP: ctx.skills.RIP + a.RIP,
    DEC: ctx.skills.DEC + a.DEC,
  };
  return {
    effSkills,
    mastery: m.mastery,
    traitMods: m.traitMods,
    encPenalties: m.encPenalties,
    weaponMods: m.weaponMods,
  };
}

/**
 * Personality trait FightPlan mods (Aggressive +OE, Cunning +feint, etc.)
 * baked into the BASE plan so evaluateConditions (which resets activePlan to
 * plan each exchange) doesn't silently erase personality-driven behaviour.
 */
function applyTraitPlanMods(plan: FightPlan, warrior?: Warrior): FightPlan {
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
  return traitPlan;
}

/** Zero/false combat-counter fields — identical on every fresh fighter. */
const FRESH_COMBAT_COUNTERS = {
  hitsLanded: 0,
  hitsTaken: 0,
  ripostes: 0,
  consecutiveHits: 0,
  armHits: 0,
  legHits: 0,
  bleedStacks: 0,
  momentum: 0,
  riposteStreak: 0,
  parDegrade: 0,
  committed: false,
  survivalStrike: false,
  counterstrikePrimed: false,
  recoveryDebt: 0,
} as const;

/** Assemble the FighterState literal from its computed inputs. */
function assembleFighterState(args: {
  label: 'A' | 'D';
  traitPlan: FightPlan;
  attrs: Warrior['attributes'];
  derived: NonNullable<Warrior['derivedStats']>;
  equip: NonNullable<Warrior['equipment']>;
  warrior: Warrior | undefined;
  trainerMods: ReturnType<typeof getTrainerMods> | null;
  computed: ReturnType<typeof computeEffectiveSkills>;
}): FighterState {
  const { label, traitPlan, attrs, derived, equip, warrior, trainerMods, computed } = args;
  const { effSkills, mastery, traitMods, encPenalties, weaponMods } = computed;
  const endBonus = trainerMods?.endMod ?? 0;
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
    endurance: derived.endurance + endBonus,
    maxEndurance: derived.endurance + endBonus,
    ...FRESH_COMBAT_COUNTERS,
    favorites: warrior?.favorites,
    traits: warrior?.traits,
    staticEnduranceMult: traitMods.enduranceMult,
    totalFights: warrior?.career ? warrior.career.wins + warrior.career.losses : 0,
    encumbrancePenalty: {
      iniPenalty: encPenalties.iniPenalty,
      defPenalty: encPenalties.defPenalty,
      parPenalty: encPenalties.parPenalty,
      enduranceMult: encPenalties.enduranceMult,
    },
    weaponId: equip.weapon,
    armorId: equip.armor,
    shieldId: equip.shield,
    helmId: equip.helm,
    backupWeaponId: equip.backup,
    disarmResist: traitMods.disarmResist || undefined,
    unarmedDmgBonus: traitMods.unarmedDmgBonus || undefined,
    weaponMods,
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

  const computed = computeEffectiveSkills({ warrior, trainers, plan, attrs, skills, equip });
  const traitPlan = applyTraitPlanMods(plan, warrior);

  return assembleFighterState({
    label,
    traitPlan,
    attrs,
    derived,
    equip,
    warrior,
    trainerMods,
    computed,
  });
}
