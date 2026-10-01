/**
 * Legacy Founder system — Hall-of-Fame-caliber retirees founding rival stables.
 *
 * One predicate (`isLegacyFounderCaliber`) gates every enqueue path; the queued
 * warriors live in `state.legacyFounderQueue` and are consumed by the seasonal
 * expansion pass. A founder's stable reflects what they actually did in the
 * arena: personality from the career record, favored styles from the style they
 * fought, and the founder enters the new stable's staff as head trainer.
 */
import { FightingStyle } from '@/types/shared.types';
import type { Warrior, Attributes } from '@/types/warrior.types';
import type { OwnerPersonality } from '@/types/state.types';
import type { Trainer, TrainerFocus, TrainerSpecialty } from '@/types/shared.types';
import { qualifiesForLegend } from '@/data/names/epithets';
import { convertRetiredToTrainer } from '@/engine/trainers/trainers';
import { PERSONALITY_STYLE_PREFS } from '@/data/ownerData';
import {
  LEGACY_FOUNDER_FAME_MIN,
  LEGACY_FOUNDER_FAME_HOF,
  LEGACY_FOUNDER_WINS_MIN,
  LEGACY_FOUNDER_KILLS_MIN,
} from '@/constants/world';

/** Parry/riposte families — counter-fighting founders breed thinking stables. */
const RIPOSTE_FAMILY: ReadonlySet<FightingStyle> = new Set([
  FightingStyle.ParryRiposte,
  FightingStyle.ParryStrike,
  FightingStyle.ParryLunge,
  FightingStyle.WallOfSteel,
  FightingStyle.TotalParry,
]);

/** Brutal families — body-count founders breed kill-hungry stables. */
const BRUTAL_FAMILY: ReadonlySet<FightingStyle> = new Set([
  FightingStyle.BashingAttack,
  FightingStyle.SlashingAttack,
  FightingStyle.StrikingAttack,
]);

/** Deterministic precedence when a style belongs to several personality tables. */
const FAMILY_ORDER: readonly OwnerPersonality[] = [
  'Aggressive',
  'Tactician',
  'Methodical',
  'Showman',
  'Pragmatic',
];

/** Attribute → trainer focus used when a founder becomes head trainer. */
const ATTR_FOCUS: Record<keyof Attributes, TrainerFocus> = {
  ST: 'Aggression',
  CN: 'Endurance',
  SZ: 'Aggression',
  WT: 'Mind',
  WL: 'Endurance',
  SP: 'Aggression',
  DF: 'Defense',
};

/**
 * Founder caliber: Hall-of-Fame careers (50+ wins, 10+ kills, 1500+ fame, or
 * any title) plus near-legend records and annual award winners. One gate for
 * every retirement path — a warrior is either founder material or not.
 */
export function isLegacyFounderCaliber(w: Warrior): boolean {
  if (qualifiesForLegend(w)) return true;
  if ((w.fame ?? 0) >= LEGACY_FOUNDER_FAME_MIN && (w.career?.wins ?? 0) >= LEGACY_FOUNDER_WINS_MIN) {
    return true;
  }
  if ((w.career?.kills ?? 0) >= LEGACY_FOUNDER_KILLS_MIN) return true;
  if (
    (w.awards ?? []).some((a) => a.type === 'WARRIOR_OF_YEAR' || a.type === 'KILLER_OF_YEAR')
  ) {
    return true;
  }
  return false;
}

/**
 * Owner personality derived from the founder's actual career record, not the
 * generic gladiator-backstory weights:
 *   kill-heavy or brutal-style record      → Aggressive
 *   parry/riposte record with few losses   → Tactician (Methodical if softer)
 *   high fame + popularity, flashy career  → Showman
 *   long, steady record                    → Pragmatic
 *   otherwise                              → the founder's style family
 */
export function personalityFromCareer(w: Warrior): OwnerPersonality {
  const career = w.career ?? { wins: 0, losses: 0, kills: 0 };
  const fights = career.wins + career.losses;
  const winRate = fights > 0 ? career.wins / fights : 0;

  if (career.kills >= LEGACY_FOUNDER_KILLS_MIN || (BRUTAL_FAMILY.has(w.style) && career.kills >= 4)) {
    return 'Aggressive';
  }

  if (RIPOSTE_FAMILY.has(w.style)) {
    return winRate >= 0.55 && fights >= 10 ? 'Tactician' : 'Methodical';
  }

  if ((w.fame ?? 0) >= LEGACY_FOUNDER_FAME_HOF || (w.popularity ?? 0) >= LEGACY_FOUNDER_FAME_MIN) {
    return 'Showman';
  }

  if (fights >= LEGACY_FOUNDER_WINS_MIN) return 'Pragmatic';

  for (const p of FAMILY_ORDER) {
    if ((PERSONALITY_STYLE_PREFS[p] ?? []).includes(w.style)) return p;
  }
  return 'Pragmatic';
}

/** The stable a founder opens — named after the legend, always an Academy. */
export function founderStableName(w: Warrior): string {
  return `${w.name}'s Academy`;
}

/**
 * The founder becomes the new stable's head trainer: focus from their
 * strongest attribute, `styleBonusStyle` their fighting style, specialty from
 * the axis their career won on (kills → KillerInstinct, riposte defense →
 * CounterFighter, etc.).
 */
export function deriveFounderTrainer(w: Warrior): Trainer {
  const base = convertRetiredToTrainer(w);
  const focus = strongestAttrFocus(w);
  return {
    ...base,
    focus,
    styleBonusStyle: w.style,
    specialty: winAxisSpecialty(w, focus),
  };
}

/** Strongest attribute decides what the founder teaches. */
function strongestAttrFocus(w: Warrior): TrainerFocus {
  let best: keyof Attributes = 'WT';
  let bestV = -1;
  for (const k of ['ST', 'CN', 'SZ', 'WT', 'WL', 'SP', 'DF'] as const) {
    const v = w.attributes?.[k] ?? 0;
    if (v > bestV) {
      bestV = v;
      best = k;
    }
  }
  return ATTR_FOCUS[best];
}

/** The axis the career was won on decides the trainer's signature specialty. */
function winAxisSpecialty(w: Warrior, focus: TrainerFocus): TrainerSpecialty {
  if ((w.career?.kills ?? 0) >= 5) return 'KillerInstinct';
  switch (focus) {
    case 'Aggression':
      return 'Finisher';
    case 'Defense':
      return RIPOSTE_FAMILY.has(w.style) ? 'CounterFighter' : 'IronGuard';
    case 'Mind':
      return 'Footwork';
    default:
      return 'IronConditioning';
  }
}

/**
 * Normalize a retiring warrior into a queue entry — a detached snapshot so the
 * queue survives the roster mutation that removed them.
 */
export function buildLegacyFounderQueueEntry(w: Warrior): Warrior {
  return {
    ...w,
    career: { ...(w.career ?? { wins: 0, losses: 0, kills: 0 }) },
    titles: [...(w.titles ?? [])],
    traits: [...(w.traits ?? [])],
    attributes: { ...w.attributes },
  };
}
