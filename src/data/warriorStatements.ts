import { BaseSkills } from '@/types/shared.types';
import type { Persona } from '@/types/narrative.types';
import { computeCoordination, computeActivityRating, hpRating } from './terrabloodCharts';
import { STATEMENT_MIN_SKILLS } from '@/engine/warrior/skillBreakpoints';
import { skillTierLabel, SKILL_TIER_LABELS } from './skillTiers';
import uiMeta from '@/data/narrative/uiMeta.json';

const persona: Persona = uiMeta.persona;

// ─── Types ──────────────────────────────────────────────────────────────────

/**
 * Defines the shape of warrior overview statements.
 */
interface WarriorOverviewStatements {
  initiative: string;
  riposte: string;
  attack: string;
  parry: string;
  defense: string;
  endurance: string;
  coordination: string;
  quickness: string;
  activity: string;
}

type StatementEntry = { min: number; text: string };

// ─── Helpers ────────────────────────────────────────────────────────────────

function pickFromArchive(entries: StatementEntry[] | undefined, witValue: number): string {
  if (!entries || entries.length === 0) return '';
  // Sort descending by min so we find the first (highest) match
  const sorted = [...entries].sort((a, b) => b.min - a.min);
  for (const e of sorted) {
    if (witValue >= e.min) return e.text;
  }
  const last = entries[entries.length - 1];
  return last?.text ?? '';
}

interface GetStatementArgs {
  skillKey: string;
  baseValue: number;
  highThreshold: number;
  isGoodWit: boolean;
  wt: number;
  personaData: Persona;
}

function getStatement(args: GetStatementArgs): string {
  const { skillKey, baseValue, highThreshold, isGoodWit, wt } = args;
  const { personaData } = args;
  const witKey = isGoodWit ? 'good' : 'bad';
  const orderKey = baseValue >= highThreshold ? 'high' : 'low';
  const category = (
    personaData[witKey] as unknown as Record<string, Record<string, StatementEntry[]>>
  )?.[skillKey];
  const entries = category?.[orderKey];
  // Personas in the archive use the WT itself for the sub-selection min values
  return pickFromArchive(entries, wt);
}

function getQuicknessStatement(defBase: number, parBase: number, wt: number): string {
  if (wt <= 7) {
    if (defBase >= 15) return 'Is quick on his feet';
    if (defBase >= 5) return '';
    if (defBase >= -10) return 'Is slow on his feet';
    return 'Is very slow on his feet';
  }

  let speed;
  let qualifier;

  if (defBase >= 35) {
    speed = 'is incredibly quick and elusive on his feet';
    qualifier =
      parBase >= 30
        ? 'making even dangerous opponents look harmless'
        : parBase <= 0
          ? 'relying on speed to stay out of danger'
          : '';
  } else if (defBase >= 25) {
    speed = 'is very quick on his feet';
    qualifier =
      parBase >= 30
        ? 'often avoiding seemingly hopeless situations'
        : parBase <= 0
          ? 'avoiding rather than trading blows'
          : '';
  } else if (defBase >= 15) {
    speed = 'is quick on his feet';
    qualifier =
      parBase >= 30
        ? 'and is well able to protect himself'
        : parBase <= 0
          ? 'avoiding blows rather than parrying'
          : '';
  } else if (defBase >= 5) {
    return '';
  } else if (defBase >= -10) {
    speed = 'is slow on his feet';
    qualifier =
      parBase >= 30
        ? "finding it hard to avoid a blow he doesn't parry"
        : parBase <= 0
          ? 'with a marked inability to avoid or parry a blow'
          : '';
  } else {
    speed = 'is very slow on his feet';
    qualifier =
      parBase >= 30
        ? 'attempts to parry rather than dodge attacks'
        : parBase <= 0
          ? 'absolutely unable to avoid getting hurt'
          : '';
  }

  return qualifier ? `${speed}, ${qualifier}` : speed;
}

// ─── Generator ─────────────────────────────────────────────────────────────

/**
 * Generate warrior statements.
 */
