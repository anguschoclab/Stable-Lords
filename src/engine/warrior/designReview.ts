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
  STYLE_DESIGN_MINIMUMS,
  DA_WL_FLOOR,
  DA_ST_FLOOR,
  LOW_BURN_STYLES,
  LOW_BURN_SP_MAX,
} from '@/data/designDoctrine';
import {
  computeHP,
  computeDamageClass,
  computeEnduranceTier,
  computeEncumbranceCapacity,
} from '@/data/terrabloodCharts';
import { DAMAGE_LABELS, computeBaseSkills } from './skillCalc';
import { getWeaponSuitability } from '@/engine/equipment/weaponSuitability';
import {
  WEAPONS,
  checkWeaponRequirements,
  getItemById,
  getLoadoutWeight,
  type WeaponReqResult,
} from '@/data/equipment';
import {
  WINNING_ARCHETYPES,
  ARCHETYPE_DESIGN_BARS,
  classifyArchetype,
  type WinningArchetype,
} from '@/data/warriorArchetypes';
import * as BPS from './skillBreakpoints';

/** The five design axes from the article, plus the V27 tourney-projection axis. */
export type DesignAxis =
  | 'style'
  | 'physicals'
  | 'weapons'
  | 'trainability'
  | 'longevity'
  | 'tourney';

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
  /** V24: stable identifier for canonical doctrine rules (tests, UI keys). */
  id?: string;
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

  if (style === FightingStyle.SlashingAttack) items.push(...slasherCanonNotes(attrs));
  if (style === FightingStyle.ParryStrike) items.push(...pikerCanonNotes(attrs));
  if (style === FightingStyle.StrikingAttack) items.push(...strikerCanonNotes(attrs));
  if (style === FightingStyle.ParryLunge) items.push(...parryLungeCanonNotes(attrs));
  if (style === FightingStyle.WallOfSteel) items.push(...wallOfSteelCanonNotes(attrs));
  if (style === FightingStyle.LungingAttack) items.push(...lungerCanonNotes(attrs));
  if (style === FightingStyle.BashingAttack) items.push(...basherCanonNotes(attrs));
  if (style === FightingStyle.ParryRiposte) items.push(...parryRiposteCanonNotes(attrs));
  if (style === FightingStyle.TotalParry) items.push(...totalParryCanonNotes(attrs));
  if (style === FightingStyle.AimedBlow) items.push(...aimerPhysicalsNotes(attrs));

  return items;
}

// Basher note from Assur's "Bash Bros" — bashers either tank up on
// constitution/will (scum-basher) or hit hard (high ST for damage); a basher
// short on both has no canon identity.
function basherCanonNotes(attrs: Attributes): DesignReviewItem[] {
  const tank = attrs.CN >= T.KEY_ATTR_GOOD && attrs.WL >= T.KEY_ATTR_GOOD;
  const smasher = attrs.ST >= T.KEY_ATTR_GOOD && attrs.ST + attrs.SZ >= 24;
  if (tank || smasher) return [];
  return [
    {
      axis: 'style',
      verdict: 'info',
      title: 'Basher identity',
      detail:
        'Bash Bros doctrine: bashers commit to constitution+will (scum) or strength for damage — this frame is short of both.',
    },
  ];
}

// Parry-riposte note — the hybrid style lives on the riposte engine, so it
// wants deftness/speed over brute physicals; low both is the canon failure.
function parryRiposteCanonNotes(attrs: Attributes): DesignReviewItem[] {
  if (attrs.DF >= T.KEY_ATTR_OK && attrs.SP >= T.KEY_ATTR_OK) return [];
  return [
    {
      axis: 'style',
      verdict: 'info',
      title: 'Riposteur frame',
      detail:
        'Parry-riposte is the hybrid style — it earns on deftness and speed feeding the riposte; this build is thin on both.',
    },
  ];
}

// Total-parry note — the scum archetype is a pure constitution/will tank;
// physicals short of that leave a style with no engine at all.
function totalParryCanonNotes(attrs: Attributes): DesignReviewItem[] {
  if (attrs.CN + attrs.WL >= 26) return [];
  return [
    {
      axis: 'style',
      verdict: 'info',
      title: 'Scum frame',
      detail:
        'Total-parry doctrine is a wall of constitution+will — the style only works when physicals carry it.',
    },
  ];
}

