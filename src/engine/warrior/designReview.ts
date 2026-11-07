/**
 * Stable Lords — Warrior Design Review
 *
 * Scores a (attributes, style) build against the five design axes from the
 * Arena 93 newsletter "How to Build a Better Warrior (version Y2K)":
 * fighting style, physical capabilities, weapon suitability, trainability,
 * and longevity. Pure — identical inputs produce identical items; used by
 * the Warrior Builder's Design Review panel.
 */
import { FightingStyle, type Attributes } from '@/types/shared.types';
import {
  STYLE_FAMILY,
  FAMILY_GUIDE,
  type StyleFamily,
  type StyleFamilyGuide,
  DESIGN_REVIEW_THRESHOLDS as T,
} from '@/data/designDoctrine';
import {
  computeHP,
  computeDamageClass,
  computeEnduranceTier,
} from '@/data/terrabloodCharts';
import { DAMAGE_LABELS, computeBaseSkills } from './skillCalc';
import { getWeaponSuitability } from '@/engine/equipment/weaponSuitability';
import {
  WEAPONS,
  checkWeaponRequirements,
  type WeaponReqResult,
} from '@/data/equipment';
import * as BPS from './skillBreakpoints';

/** The five design axes from the article. */
export type DesignAxis = 'style' | 'physicals' | 'weapons' | 'trainability' | 'longevity';

/** Review outcome: 'good' passes, 'ok' is thin, 'warn' needs work, 'info' is advisory. */
export type DesignVerdict = 'good' | 'ok' | 'warn' | 'info';

/**
 * Defines the shape of design review item.
 */