export function generateWarriorStatements(
  wt: number,
  sp: number,
  df: number,
  skills: BaseSkills
): WarriorOverviewStatements {
  const isGoodWit = wt > 7;
  const p = persona;

  const skill = (skillKey: string, baseValue: number, highThreshold: number) =>
    getStatement({
      skillKey: skillKey,
      baseValue: baseValue,
      highThreshold: highThreshold,
      isGoodWit: isGoodWit,
      wt: wt,
      personaData: p,
    });

  // Descriptors
  const coordRating = computeCoordination(sp, df);
  const coordination = p.descriptors.coordination[coordRating] ?? '';

  // Canon floors (Noblish Island HIGH WIT STATEMENTS, WT15 row): on the
  // high-wit side a skill earns no statement at all until it reaches its
  // low-order floor — INI 10, RIP 10, ATT 7, PAR 6, DEF 3, DEC 9.
  const floor = (baseValue: number, min: number) => (isGoodWit && baseValue < min ? '' : undefined);

  const quickness = getQuicknessStatement(skills.DEF, skills.PAR, wt);

  const actRating = computeActivityRating(skills.INI, skills.RIP);
  let activity = '';
  if (actRating !== 'Normal') {
    // Basic mapping for activity descriptors
    activity = `Is ${actRating.toLowerCase()}`;
    // Future: pull from archive if we want more flavor
  }

  return {
    initiative: floor(skills.INI, STATEMENT_MIN_SKILLS.INI) ?? skill('initiative', skills.INI, 13),
    riposte: floor(skills.RIP, STATEMENT_MIN_SKILLS.RIP) ?? skill('riposte', skills.RIP, 13),
    attack: floor(skills.ATT, STATEMENT_MIN_SKILLS.ATT) ?? skill('attack', skills.ATT, 10),
    parry: floor(skills.PAR, STATEMENT_MIN_SKILLS.PAR) ?? skill('parry', skills.PAR, 10),
    defense: floor(skills.DEF, STATEMENT_MIN_SKILLS.DEF) ?? skill('defense', skills.DEF, 7),
    endurance: floor(skills.DEC, STATEMENT_MIN_SKILLS.DEC) ?? skill('endurance', skills.DEC, 10),
    coordination,
    quickness,
    activity,
  };
}

// ─── Physical profile statements ────────────────────────────────────────────
// Canon overview lines for non-normal physicals (Noblish Island profile).
// 'Cannot take a lot' and 'Average' HP bands stay silent — the overview only
// names the extremes; 'C' encumbrance and Normal damage likewise stay silent.

interface PhysicalProfile {
  enduranceTier: string;
  hp: number;
  encumbranceClass: string;
  damageClass: number;
}

const ENDURANCE_LINES: Record<string, string> = {
  L: 'Has very little endurance',
  P: 'Has poor endurance',
  G: 'Has good endurance',
  R: 'Has great endurance',
  T: 'Has tremendous endurance',
  A: 'Has awesome endurance',
  U: 'Has limitless endurance',
};

const PUNISHMENT_LINES: Record<string, string> = {
  'Very frail': 'Is very frail and cannot take much punishment',
  'A lot': 'Can take a lot of punishment',
  Tremendous: 'Can take tremendous amounts of punishment',
  'Seemingly unaffected': 'Is seemingly unaffected by punishment',
};

const CARRY_LINES: Record<string, string> = {
  A: 'Carries very little weight',
  B: 'Carries little weight',
  D: 'Carries a lot of weight',
  E: 'Carries great weight',
  F: 'Is crushed by the weight he bears',
};

const DAMAGE_LINES: Record<number, string> = {
  1: 'Does little damage',
  3: 'Does good damage',
  4: 'Does great damage',
  5: 'Does tremendous damage',
  6: 'Does awesome damage',
  7: 'Does devastating damage',
  8: 'Does superhuman damage',
  9: 'Does unearthly damage',
};

/**
 * Canon physical-profile lines for a warrior overview — only non-normal
 * physicals produce a statement.
 */
export function physicalProfileLines(profile: PhysicalProfile): string[] {
  const lines: string[] = [];
  const endurance = ENDURANCE_LINES[profile.enduranceTier];
  if (endurance) lines.push(endurance);
  const punishment = PUNISHMENT_LINES[hpRating(profile.hp)];
  if (punishment) lines.push(punishment);
  const carry = CARRY_LINES[profile.encumbranceClass];
  if (carry) lines.push(carry);
  const damage = DAMAGE_LINES[profile.damageClass];
  if (damage) lines.push(damage);
  return lines;
}

/**
 * Canon skill rating — the stated rungs of the Arena-93 ladder (Expert 16+).
 * Below Expert the newsletters make no statement; the full ladder
 * (incl. Master 26+ / Advanced Master 34+) lives in `skillTiers`.
 */
export function skillRating(skill: number): string | null {
  return skill >= SKILL_TIER_LABELS.expert.min ? skillTierLabel(skill) : null;
}