// Aimed-blow physicals note — canon warns aimer designs are glass surgeons;
// short endurance/HP behind the precision leaves them dead before they fire.
function aimerPhysicalsNotes(attrs: Attributes): DesignReviewItem[] {
  const endurance = computeEnduranceTier(attrs.ST, attrs.CN, attrs.WL);
  if (enduranceAtLeast(endurance, 'N')) return [];
  return [
    {
      axis: 'physicals',
      verdict: 'warn',
      title: 'Aimer fragility',
      detail: `Endurance ${ENDURANCE_LABELS[endurance as TierLetter] ?? endurance} — aimed-blow surgeons still need the stamina to survive to their openings.`,
    },
  ];
}

// Slasher notes from the Arena 93 slasher articles — the scimitar criterion
// is the cornerstone check; the rest are advisory spending notes.
function slasherCanonNotes(attrs: Attributes): DesignReviewItem[] {
  const items: DesignReviewItem[] = [];
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

// Wall-of-Steel notes from the Arena 93 wall corpus (Eli's Parry-Slash take,
// Assur's Bash Bros, Dante Killatroll's Nerdy Style, She-Puppy's Berserker,
// and Wasted Wastes). Will is the keystone — the style burns endurance like
// a lunger — and the scimitar floor is the cornerstone criterion. Everything
// else is advisory: speed is a luxury, size stays in band, and Eli keeps
// SP+DF at 18 minimum for coordination.
function wallOfSteelCanonNotes(attrs: Attributes): DesignReviewItem[] {
  const items: DesignReviewItem[] = [];

  if (attrs.WL < T.WS_WL_WARN) {
    items.push({
      axis: 'style',
      verdict: attrs.WL < T.WS_WL_FLOOR ? 'warn' : 'info',
      title: 'Endurance-burn will',
      detail:
        attrs.WL < T.WS_WL_FLOOR
          ? `Will ${attrs.WL} — a will-less wall is a wasted waste; the style burns endurance like a lunger and even Dante's floor is ${T.WS_WL_FLOOR}.`
          : `Will ${attrs.WL} works outside ADM ambition, but the wall corpus wants ${T.WS_WL_WARN}+ (17 or 21 preferred) — the style burns endurance like a lunger.`,
    });
  } else if (attrs.WL >= 17) {
    items.push({
      axis: 'style',
      verdict: 'good',
      title: 'Endurance-burn will',
      detail: `Will ${attrs.WL} is burn-rated for the wall — the corpus asks 15+ and prefers 17 or 21.`,
    });
  }

  const sc = checkWeaponRequirements('scimitar', attrs);
  const deficit = trainableDeficit(sc);
  items.push({
    axis: 'style',
    verdict: sc.met || deficit <= T.WEAPON_DEFICIT_IN_REACH ? 'ok' : 'warn',
    title: 'Scimitar floor',
    detail: sc.met
      ? `Meets the scimitar minimums — Dante's cornerstone: a waste must at least swing the scimitar (ST ${T.WS_ST_MIN}+ opens it; ${T.WS_ST_GOOD} adds broadsword and quarterstaff).`
      : deficit <= T.WEAPON_DEFICIT_IN_REACH
        ? `Scimitar within a couple stat trains — ${sc.failures.map((f) => `${f.stat} needs ${f.required}`).join(', ')}.`
        : 'Cannot reach the scimitar — Dante: "you need to at least be able to use the Scimitar."',
  });

  if (attrs.WT < T.WS_WT_INFO) {
    items.push({
      axis: 'style',
      verdict: 'info',
      title: 'Wit learning',
      detail: `Wit ${attrs.WT} — Eli calls ${T.WS_WT_INFO}+ near-mandatory: below it, learning "slows to a crawl."`,
    });
  }
  if (attrs.DF < T.WS_DF_MIN) {
    items.push({
      axis: 'style',
      verdict: 'warn',
      title: 'Deftness floor',
      detail: `Deftness ${attrs.DF} — ${T.WS_DF_MIN} is the floor for weapon requirements and coordination; Eli won't run a waste below 13.`,
    });
  }
  if (attrs.SP > T.WS_SP_INFO) {
    items.push({
      axis: 'style',
      verdict: 'info',
      title: 'Speed luxury',
      detail: `Speed ${attrs.SP} — the corpus treats speed as a luxury: Assur adds zero points to it and Eli runs a 3.`,
    });
  }
  if (attrs.SZ > T.WS_SZ_HI || attrs.SZ < T.WS_SZ_LO) {
    items.push({
      axis: 'style',
      verdict: 'info',
      title: 'Size band',
      detail:
        attrs.SZ > T.WS_SZ_HI
          ? `Size ${attrs.SZ} buys negative defense/parry skill points and an endurance tax — Dante caps walls at ${T.WS_SZ_HI}.`
          : `Size ${attrs.SZ} — wee wastes hit soft and take less; She-Puppy floors size at ${T.WS_SZ_LO}.`,
    });
  }
  if (attrs.SP + attrs.DF < T.WS_COORD_MIN) {
    items.push({
      axis: 'style',
      verdict: 'info',
      title: 'Coordination check',
      detail: `SP+DF ${attrs.SP + attrs.DF} — Eli keeps the pair at ${T.WS_COORD_MIN} minimum (21 is normal coordination): coordination is vital to the wall's attack and defense.`,
    });
  }
  if (attrs.CN <= 8) {
    items.push({
      axis: 'style',
      verdict: 'info',
      title: 'Low-con wall',
      detail: `Constitution ${attrs.CN} — low con is workable on a wall run fast and furious; Eli's Bender held a 7 and never lost.`,
    });
  }
  if (attrs.ST + attrs.CN >= T.WS_STCN_GOOD) {
    items.push({
      axis: 'style',
      verdict: 'info',
      title: 'Physical spread',
      detail: `ST+CN ${attrs.ST + attrs.CN} reaches Dante's ${T.WS_STCN_GOOD} bar — endurance and carry are set.`,
    });
  }
  return items;
}

// Lunger notes from the Arena 93 lunger corpus — Elder Snorri's "Lunger
// Strats", The Wild Boar's "Defensive Lunger", and Assur's Lunger Model.
// Assur's frame is the longsword well-suited triplet (ST 11 / WT 13 / DF 11);
// Snorri spends like a scum — con is real on this style — and wants the
// spread even.
function lungerCanonNotes(attrs: Attributes): DesignReviewItem[] {
  const items: DesignReviewItem[] = [];
  const lo = checkWeaponRequirements('longsword', attrs);
  const deficit = trainableDeficit(lo);
  items.push({
    axis: 'style',
    verdict: lo.met || deficit <= T.WEAPON_DEFICIT_IN_REACH ? 'ok' : 'warn',
    title: 'Longsword criterion',
    detail: lo.met
      ? `Meets Assur's longsword frame (ST 11 / WT 13 / DF 11) — the lazy-mode lunger blade, scimitar against plate.`
      : deficit <= T.WEAPON_DEFICIT_IN_REACH
        ? `Longsword within a couple stat trains — ${lo.failures.map((f) => `${f.stat} needs ${f.required}`).join(', ')}.`
        : `Misses Assur's longsword frame (ST 11 / WT 13 / DF 11) by more than a couple trains — run short spear or epee instead, or spend like the model.`,
  });
  if (attrs.CN < T.LU_CN_SOFT_FLOOR) {
    items.push({
      axis: 'style',
      verdict: 'info',
      title: 'Thin constitution',
      detail: `Constitution ${attrs.CN} — the usual never-spend-con advice doesn't hold here; Snorri keeps ${T.LU_CN_SOFT_FLOOR}+ on a style that takes hits.`,
    });
  }
  if (attrs.SZ < T.LU_DAMAGE_SZ && attrs.ST < T.LU_DAMAGE_ST) {
    items.push({
      axis: 'style',
      verdict: 'info',
      title: 'Damage-rating caution',
      detail: `Size ${attrs.SZ} with strength ${attrs.ST} — Snorri finds it hard to roll a good damage rating under size ${T.LU_DAMAGE_SZ} without strength ${T.LU_DAMAGE_ST}.`,
    });
  }
  const spread = Math.max(...Object.values(attrs)) - Math.min(...Object.values(attrs));
  if (spread <= T.LU_EVEN_SPREAD) {
    items.push({
      axis: 'style',
      verdict: 'info',
      title: 'Even spread',
      detail: `Only ${spread} points between best and worst attribute — Snorri's core lunger doctrine: a fairly even spread works well.`,
    });
  }
  if (attrs.WT >= T.LU_WT_CEIL) {
    items.push({
      axis: 'style',
      verdict: 'info',
      title: 'Wit ceiling',
      detail: `Wit ${attrs.WT} — Snorri got good bases at 12 and saw no gain past ${T.LU_WT_CEIL} on a lunger; the points may serve better on will or strength.`,
    });
  }
  return items;
}

// V25 — Assur's winning-archetype layer (orthogonal to StyleFamily: family
// is how the style fights, archetype is how the build wins). Filed under
// the 'style' axis with the other build-identity notes. One helper per
// note so each canon bar stays a named, testable unit.

/** Top-fit classification item + close-second mention. */
function archetypeFitItem(
  fits: ReturnType<typeof classifyArchetype>
): DesignReviewItem | undefined {
  const [top, second] = fits;
  if (!top) return undefined;
  const guide = WINNING_ARCHETYPES[top.archetype];
  return {
    axis: 'style',
    verdict: 'info',
    id: 'v25-archetype-fit',
    title: guide.label,
    detail:
      `${guide.family} fit ${top.score}/100` +
      (second && top.score - second.score < 10
        ? ` — close to ${WINNING_ARCHETYPES[second.archetype].label}. `
        : '. ') +
      guide.armor.notes,
  };
}

/** Tank-frame gap — classifies AS a tank but the ST/CN bars are unmet. */
function tankFrameNote(
  attrs: Attributes,
  top: NonNullable<ReturnType<typeof classifyArchetype>[number]>
): DesignReviewItem | undefined {
  const isTank =
    top.archetype === 'tankHybrid' || top.archetype === 'lowWillTankHybrid';
  if (
    !isTank ||
    (attrs.ST >= ARCHETYPE_DESIGN_BARS.TANK_ST_MIN &&
      attrs.CN >= ARCHETYPE_DESIGN_BARS.TANK_CN_MIN)
  )
    return undefined;
  return {
    axis: 'style',
    verdict: 'warn',
    id: 'v25-tank-frame',
    title: 'Tank frame gap',
    detail: `Tank fit ${top.score}/100 but ST ${attrs.ST} < ${ARCHETYPE_DESIGN_BARS.TANK_ST_MIN} or CN ${attrs.CN} < ${ARCHETYPE_DESIGN_BARS.TANK_CN_MIN} — tank hybrids need the frame to carry plate and hit points.`,
  };
}

/** Offensive wit floor — "wit 11 is the bare minimum". */
function offensiveWitNote(
  attrs: Attributes,
  top: NonNullable<ReturnType<typeof classifyArchetype>[number]>
): DesignReviewItem | undefined {
  if (
    top.archetype !== 'pureOffensive' ||
    attrs.WT >= ARCHETYPE_DESIGN_BARS.OFFENSIVE_WT_MIN
  )
    return undefined;
  return {
    axis: 'style',
    verdict: 'warn',
    id: 'v25-offensive-wit',
    title: 'Offensive wit',
    detail: `Wit ${attrs.WT} under the canon bare minimum of ${ARCHETYPE_DESIGN_BARS.OFFENSIVE_WT_MIN} — an offensive that cannot learn cannot adapt.`,
  };
}

/** Riposte dead band — SP 10-12 on a riposting fit. */
function riposteDeadBandNote(
  attrs: Attributes,
  fits: ReturnType<typeof classifyArchetype>
): DesignReviewItem | undefined {
  const [deadLo, deadHi] = ARCHETYPE_DESIGN_BARS.RIPOSTE_SP_DEAD_BAND;
  const riposteFit = fits.slice(0, 2).some((f) => f.archetype === 'ripostingHybrid');
  if (!riposteFit || attrs.SP < deadLo || attrs.SP > deadHi) return undefined;
  return {
    axis: 'style',
    verdict: 'info',
    id: 'v25-riposte-dead-band',
    title: 'Riposte dead band',
    detail: `Speed ${attrs.SP} sits in the SP ${deadLo}-${deadHi} dead band — slow ripostes never land; the build gave up the speed it needed to matter.`,
  };
}

/** Big hybrid — size on a hybrid fit costs the points the build needs. */
function bigHybridNote(
  attrs: Attributes,
  top: NonNullable<ReturnType<typeof classifyArchetype>[number]>
): DesignReviewItem | undefined {
  const guide = WINNING_ARCHETYPES[top.archetype];
  if (guide.family !== 'hybrid' || attrs.SZ < ARCHETYPE_DESIGN_BARS.BIG_HYBRID_SZ)
    return undefined;
  return {
    axis: 'style',
    verdict: 'info',
    id: 'v25-big-hybrid',
    title: 'Big hybrid',
    detail: `Size ${attrs.SZ} — hybrids stay small; size points are wit, deftness, and will the build cannot train back.`,
  };
}

/** Surgeon chassis — AB with ST under the viability floor can't damage. */
function surgeonChassisNote(
  attrs: Attributes,
  style: FightingStyle
): DesignReviewItem | undefined {
  if (style !== FightingStyle.AimedBlow || attrs.ST >= ARCHETYPE_DESIGN_BARS.AB_ST_VIABILITY)
    return undefined;
  return {
    axis: 'style',
    verdict: 'warn',
    id: 'v25-surgeon-chassis',
    title: 'Surgeon chassis',
    detail: `Strength ${attrs.ST} under ${ARCHETYPE_DESIGN_BARS.AB_ST_VIABILITY} — a low-strength aimed-blow surgeon still needs enough damage to finish.`,
  };
}

/** Archetypes whose win condition requires plate — the frame must carry it. */
const ARMOR_DEPENDENT: WinningArchetype[] = [
  'tankHybrid',
  'lowWillTankHybrid',
  'pureDefensive',
];

/** Encumbrance ceiling — an armor-dependent build that can't carry plate. */
function encumbranceCeilingNote(
  attrs: Attributes,
  top: NonNullable<ReturnType<typeof classifyArchetype>[number]>
): DesignReviewItem | undefined {
  const guide = WINNING_ARCHETYPES[top.archetype];
  const leadArmor = guide.armor.ids[0];
  if (!leadArmor || !ARMOR_DEPENDENT.includes(top.archetype)) return undefined;
  const loadout = {
    weapon: 'short_spear',
    armor: leadArmor,
    shield: 'none_shield',
    helm: 'leather_cap',
  };
  const capacity = computeEncumbranceCapacity(attrs.ST, attrs.CN);
  const weight = getLoadoutWeight(loadout);
  if (weight / capacity < 1.2) return undefined;
  return {
    axis: 'style',
    verdict: 'warn',
    id: 'v25-encumbrance-ceiling',
    title: 'Encumbrance ceiling',
    detail: `This frame carries ${capacity} — ${getItemById(leadArmor)?.name ?? leadArmor} plus a light loadout weighs ${weight} (over-encumbered). It cannot wear the armor its winning archetype wants.`,
  };
}

function reviewArchetype(attrs: Attributes, style: FightingStyle): DesignReviewItem[] {
  const fits = classifyArchetype(attrs, style);
  const top = fits[0];
  if (!top) return [];
  return [
    archetypeFitItem(fits),
    tankFrameNote(attrs, top),
    offensiveWitNote(attrs, top),
    riposteDeadBandNote(attrs, fits),
    bigHybridNote(attrs, top),
    surgeonChassisNote(attrs, style),
    encumbranceCeilingNote(attrs, top),
  ].filter((i): i is DesignReviewItem => i !== undefined);
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

  // Canon "Little damage" flag — damage class 1 is the named bottom rung on
  // the overview; the articles treat it as a real handicap outside scum.
  if (damage <= 1 && style !== FightingStyle.TotalParry) {
    items.push({
      axis: 'physicals',
      verdict: 'warn',
      title: 'Little damage',
      detail: 'Damage rating "Little" — canon flags this as a serious handicap; only dedicated scum builds shrug it off.',
    });
  }

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

function reviewWeapons(attrs: Attributes, style: FightingStyle): DesignReviewItem[] {
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

  const items: DesignReviewItem[] = [
    {
      axis: 'weapons',
      verdict,
      title: 'Weapon suitability',
      detail: `Well-suited now: ${names(met)} · within a couple trains: ${names(inReach)}.`,
    },
  ];

  // Deftness 11 is the weapon gate — most well-suited blades across the
  // styles ask DF 11; below it the rack narrows to daggers and oddities.
  if (attrs.DF < 11) {
    items.push({
      axis: 'weapons',
      verdict: 'info',
      title: 'Deftness 11 gate',
      detail: `Deftness ${attrs.DF} under the 11 gate — most style-suited weapons want DF 11+; below it the usable rack narrows sharply.`,
    });
  }

  return items;
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

  // Will dead-zone — the skill chart's big will breakpoints sit at 9/15/17/21;
  // 10–14 buys steady but minor yields, so the articles nudge designs toward
  // a named breakpoint instead of drifting mid-band.
  if (attrs.WL >= 10 && attrs.WL <= 14) {
    items.push({
      axis: 'trainability',
      verdict: 'info',
      title: 'Will dead zone',
      detail: `Will ${attrs.WL} sits between the named breakpoints (9/15/17/21) — minor per-point yields; either spend down to 9 or push to 15+.`,
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

/**
 * V23 — Arena-93 minimum-stat floors + Drake's rules. Advisory only: the
 * review informs the designer, it never blocks the build.
 */
function reviewMinimums(attrs: Attributes, style: FightingStyle): DesignReviewItem[] {
  const items: DesignReviewItem[] = [];
  const floors = STYLE_DESIGN_MINIMUMS[style] ?? {};
  const misses = (Object.entries(floors) as [keyof Attributes, number][]).filter(
    ([k, min]) => attrs[k] < min
  );
  if (misses.length > 0) {
    items.push({
      axis: 'style',
      verdict: 'warn',
      title: 'Below style minimums',
      detail: `${misses.map(([k, min]) => `${k} ${attrs[k]} < ${min}`).join(', ')} — under the Arena-93 minimum-stat floor for ${style} designs; the newsletters send these builds to the Dark Arena.`,
    });
  } else {
    items.push({
      axis: 'style',
      verdict: 'info',
      title: 'Style minimums met',
      detail: 'Clears the Arena-93 minimum-stat floor for this style.',
    });
  }
  // Drake's Dark-Arena rejection rule — unconditional per-stat check, any
  // style. Each breached stat gets its own flag (V24 canon: ST and WL must
  // never drop below 7).
  if (attrs.ST < DA_ST_FLOOR) {
    items.push({
      axis: 'longevity',
      verdict: 'warn',
      title: 'Dark Arena rejection',
      id: 'st-floor',
      detail: `ST ${attrs.ST} < ${DA_ST_FLOOR} — Drake's rule sends this build to the Dark Arena rather than waste a roster slot; a DOA roll.`,
    });
  }
  if (attrs.WL < DA_WL_FLOOR) {
    items.push({
      axis: 'longevity',
      verdict: 'warn',
      title: 'Dark Arena rejection',
      id: 'wl-floor',
      detail: `WL ${attrs.WL} < ${DA_WL_FLOOR} — Drake's rule sends this build to the Dark Arena rather than waste a roster slot; a DOA roll.`,
    });
  }
  // Drake's rollup-first method — a fixed allocation order beats dribbling
  // points across the sheet. Advisory once, always.
  items.push({
    axis: 'trainability',
    verdict: 'info',
    title: 'Rollup-first allocation',
    detail:
      'Drake\'s rollup method: decide the stat order, pour points into each stat until it hits its target, then move on — dribbling points across the sheet produces mediocre builds.',
  });
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

/**
 * V24 canon (Consortium Q&A / Arena 93 doctrine): weapon-access tiers,
 * low-burn style steering, and the stat-breakpoint dossier. Advisory
 * flags — they inform the designer, never block the build.
 */
function reviewDoctrine(attrs: Attributes, style: FightingStyle): DesignReviewItem[] {
  const items: DesignReviewItem[] = [];

  // DF 11 is the weapon-access boundary: below it the arsenal collapses to
  // daggers and light clubs; at/above it the real weapons unlock.
  if (attrs.DF < 11) {
    items.push({
      axis: 'weapons',
      verdict: 'warn',
      title: 'Crippled weapon tier',
      id: 'df-weapon-tier',
      detail: `DF ${attrs.DF} < 11 — the crippled weapon tier: most worthwhile weapons demand DF 11+, so this build is fenced into the light arsenal.`,
    });
    // Jalopy: the dagger is only fully suited to ST/AB — a build fenced into
    // the light tier on another style loses the one fully-favored option.
    if (style !== FightingStyle.StrikingAttack && style !== FightingStyle.AimedBlow) {
      items.push({
        axis: 'weapons',
        verdict: 'info',
        title: 'Dagger tier favors strikers and aimers',
        id: 'dagger-style-fit',
        detail: `Fenced into the light arsenal on ${style} — Jalopy rates the dagger fully suited only to ST/AB; this build's best-fitting small weapon is second-tier.`,
      });
    }
  }

  // Low-burn steering (Consortium): a build with a very low speed ceiling
  // can't sustain an offensive activity burn — it belongs on the patient
  // styles (PR/PS/AB/TP/ST) that win on defense or precision.
  if (attrs.SP <= LOW_BURN_SP_MAX) {
    const family = STYLE_FAMILY[style];
    if (LOW_BURN_STYLES.includes(style)) {
      items.push({
        axis: 'style',
        verdict: 'info',
        title: 'Low-burn style fit',
        id: 'low-burn-fit',
        detail: `SP ${attrs.SP} marks a low-burn build — ${style} tolerates the slow pace; the Consortium steers these rolls to PR/PS/AB/TP/ST.`,
      });
    } else if (family === 'offensive') {
      items.push({
        axis: 'style',
        verdict: 'warn',
        title: 'Low-burn style mismatch',
        id: 'low-burn-mismatch',
        detail: `SP ${attrs.SP} marks a low-burn build — ${style} burns endurance it can't feed; the Consortium steers these rolls to PR/PS/AB/TP/ST.`,
      });
    } else {
      // Mixed styles run a defensive engine — the wall corpus canonizes
      // speed-poor frames ("speed is a luxury", wasted-points notes on PL),
      // so a low-burn roll is no reason to reject them.
      items.push({
        axis: 'style',
        verdict: 'info',
        title: 'Low-burn build',
        id: 'low-burn-fit',
        detail: `SP ${attrs.SP} marks a low-burn build — ${style}'s defensive engine tolerates the slow pace; the wall corpus canonizes speed-poor frames.`,
      });
    }
  }

  // Breakpoint dossier — the canon stat rungs managers design around.
  const rungs: [keyof Attributes, number, string][] = [
    ['WT', 11, 'breakpoint-wt-11'],
    ['WT', 13, 'breakpoint-wt-13'],
    ['WT', 17, 'breakpoint-wt-17'],
    ['WL', 15, 'breakpoint-wl-15'],
    ['WL', 17, 'breakpoint-wl-17'],
    ['WL', 21, 'breakpoint-wl-21'],
  ];
  if (style === FightingStyle.AimedBlow) {
    rungs.push(
      ['DF', 17, 'breakpoint-df-ab-17'],
      ['DF', 21, 'breakpoint-df-ab-21']
    );
  }
  for (const [stat, rung, id] of rungs) {
    if (attrs[stat] >= rung) {
      items.push({
        axis: 'trainability',
        verdict: 'info',
        title: `${stat} ${rung} breakpoint`,
        id,
        detail: `${stat} ${attrs[stat]} reaches the canon ${rung} breakpoint rung — the newsletter breakpoint tables pay out here.`,
      });
    }
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
    ...reviewArchetype(attrs, style),
    ...reviewPhysicals(attrs, style),
    ...reviewWeapons(attrs, style),
    ...reviewTrainability(attrs, style),
    ...reviewMinimums(attrs, style),
    ...reviewDoctrine(attrs, style),
    ...reviewLongevity(attrs, style),
  ];
}