export interface DesignReviewItem {
  axis: DesignAxis;
  verdict: DesignVerdict;
  title: string;
  detail: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const TIER_ORDER = ['L', 'P', 'N', 'G', 'R', 'T', 'A', 'U'] as const;
type TierLetter = (typeof TIER_ORDER)[number];

const ENDURANCE_LABELS: Record<TierLetter, string> = {
  L: 'Very Little',
  P: 'Poor',
  N: 'Normal',
  G: 'Good',
  R: 'Great',
  T: 'Tremendous',
  A: 'Awesome',
  U: 'Limitless',
};

const enduranceAtLeast = (tier: string, min: TierLetter): boolean =>
  TIER_ORDER.indexOf(tier as TierLetter) >= TIER_ORDER.indexOf(min);

/** Union of a breakpoint table's thresholds (sorted, deduped). */
type BreakpointTable = readonly (readonly [number, number])[];
const thresholdsOf = (...tables: BreakpointTable[]): number[] =>
  [...new Set(tables.flat().map(([t]) => t))].sort((a, b) => a - b);

/** Smallest threshold above `value` in a sorted table, or undefined. */
function nextThreshold(table: number[], value: number): number | undefined {
  for (const t of table) if (t > value) return t;
  return undefined;
}

/**
 * Skill-bearing, trainable attributes — the article's "wit, will, speed, and
 * even strength… leave deftness at 9". CN grants no skills; SZ untrainable.
 */
const PRIMED_TABLES: Partial<Record<keyof Attributes, number[]>> = {
  ST: thresholdsOf(BPS.ST_ATT),
  WT: thresholdsOf(BPS.WT_ATT, BPS.WT_DEF, BPS.WT_INI, BPS.WT_RIP, BPS.WT_DEC),
  WL: thresholdsOf(BPS.WL_ATT, BPS.WL_PAR, BPS.WL_DEF, BPS.WL_DEC),
  SP: thresholdsOf(BPS.SP_DEC, BPS.SP_DEF, BPS.SP_INI, BPS.SP_RIP),
  DF: thresholdsOf(BPS.DF_ATT, BPS.DF_DEF, BPS.DF_INI, BPS.DF_PAR, BPS.DF_RIP),
};

/** Trainable weapon-requirement stats — SZ deficits can never be trained away. */
const TRAINABLE_REQ_STATS = new Set(['ST', 'WT', 'DF']);

/**
 * Total deficit across trainable requirement stats; Infinity when any
 * untrainable (SZ) requirement is unmet — no amount of training reaches it.
 */
function trainableDeficit(req: WeaponReqResult): number {
  let total = 0;
  for (const f of req.failures) {
    if (!TRAINABLE_REQ_STATS.has(f.stat)) return Infinity;
    total += f.deficit;
  }
  return total;
}

// ─── Axis reviewers ─────────────────────────────────────────────────────────

function reviewStyle(attrs: Attributes, style: FightingStyle): DesignReviewItem[] {
  const family: StyleFamily = STYLE_FAMILY[style];
  const guide: StyleFamilyGuide = FAMILY_GUIDE[family];
  const items: DesignReviewItem[] = [];

  if (family === 'mixed') {
    // "Will and whatever gets them to good cut-offs" — cut-offs approximated
    // as the weakest of the three exchange skills.
    const { ATT, PAR, DEF } = computeBaseSkills(attrs, style);
    const cutoffs = Math.min(ATT, PAR, DEF);
    const verdict: DesignVerdict =
      attrs.WL >= T.KEY_ATTR_GOOD && cutoffs >= 8
        ? 'good'
        : attrs.WL >= T.KEY_ATTR_OK && cutoffs >= 5
          ? 'ok'
          : 'warn';
    items.push({
      axis: 'style',
      verdict,
      title: `${guide.label} style fit`,
      detail: `Mixed styles key on will plus balanced cut-offs — WL ${attrs.WL}, weakest of ATT/PAR/DEF ${cutoffs}.`,
    });
  } else {
    const secondary = guide.keyAttributes.find((k) => k !== 'WL') ?? 'ST';
    const sec = attrs[secondary];
    const verdict: DesignVerdict =
      attrs.WL >= T.KEY_ATTR_GOOD && sec >= T.KEY_ATTR_OK
        ? 'good'
        : attrs.WL >= T.KEY_ATTR_OK && sec >= T.KEY_ATTR_SECONDARY_OK
          ? 'ok'
          : 'warn';
    items.push({
      axis: 'style',
      verdict,
      title: `${guide.label} style fit`,
      detail: `${guide.label} styles key on WL and ${secondary} — WL ${attrs.WL}, ${secondary} ${sec}.`,
    });
  }

  // Canon tip: "Never design an aimed blow with less than a 21 deftness."
  // On the 70-point budget the warn fires well below the canon aim.
  if (style === FightingStyle.AimedBlow && attrs.DF < T.AB_DF_CANON) {
    items.push({
      axis: 'style',
      verdict: attrs.DF < T.AB_DF_WARN ? 'warn' : 'info',
      title: 'Aimed-blow deftness',
      detail:
        attrs.DF < T.AB_DF_WARN
          ? `Deftness ${attrs.DF} is low for the surgeon's style — canon advice: never design an aimed-blow without top-tier deftness.`
          : `Deftness ${attrs.DF} works, but canon aims for ${T.AB_DF_CANON} deftness on aimed-blow designs.`,
    });
  }

  // Slasher notes from the Arena 93 slasher articles — the scimitar criterion
  // is the cornerstone check; the rest are advisory spending notes.
  if (style === FightingStyle.SlashingAttack) {
    const sc = checkWeaponRequirements('scimitar', attrs);
    const deficit = trainableDeficit(sc);
    items.push({
      axis: 'style',
      verdict: sc.met || deficit <= T.WEAPON_DEFICIT_IN_REACH ? 'ok' : 'warn',
      title: 'Scimitar criterion',
      detail: sc.met
        ? 'Meets the scimitar minimums (ST 9 / WT 11 / DF 11) — the cornerstone slasher blade.'
        : deficit <= T.WEAPON_DEFICIT_IN_REACH
          ? `Scimitar within a couple stat trains — ${sc.failures.map((f) => `${f.stat} needs ${f.required}`).join(', ')}.`
          : 'Misses the scimitar criterion (ST 9 / WT 11 / DF 11) by more than a couple trains — the articles say run shortsword or hatchet instead, or design a striker.',
    });
    if (attrs.DF < T.SL_DF_PARRY_INFO) {
      items.push({
        axis: 'style',
        verdict: 'info',
        title: 'Negative-parry baseline',
        detail: `Deftness ${attrs.DF} keeps slasher parry near zero — canon: the style defends with speed and offense, not parry.`,
      });
    }
    if (attrs.WL < T.SL_WL_INFO) {
      items.push({
        axis: 'style',
        verdict: 'info',
        title: 'Endurance engine',
        detail: `Will ${attrs.WL} — slashers burn endurance fast; the articles want will doing the heavy lifting.`,
      });
    }
    if (attrs.SZ > T.SL_SZ_INFO) {
      items.push({
        axis: 'style',
        verdict: 'info',
        title: 'Big-slasher trade-off',
        detail: `Size ${attrs.SZ} buys hit points and damage at the cost of encumbrance — workable, but the canon builds stay small.`,
      });
    }
    if (attrs.SP > T.SL_SP_INFO) {
      items.push({
        axis: 'style',
        verdict: 'info',
        title: 'Speed spending',
        detail: `Speed ${attrs.SP} — the articles say never add points to speed on a slasher; initiative comes from the style itself.`,
      });
    }
  }

  if (style === FightingStyle.ParryStrike) {
    items.push(...pikerCanonNotes(attrs));
  }

  if (style === FightingStyle.StrikingAttack) {
    items.push(...strikerCanonNotes(attrs));
  }

  if (style === FightingStyle.ParryLunge) {
    items.push(...parryLungeCanonNotes(attrs));
  }

  return items;
}

// Parry-lunge notes from the Arena 93 armor-piercer article + Tripwire's
// guide: the style is a fragile attack god — deftness 15 unlocks the epee,
// speed is wasted ("not a lunger mimic"), and low-constitution graduates
// cling to life by luck.
function parryLungeCanonNotes(attrs: Attributes): DesignReviewItem[] {
  const items: DesignReviewItem[] = [];
  if (attrs.CN <= T.PL_CN_INFO) {
    items.push({
      axis: 'style',
      verdict: 'info',
      title: 'Glass-jaw constitution',
      detail: `Constitution ${attrs.CN} — the armor-piercer's own graduate clings to life by luck; fragile is workable, but know what you're signing up for.`,
    });
  }
  if (attrs.SP >= T.PL_SP_INFO) {
    items.push({
      axis: 'style',
      verdict: 'info',
      title: 'Wasted speed',
      detail: `Speed ${attrs.SP} — a parry-lunger is not a lunger mimic; the articles spend those points on wit, will, and deftness.`,
    });
  }
  if (attrs.DF < T.PL_DF_INFO) {
    items.push({
      axis: 'style',
      verdict: 'info',
      title: 'Sub-epee deftness',
      detail: `Deftness ${attrs.DF} — 15 deftness unlocks the epee, the style's signature blade.`,
    });
  }
  if (attrs.WT >= T.PL_WT_GOOD && attrs.DF >= T.PL_DF_GOOD) {
    items.push({
      axis: 'style',
      verdict: 'good',
      title: 'Attack-god chassis',
      detail: `Wit ${attrs.WT} with deftness ${attrs.DF} — the armor-piercer spread; a parry-lunger on this frame out-attacks everything.`,
    });
  }
  return items;
}

// Striker notes from the Arena 93 striker articles — Assur's stat
// minimums (ST 9 / WT 11 / WL 9 / DF 11) are the consensus floor every
// author repeats in some form.
function strikerCanonNotes(attrs: Attributes): DesignReviewItem[] {
  const minimums: [keyof Attributes, number][] = [
    ['ST', T.ST_MIN_ST],
    ['WT', T.ST_MIN_WT],
    ['WL', T.ST_MIN_WL],
    ['DF', T.ST_MIN_DF],
  ];
  const short = minimums.filter(([k, min]) => attrs[k] < min);
  if (short.length === 0) return [];
  return [
    {
      axis: 'style',
      verdict: 'warn',
      title: 'Striker minimums',
      detail: `Below Assur's striker minimums — ${short
        .map(([k, min]) => `${k} ${attrs[k]} < ${min}`)
        .join(', ')} (canon floor: ST ${T.ST_MIN_ST} / WT ${T.ST_MIN_WT} / WL ${T.ST_MIN_WL} / DF ${T.ST_MIN_DF}).`,
    },
  ];
}

// Piker notes from the Arena 93 parry-strike articles. Wit is the keystone
// (Assur's tournament pikers ran 17-21; even his successful scum piker ran
// ~11) and "do not make average numbers into pikers" — the flat-spread
// warn fires on builds with no extreme, not on low absolute values.
function pikerCanonNotes(attrs: Attributes): DesignReviewItem[] {
  const items: DesignReviewItem[] = [];
  if (attrs.WT < T.PS_WT_NOTE) {
    items.push({
      axis: 'style',
      verdict: 'info',
      title: 'Piker wit',
      detail: `Wit ${attrs.WT} — the canon articles call wit the keystone of the style: tournament pikers ran 17-21, and even scum variants want ~11.`,
    });
  }
  const spread =
    Math.max(...Object.values(attrs)) - Math.min(...Object.values(attrs));
  if (spread <= T.PS_FLAT_SPREAD) {
    items.push({
      axis: 'style',
      verdict: 'warn',
      title: 'Average-numbers piker',
      detail: `A spread of only ${spread} points between best and worst attribute — canon advice: never make average numbers into the worst style in the game; pick an extreme.`,
    });
  }
  return items;
}

function reviewPhysicals(attrs: Attributes, style: FightingStyle): DesignReviewItem[] {
  const endurance = computeEnduranceTier(attrs.ST, attrs.CN, attrs.WL);
  const damage = computeDamageClass(attrs.ST, attrs.SZ);
  const hp = computeHP(attrs.CN, attrs.SZ, attrs.WL);

  const good =
    enduranceAtLeast(endurance, 'G') || damage >= 3 || hp >= T.HP_GOOD;

  const items: DesignReviewItem[] = [
    {
      axis: 'physicals',
      verdict: good ? 'good' : 'warn',
      title: 'Physical capability',
      detail: `Endurance ${ENDURANCE_LABELS[endurance as TierLetter] ?? endurance} · Damage ${DAMAGE_LABELS[damage] ?? '?'} · HP ${hp} — at least one should reach "good".`,
    },
  ];

  if (style === FightingStyle.StrikingAttack) {
    // Assur's acceptable pairings: Normal endurance/Normal damage,
    // Poor/Good, or Very Little/Great — a striker must reach at least one.
    const pairingMet =
      (enduranceAtLeast(endurance, 'N') && damage >= 2) ||
      (enduranceAtLeast(endurance, 'P') && damage >= 3) ||
      damage >= 4;
    if (!pairingMet) {
      items.push({
        axis: 'physicals',
        verdict: 'warn',
        title: 'Striker physicals',
        detail: `No canon physical pairing reaches Assur's floor (Normal/Normal, Poor/Good, Very Little/Great) — endurance ${ENDURANCE_LABELS[endurance as TierLetter] ?? endurance}, damage ${DAMAGE_LABELS[damage] ?? '?'}.`,
      });
    }
    // Sir Boyd's damage rule — a striker with ST+SZ under 21 hits softly.
    if (attrs.ST + attrs.SZ < T.ST_BOYD_DAMAGE_SUM) {
      items.push({
        axis: 'physicals',
        verdict: 'info',
        title: "Boyd's damage bar",
        detail: `Strength ${attrs.ST} + size ${attrs.SZ} = ${attrs.ST + attrs.SZ} — Sir Boyd wants ${T.ST_BOYD_DAMAGE_SUM}+ on a striker or the damage rating stays light.`,
      });
    }
  }

  return items;
}

function reviewWeapons(attrs: Attributes, style: FightingStyle): DesignReviewItem {
  const suited = WEAPONS.filter(
    (w) => w.slot === 'weapon' && w.id !== 'fist'
  ).map((w) => ({
    name: w.name,
    suit: getWeaponSuitability(w.id, style),
    req: checkWeaponRequirements(w.id, attrs),
  }));
  const wellSuited = suited.filter((x) => x.suit === 'CW' || x.suit === 'W');

  const met = wellSuited.filter((x) => x.req.met);
  // "A couple stat trains" — small deficits on trainable stats only; a size
  // deficit can never be trained away.
  const inReach = wellSuited.filter(
    (x) => !x.req.met && trainableDeficit(x.req) <= T.WEAPON_DEFICIT_IN_REACH
  );

  const verdict: DesignVerdict =
    met.length >= 2 ? 'good' : met.length === 1 || inReach.length > 0 ? 'ok' : 'warn';

  const names = (list: { name: string }[]) =>
    list.length ? list.map((x) => x.name).join(', ') : 'none';

  return {
    axis: 'weapons',
    verdict,
    title: 'Weapon suitability',
    detail: `Well-suited now: ${names(met)} · within a couple trains: ${names(inReach)}.`,
  };
}

function reviewTrainability(
  attrs: Attributes,
  style: FightingStyle
): DesignReviewItem[] {
  const items: DesignReviewItem[] = [];

  const primed = (
    Object.entries(PRIMED_TABLES) as [keyof Attributes, number[]][]
  )
    .filter(([key, table]) => {
      const next = nextThreshold(table, attrs[key]);
      return next !== undefined && next - attrs[key] <= 2;
    })
    .map(([key]) => key);

  items.push({
    axis: 'trainability',
    verdict: primed.length > 0 ? 'good' : 'info',
    title: 'Breakpoint trains',
    detail: primed.length
      ? `${primed.join(' · ')} ${primed.length === 1 ? 'sits' : 'sit'} one or two points below the next skill breakpoint — primed for a quick train once skills are learned.`
      : 'No trainable attribute sits just below a skill breakpoint.',
  });

  // "The best stat for trainability is a 21" — trains past 21 pay out.
  const maxed = (Object.keys(PRIMED_TABLES) as (keyof Attributes)[]).filter(
    (key) => attrs[key] >= 21 && attrs[key] < 25
  );
  if (maxed.length > 0) {
    items.push({
      axis: 'trainability',
      verdict: 'info',
      title: 'Premium trains',
      detail: `${maxed.join(' · ')} at 21+ — every further train yields quick, significant skills.`,
    });
  }

  // "Keep wit as low as possible on scum warriors."
  if (style === FightingStyle.TotalParry && attrs.WT >= T.TP_SCUM_WT_INFO) {
    items.push({
      axis: 'trainability',
      verdict: 'info',
      title: 'Wit on a scum',
      detail:
        'Scum doctrine keeps wit low — extra wit buys learning the style rarely needs, at the cost of physicals.',
    });
  }

  return items;
}

function reviewLongevity(attrs: Attributes, style: FightingStyle): DesignReviewItem[] {
  const items: DesignReviewItem[] = [];
  // Talon's Primal bar — wit 17+, deftness 15+, will 13+ marks a
  // Primus-quality striker frame.
  if (
    style === FightingStyle.StrikingAttack &&
    attrs.WT >= T.ST_PRIMAL_WT &&
    attrs.DF >= T.ST_PRIMAL_DF &&
    attrs.WL >= T.ST_PRIMAL_WL
  ) {
    items.push({
      axis: 'longevity',
      verdict: 'info',
      title: 'Primal frame',
      detail: `Wit ${attrs.WT} / deftness ${attrs.DF} / will ${attrs.WL} — clears Talon's Primal bar; a Primus-quality striker frame.`,
    });
  }
  if (attrs.WT >= T.FAST_LEARNER_WT) {
    items.push({
      axis: 'longevity',
      verdict: 'info',
      title: 'Fast learner',
      detail: `Wit ${attrs.WT} accelerates skill gains — a long-career godling profile.`,
    });
  } else if (attrs.WL >= T.KEY_ATTR_GOOD && attrs.WT <= T.KEY_ATTR_OK) {
    items.push({
      axis: 'longevity',
      verdict: 'info',
      title: 'Early contender',
      detail: `High will (${attrs.WL}) with modest wit — quick, meaningful stat trains over fast learning.`,
    });
  }
  return items;
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Review a warrior design against the Arena-93 design doctrine.
 * Pure — identical inputs produce identical items.
 */
export function reviewWarriorDesign(
  attrs: Attributes,
  style: FightingStyle
): DesignReviewItem[] {
  return [
    ...reviewStyle(attrs, style),
    ...reviewPhysicals(attrs, style),
    reviewWeapons(attrs, style),
    ...reviewTrainability(attrs, style),
    ...reviewLongevity(attrs, style),
  ];
}
