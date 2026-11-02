/**
 * Stable Lords — Fighter Concepts
 *
 * Long-term fighter concepts ported from the Arena 93 newsletters — the
 * canonical per-style builds managers used on Noblish Island. Each concept
 * preserves the original stat spread (`canonStats`, the Duel2 ~84-point
 * budget) alongside a scaled 70-point spread (`stats`) for in-game use.
 *
 * Source: Duel2 Arena 93 — "Long Term Fighter Concepts", Gavin Rule,
 * mgr Faux Tides (1482).
 */

import {
  FightingStyle,
  ATTRIBUTE_KEYS,
  ATTRIBUTE_MIN,
  ATTRIBUTE_MAX,
  ATTRIBUTE_TOTAL,
  type Attributes,
} from '@/types/shared.types';

/**
 * Defines the shape of fighter concept.
 */
export interface FighterConcept {
  /** Short concept label, e.g. "The Ghost". */
  name: string;
  /** Canonical newsletter spread (original ~84-point Duel2 budget). */
  canonStats: Attributes;
  /** Spread scaled to ATTRIBUTE_TOTAL for in-game use. */
  stats: Attributes;
  /** Manager commentary adapted from the newsletter. */
  notes: string;
  /** Tactic guidance (offense/defense) from the newsletter. */
  tactics: string;
}

/**
 * Defines the shape of style concept guide.
 */
interface StyleConceptGuide {
  /** Style overview — philosophy and suited tactics. */
  doctrine: string;
  /** Canonical long-term builds for the style. */
  concepts: FighterConcept[];
}

/**
 * Proportionally scales an attribute spread to an exact point budget,
 * preserving rank order. Floor-then-largest-remainder rounding, clamped to
 * [ATTRIBUTE_MIN, ATTRIBUTE_MAX]; ties break in ATTRIBUTE_KEYS order so the
 * output is fully deterministic.
 */
/** Attribute tie-break rank — index in ATTRIBUTE_KEYS for stable ordering. */
const KEY_RANK = new Map(ATTRIBUTE_KEYS.map((k, i) => [k, i]));

const rankOf = (k: keyof Attributes): number => KEY_RANK.get(k) ?? 0;

/**
 * Proportionally scales an attribute spread to an exact point budget,
 * preserving rank order. Floor-then-largest-remainder rounding, clamped to
 * [ATTRIBUTE_MIN, ATTRIBUTE_MAX]; ties break in ATTRIBUTE_KEYS order so the
 * output is fully deterministic.
 */
export function scaleToAttributeBudget(
  spread: Attributes,
  budget = ATTRIBUTE_TOTAL
): Attributes {
  const total = ATTRIBUTE_KEYS.reduce((s, k) => s + spread[k], 0);
  if (total === budget) return { ...spread };

  const out = {} as Attributes;
  const remainder = {} as Record<keyof Attributes, number>;
  let used = 0;
  for (const key of ATTRIBUTE_KEYS) {
    const exact = (spread[key] * budget) / total;
    out[key] = Math.max(ATTRIBUTE_MIN, Math.floor(exact));
    remainder[key] = exact - Math.floor(exact);
    used += out[key];
  }

  // Largest-remainder rounding: keys sorted once by fractional part, then
  // walked round-robin so distribution stays deterministic without
  // re-sorting inside the adjustment loops.
  let need = budget - used;
  if (need > 0) {
    const order = [...ATTRIBUTE_KEYS].sort(
      (a, b) => remainder[b] - remainder[a] || rankOf(a) - rankOf(b)
    );
    for (let i = 0; need > 0 && i < order.length * 30; i++) {
      const key = order[i % order.length];
      if (key !== undefined && out[key] < ATTRIBUTE_MAX) {
        out[key]++;
        need--;
      }
    }
  } else if (need < 0) {
    const order = [...ATTRIBUTE_KEYS].sort(
      (a, b) => remainder[a] - remainder[b] || rankOf(a) - rankOf(b)
    );
    for (let i = 0; need < 0 && i < order.length * 30; i++) {
      const key = order[i % order.length];
      if (key !== undefined && out[key] > ATTRIBUTE_MIN) {
        out[key]--;
        need++;
      }
    }
  }
  return out;
}

const concept = (
  name: string,
  canonStats: Attributes,
  notes: string,
  tactics: string
): FighterConcept => ({
  name,
  canonStats,
  stats: scaleToAttributeBudget(canonStats),
  notes,
  tactics,
});

/**
 * Fighter concepts for every FightingStyle — keyed by the enum (not display
 * name) so a new style fails typecheck until its guide is written.
 */
export const FIGHTER_CONCEPTS: Record<FightingStyle, StyleConceptGuide> = {
  [FightingStyle.AimedBlow]: {
    doctrine:
      'Hits unprotected spots with precision. Not overly active and primarily offensive. Suited to every offensive tactic except decisiveness; defensively, dodge and parry.',
    concepts: [
      concept(
        'All-Around Aimer',
        { ST: 11, CN: 12, SZ: 9, WT: 17, WL: 15, SP: 5, DF: 15 },
        'The basic all-around aimed-blow. Deftness covers the full favored-weapon list; speed is no factor here. Wit keeps the learning curve steep and Will makes early stat trains easy. Moderate activity, low-to-mid kill desire, moderate-to-high offensive effort.',
        'Fight clean — no tactics needed. If forced onto defense, parry. Offensive tactics only with advance scouting: lunge against parry styles, slash against lungers.'
      ),
      concept(
        'Ironhide Marksman',
        { ST: 9, CN: 14, SZ: 5, WT: 18, WL: 16, SP: 4, DF: 17 },
        'Smaller and tougher — size and damage traded for more wit and deftness. High constitution means he shrugs off what lands and drills holes in return.',
        'Same as the all-around build: parry when pressed, targeted offense otherwise.'
      ),
    ],
  },
  [FightingStyle.BashingAttack]: {
    doctrine:
      'Pressures the foe with initiative and hits hard enough to penetrate defense with superior attack. Compatible with bash and decisiveness tactics; no defensive tactics.',
    concepts: [
      concept(
        'Fast Learner',
        { ST: 13, CN: 5, SZ: 9, WT: 19, WL: 17, SP: 7, DF: 14 },
        'High will buys quick stat trains and shores up endurance over a low constitution. He learns fast — combined with deftness that yields a strong attack rating, with decisiveness and initiative right behind to pound the foe across the sands.',
        'Bash or decisiveness — keep the pressure on.'
      ),
      concept(
        'Workhorse',
        { ST: 13, CN: 14, SZ: 9, WT: 17, WL: 15, SP: 5, DF: 11 },
        'Enough constitution to take a beating even when he loses the jump. Heavier armor and deep endurance keep him swinging long after the foe has fallen. Fighters with few weaknesses fare better long-term than godlings, on average.',
        'Bash or decisiveness.'
      ),
    ],
  },
  [FightingStyle.LungingAttack]: {
    doctrine:
      'Keeps moving — high activity. For an offensive style, surprisingly good at dodging when built right. Quick and powerful. Lunge is the signature; decisiveness only moderate. Dodge works well, riposte possibly.',
    concepts: [
      concept(
        'Scrapper',
        { ST: 11, CN: 13, SZ: 4, WT: 17, WL: 15, SP: 13, DF: 11 },
        'Small size limits carry capacity and damage, but wit holds the initiative lead and sharpens the attack. Endurance plus speed lets him dodge around for a shot, take some blows, and stay fully offensive without falling over.',
        'Lunge once committed; dodge while waiting for the window.'
      ),
      concept(
        'Heavy Spear',
        { ST: 15, CN: 10, SZ: 9, WT: 15, WL: 15, SP: 7, DF: 13 },
        'More average except the high strength for crippling blows — every weapon in reach except the epee, which would waste the strength. Purely offensive, trading the Scrapper\'s defensive edge for damage.',
        'Lunge — commit to the attack.'
      ),
    ],
  },
  [FightingStyle.ParryLunge]: {
    doctrine:
      'Much like the lunger but favors parry over dodge, and defense first. Offensive tactics are still mainly lunge. Defensively best suited to parry and responsiveness; riposte works okay and dodge, though unsuited, can work.',
    concepts: [
      concept(
        'All-Around Fencer',
        { ST: 11, CN: 12, SZ: 9, WT: 16, WL: 16, SP: 7, DF: 13 },
        'All-around capable stats for an all-around capable fighter — this setup uses parry best. He may take time to develop and to figure out how he likes to fight.',
        'Parry and responsiveness; lunge for offense.'
      ),
      concept(
        'Prodigy',
        { ST: 11, CN: 11, SZ: 6, WT: 18, WL: 19, SP: 10, DF: 11 },
        'Small size helps defense; damage is the weakest point. Learns quickly — once stat trains push toward 15s he becomes a very serious competitor. Until then, a careful challenge strategy keeps him alive.',
        'Parry first, lunge second.'
      ),
    ],
  },
  [FightingStyle.ParryRiposte]: {
    doctrine:
      'Uses superior riposte to steal the initiative and strike while the foe is off balance. Well suited to the lunge tactic, less so slash, terribly to bash and decisiveness. Defensively riposte and parry; dodge and responsiveness poorly.',
    concepts: [
      concept(
        'Webweaver',
        { ST: 9, CN: 11, SZ: 6, WT: 19, WL: 18, SP: 6, DF: 15 },
        'Centered on parry: high wit plus the style\'s riposte strength weaves a tight defensive web. Will is great for later stat trains and pairs with constitution for endurance. Deftness props up the riposte\'s lower attack rating and unlocks the epee.',
        'Parry, then riposte.'
      ),
      concept(
        'Quicksilver',
        { ST: 11, CN: 9, SZ: 5, WT: 17, WL: 15, SP: 14, DF: 13 },
        'Riposte is a fast counterstrike — added speed focuses the natural riposte ability so he often answers before the opponent swings. Strength covers large weapons like the longsword.',
        'Riposte, lunge.'
      ),
    ],
  },
  [FightingStyle.ParryStrike]: {
    doctrine:
      'Quick fighters who assure defense first and worry about attack second. Like strikers — fast and powerful — but they conserve endurance better than expected. Decisiveness well suited offensively; parry and responsiveness defensively, riposte workable. They hold their ground — dodge is poor.',
    concepts: [
      concept(
        'Counter Guard',
        { ST: 9, CN: 9, SZ: 6, WT: 17, WL: 19, SP: 9, DF: 15 },
        'Defense-first build centered on parry ability. Speed kept for coordination; strength is lower than ideal with the small size, but the high will makes that an easy train.',
        'Parry and responsiveness; decisiveness on offense.'
      ),
      concept(
        'Reactive Striker',
        { ST: 12, CN: 9, SZ: 5, WT: 17, WL: 15, SP: 14, DF: 13 },
        'Very responsive with a workable riposte. The higher strength opens lunger weapons such as the longsword.',
        'Round plan: responsiveness first, parry second, riposte third, then go offensive.'
      ),
    ],
  },
  [FightingStyle.SlashingAttack]: {
    doctrine:
      'Can penetrate parry with superior attack when deftness is high. Needs consistency and few mistakes. A very offensive style, suited to the slash tactic only.',
    concepts: [
      concept(
        'Glass Reaper',
        { ST: 11, CN: 6, SZ: 6, WT: 19, WL: 15, SP: 10, DF: 17 },
        'Lacks defensive skills and cannot always land the first shot — decisive fighters are his bane, though he eats lungers. High wit and deftness build a strong attack; speed keeps initiative control. Heavier armor for the first few fights until skills come online, less so against parry styles.',
        'Slash only.'
      ),
      concept(
        'Juggernaut',
        { ST: 11, CN: 15, SZ: 6, WT: 15, WL: 17, SP: 5, DF: 15 },
        'The tougher build wins more long-term: he does not need the first shot, wears stout armor without trouble, and goes all out on great endurance. Hard to take down while he slices — an excellent long-term slasher with a good skill base and easy stat trains.',
        'Slash only.'
      ),
    ],
  },
  [FightingStyle.StrikingAttack]: {
    doctrine:
      'Fast and decisive — designed around decisiveness to land the first shot. Decisiveness is the only suited offensive tactic; responsiveness if anything defensively.',
    concepts: [
      concept(
        'Offense Hunter',
        { ST: 11, CN: 10, SZ: 6, WT: 19, WL: 13, SP: 11, DF: 15 },
        'A sub-style against the trend — hunts other offensive styles rather than high-constitution targets. Deftness backs the attack rating with great wit behind it; speed helps decisiveness and initiative. Modest damage, but most offensives carry little constitution anyway.',
        'Decisiveness; responsiveness can frustrate opposing strikers and bashers.'
      ),
      concept(
        'Classic Striker',
        { ST: 15, CN: 5, SZ: 9, WT: 17, WL: 15, SP: 7, DF: 15 },
        'The traditional striker — uses the style\'s decise advantage and a good wit to stay ahead of other styles. Deftness adds attack because the first shot has to count with low constitution. Strength is high for great damage and nearly any weapon. Endurance is the weak point: he has to end it quick.',
        'Decisiveness only.'
      ),
    ],
  },
  [FightingStyle.TotalParry]: {
    doctrine:
      'Entirely defense — attacks only as an afterthought once defense is assured. Many combinations work depending on how much offense is wanted and which defense is favored. Best at parry but able to use all defensive tactics; effectiveness depends on strategy and opponent. Offensive tactics lower the defense — use with care.',
    concepts: [
      concept(
        'The Ghost',
        { ST: 5, CN: 10, SZ: 3, WT: 19, WL: 15, SP: 13, DF: 19 },
        'An extreme build: insane parry, tiny size, good speed — near impossible to hit. Carries only his weapon and needs nothing more; damage is negligible and that is fine for this setup. High deftness and speed feed a solid riposte that lands where aimed. A more exciting version of scum, still long-term capable.',
        'Responsiveness against very decisive fighters, otherwise parry. Around round three, try some riposte.'
      ),
    ],
  },
  [FightingStyle.WallOfSteel]: {
    doctrine:
      'The all-around style — good defense with equal offense, rarely fast. Parries until it gains the initiative, then strikes powerfully. Defensive tactics include parry and some riposte; offensively bash and slash work well, depending on the weapon.',
    concepts: [
      concept(
        'Aegis',
        { ST: 11, CN: 10, SZ: 7, WT: 19, WL: 15, SP: 5, DF: 17 },
        'Defensive version heavy on parry. Strength grows later; for now wit secures an incredible parry, attack, and initiative skill base. Fights like an aimed-blow: low kill desire, low-to-moderate activity, moderate offensive effort.',
        'Parry; bash or slash once the initiative is held.'
      ),
      concept(
        'Bruiser',
        { ST: 13, CN: 16, SZ: 9, WT: 15, WL: 17, SP: 3, DF: 11 },
        'Offensive version — strength develops over time and speed eventually must rise to avoid clumsiness. High constitution absorbs nearly anything and sustains full offense indefinitely; he can wear pretty much any armor without a problem.',
        'Parry early, then bash or slash.'
      ),
    ],
  },
};

const MEAN_CACHE = new Map<FightingStyle, Attributes>();

/**
 * Mean scaled spread across a style's concepts — the style's canonical
 * center of gravity. Used to weight AI recruit generation and to derive the
 * style's primary attribute. Memoized; the returned object is shared, so
 * consumers must not mutate it.
 */
export function conceptMean(style: FightingStyle): Attributes {
  let mean = MEAN_CACHE.get(style);
  if (!mean) {
    const concepts = FIGHTER_CONCEPTS[style].concepts;
    mean = {} as Attributes;
    for (const key of ATTRIBUTE_KEYS) {
      mean[key] = concepts.reduce((s, c) => s + c.stats[key], 0) / concepts.length;
    }
    MEAN_CACHE.set(style, mean);
  }
  return mean;
}

/**
 * The style's primary attribute — argmax of the mean concept spread, with
 * ties broken in ATTRIBUTE_KEYS order (deterministic).
 */
export function conceptPrimaryAttr(style: FightingStyle): keyof Attributes {
  const mean = conceptMean(style);
  return ATTRIBUTE_KEYS.reduce((best, k) => (mean[k] > mean[best] ? k : best), 'ST');
}
