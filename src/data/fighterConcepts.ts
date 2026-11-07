/**
 * Stable Lords — Fighter Concepts
 *
 * Long-term fighter concepts ported from the Arena 93 newsletters — the
 * canonical per-style builds managers used on Noblish Island. Each concept
 * preserves the original stat spread (`canonStats`, the Duel2 ~84-point
 * budget) alongside a scaled 70-point spread (`stats`) for in-game use.
 *
 * Sources:
 *   Duel2 Arena 93 — "Long Term Fighter Concepts", Gavin Rule,
 *     mgr Faux Tides (1482).
 *   Duel2 Arena 93 — "How to Build a Better Warrior (version Y2K)",
 *     Neon Necromancer (the "Broke Stroker", "Scimitar Adept", and
 *     "Low-Will Wonder" redesigns).
 *   Duel2 Arena 93 striker articles — Assur's "Striker Guide",
 *     Blind Man's "Brainy Low-Will Strikers", Sir Boyd's "The Striking
 *     Style", Talon's "Strikers R Us", Tex's "Yet Another Striker
 *     Article", and the Crimson Strategist's "Crimson Strikers".
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
      concept(
        'Broke Stroker',
        { ST: 10, CN: 10, SZ: 10, WT: 15, WL: 15, SP: 11, DF: 13 },
        'The legendary redesign: wit and will high enough for a viable long-term warrior. Starts well-suited to the short spear and sits one strength train from longsword suitability. Enough con to take a hit — good damage likely arrives with the first strength train, if not on the original overview.',
        'Lunge — commit to the attack.'
      ),
    ],
  },
  [FightingStyle.ParryLunge]: {
    doctrine:
      'The parry-lunger is an attack god waiting to be born — arguably the most diverse style in the game, fielding the scimitar, the dodge, and the lunge-decise pairing all at once. Design for damage first (normal or better), then wit and will 15-21 for attack, learning, and endurance; deftness 11+ feeds attack, parry, and defense together, and 15 unlocks the epee. Constitution is the flex stat — the armor-piercing build runs it at 5 and clings to life by luck — while speed is nearly free: initiative and parry come from wit and deftness, not a lunger mimic\'s legs. Armor at or under encumbrance; an offhand weapon over a shield for a dodge-leaning defense. Defensively dodge is king, parry is honest early work, and both fade from the sheet as skills mature — drop the tactics after Expert and let the natural tools run. Hunts strikers, pikers, rippers, and slashers; stays away from lungers and bashers while young, and respects them forever after. A fragile, high-work style that rewards attention — never an autopilot pick.',
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
      concept(
        'Armor-Piercer',
        { ST: 11, CN: 5, SZ: 8, WT: 21, WL: 17, SP: 5, DF: 17 },
        'The article\'s perfect spread — 21 wit and 17 deftness build a massive, pinpoint attack that renders defensive openings fruitless. Five constitution means he clings to life by luck and trains nothing but skills from fight one. Not for the weak of heart.',
        'Longsword with an offhand; aim head. Walls up minute 1, then hunts at 9-9-7. Spastic 10-10-10 desperation.'
      ),
      concept(
        'First Graduate',
        { ST: 10, CN: 10, SZ: 9, WT: 17, WL: 17, SP: 4, DF: 17 },
        'Tripwire\'s first listed graduate — a VL/HI favorite rhythm behind the scimitar. Balanced physicals and max-deftness skills are the versatile template: nothing wasted, every tool live.',
        'Scimitar; very low effort, high activity; dodge on defense.'
      ),
      concept(
        'Two-Time Televised',
        { ST: 11, CN: 12, SZ: 7, WT: 21, WL: 15, SP: 5, DF: 13 },
        'Tripwire\'s strategy example and two-time tourney victor — slow on paper (9/8/13/5/8/6) but the dodge covers it. Attack and dodge, keep the initiative and riposte, and stay at or under encumbrance.',
        'HI/HI rhythm, longsword; open moderate-high with dodge, bleed to low effort late.'
      ),
      concept(
        'Parry Adept',
        { ST: 11, CN: 9, SZ: 8, WT: 17, WL: 15, SP: 9, DF: 15 },
        'A one-time TV whose favorite tactic was parry — proof the style\'s natural parry is real even when dodge leads the plan. Higher speed than most parry-lungers carry.',
        'Scimitar; high-high with parry while young, tactic-free once skills mature.'
      ),
      concept(
        'Dodge Adept',
        { ST: 9, CN: 13, SZ: 10, WT: 21, WL: 15, SP: 5, DF: 11 },
        'A one-time TV built around a dodge favorite at minimum deftness — 21 wit does the learning while 13 constitution keeps him upright. Very low effort, high activity.',
        'Shortsword; VL/HI with the dodge tactic until defense reaches Expert.'
      ),
      concept(
        'Endless Engine',
        { ST: 7, CN: 11, SZ: 13, WT: 17, WL: 21, SP: 4, DF: 11 },
        'The 21-will graduate: a MO/HI favorite who simply never tires. Minimal strength means damage comes late — he outlasts instead, parrying through the middle minutes.',
        'Short spear; moderate-high rhythm with parry; wins on endurance.'
      ),
      concept(
        'Low-Effort Razor',
        { ST: 9, CN: 13, SZ: 10, WT: 15, WL: 15, SP: 7, DF: 15 },
        'The LO/VH graduate — lowest wit of the set, so 15 deftness carries the accuracy. Runs at almost no offensive effort while activity stays at the top of the range.',
        'Longsword; very low effort, very high activity; let the blade do the work.'
      ),
      concept(
        'Pocket Fencer',
        { ST: 10, CN: 12, SZ: 5, WT: 17, WL: 21, SP: 8, DF: 11 },
        'The compact scimitar graduate — size 5 bankrolls 21 will and a LO/MO favorite rhythm. Defense points come free from the tiny frame; the will engine does the rest.',
        'Scimitar; low-moderate; dodge behind the small profile.'
      ),
      concept(
        "Assur's Outlier",
        { ST: 21, CN: 12, SZ: 7, WT: 17, WL: 9, SP: 7, DF: 11 },
        'Assur\'s lone TV parry-lunger — a 21-strength brawler who fits no model and graduated anyway. Proof the style tolerates damage-first frames Tripwire never recommended.',
        'Anything heavy; moderate rhythm; hits hard enough to end it early.'
      ),
    ],
  },
  [FightingStyle.ParryRiposte]: {
    doctrine:
      'Uses superior riposte to steal the initiative and strike while the foe is off balance. Design for damage first — a ripper who cannot hurt what he parries loses anyway — then carrying capacity, hit points, and parry skills. Both hybrids and scum-leaning builds graduate. Scimitar and longsword are the staples, epee and shortsword for the deft, short spear and long spear for low-wit recruits; keep armor light within carrying capacity. Find each warrior\'s own rhythm — start near 4-6 OE/AL and experiment — with lunge-or-nothing offensively and parry/riposte defensively. Rippers hunt strikers and scum, die to aimed blows, and find slashers a tough out. Well suited to the lunge tactic, less so slash, terribly to bash and decisiveness. Defensively riposte and parry; dodge and responsiveness poorly.',
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
      concept(
        'Daydream',
        { ST: 17, CN: 14, SZ: 4, WT: 17, WL: 7, SP: 8, DF: 17 },
        'Assur\'s "best Parry Riposte ever" (Duelmasters Dog Brother): a scum-leaning frame whose 17 strength guarantees the damage rating rippers live or die by. High wit and deftness feed the parry game; will runs cheap once constitution covers endurance.',
        'Low-moderate rhythm; scimitar or epee; parry, then riposte.'
      ),
      concept(
        'Consortium Hybrid',
        { ST: 21, CN: 8, SZ: 11, WT: 21, WL: 7, SP: 3, DF: 13 },
        'Assur\'s favorite design — "use again without hesitation". Maxed strength and wit buy damage and parry skills while size carries the hit points will cannot. Speed is nearly bottomed out; the riposte does the answering.',
        'Lunge when a lane opens; parry/riposte behind light armor.'
      ),
      concept(
        'Freshman Scum',
        { ST: 17, CN: 15, SZ: 10, WT: 6, WL: 21, SP: 4, DF: 11 },
        'The classic scum ripper: will does the heavy lifting for endurance and stat trains while wit stays cheap. Never quick, rarely clever — he wins on damage, hit points, and a wall of parry.',
        'Minimal effort; riposte on the counter.'
      ),
      concept(
        'The Art',
        { ST: 9, CN: 7, SZ: 7, WT: 21, WL: 13, SP: 6, DF: 21 },
        'Blackhawk\'s "perfect" ripper spends everything on wit and deftness — the two stats that drive parry and riposte skills — then trains strength up behind them. Fragile early, lethal once the skills arrive.',
        'Epee or shortsword; high activity, low effort; riposte first.'
      ),
      concept(
        'Necrom\'s Paragon',
        { ST: 9, CN: 4, SZ: 5, WT: 17, WL: 21, SP: 11, DF: 17 },
        'The textbook "perfect" spread: tiny frame, huge will, elite wit and deftness — epee-capable out of the gate. Constitution is the glaring hole; protect him until stat trains close it.',
        'Epee; riposte and parry; train ST and CN early.'
      ),
      concept(
        'Thror\'s Lesson',
        { ST: 15, CN: 10, SZ: 9, WT: 15, WL: 15, SP: 6, DF: 14 },
        'Necrom\'s real ripper — the cautionary tale. Solid across the board but nothing elite; the early stat trains (ST, then WT) decided whether he graduated. Rippers live and die by damage output.',
        'Scimitar; parry/riposte; train ST before chasing skills.'
      ),
      concept(
        'Fantasy Duelist',
        { ST: 11, CN: 11, SZ: 11, WT: 15, WL: 15, SP: 6, DF: 15 },
        'Palinc\'s dual-wield survivor: even stats let him carry a main-gauche off-hand without starving either skill line. Average everywhere is fine when the riposte is doing the talking.',
        'Two weapons — scimitar plus an off-hand; moderate rhythm.'
      ),
      concept(
        'Dawnrain',
        { ST: 9, CN: 13, SZ: 5, WT: 15, WL: 17, SP: 8, DF: 17 },
        'Jorja\'s Tailida — the little-damage lesson made flesh. Deft enough for any weapon and will to spare, but 9 strength on a small frame means every riposte lands softly; the published fix was training ST toward 14.',
        'Low/moderate rhythm; epee or scimitar; parry-heavy early.'
      ),
      concept(
        'Scovellie',
        { ST: 9, CN: 13, SZ: 8, WT: 17, WL: 17, SP: 5, DF: 15 },
        'Cadmus\'s basic ripper: balanced wit, will, and deftness on a mid-size frame. The (ST+CN)×WL endurance math comes out respectable — the baseline every serious ripper design is measured against.',
        'Moderate effort; scimitar; riposte the counter.'
      ),
      concept(
        'Santee',
        { ST: 13, CN: 7, SZ: 14, WT: 17, WL: 15, SP: 8, DF: 10 },
        'The size-14 outlier who proved big rippers graduate: the frame carries hit points and damage the classic builds lack, at the cost of deftness. Jorja ran him moderate/moderate and charted a slash favorite.',
        'Longsword; moderate/moderate rhythm; slash on the riposte.'
      ),
    ],
  },
  [FightingStyle.ParryStrike]: {
    doctrine:
      'The hardest style to win with — and the most flexible. Pikers fight above their skill sheet, conserve endurance well, and pivot between offense and defense better than any style. Wit is the keystone (17-21 canon), deftness second; average numbers make the worst style worse, so design to an extreme. The longsword and scimitar are the staple blades; damage matters more than the low starting skills suggest. Run 9-10 or 10-10 — decisiveness offensively, parry and responsiveness defensively — and expect luck to matter: pikers see bonused and cursed skills more often than any style. They hold their ground — dodge is poor.',
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
      concept(
        "Assur's Champion",
        { ST: 12, CN: 7, SZ: 7, WT: 21, WL: 21, SP: 5, DF: 11 },
        'Assur\'s DYO-type Tournament Champion — proof the worst style can take the biggest prize. Wit and will both maxed for learning; eleven deftness was the only number that mattered after wit.',
        'ALE/L or no armor on a fast frame; 9-10 or 10-10, decisiveness throughout.'
      ),
      concept(
        'Quiet Qualifier',
        { ST: 17, CN: 12, SZ: 4, WT: 21, WL: 7, SP: 12, DF: 11 },
        'Doesn\'t look like anything special, yet TV\'d for Assur — the counterpoint to the godling trap. A sturdy frame carried APA/F plate through the qualifier run.',
        '10-10 decisiveness; heavy armor affordable behind CN 12.'
      ),
      concept(
        'The False Godling',
        { ST: 15, CN: 5, SZ: 10, WT: 21, WL: 17, SP: 5, DF: 11 },
        'Near-perfect on paper and completely mediocre in tournaments — Assur\'s cautionary tale. It learns attack naturally, rolled well, and still failed. With pikers, great stats do not ensure success.',
        '10-10 decisiveness; longsword or scimitar.'
      ),
      concept(
        'Eleven-Wit Scum',
        { ST: 15, CN: 16, SZ: 5, WT: 11, WL: 21, SP: 5, DF: 11 },
        'Assur\'s scum-piker addendum — TV\'d rookies and graduated 19-3. His failed scum versions ran 3-7 wit; the one feature that separated this success was eleven wit. Constitution and will do the tank\'s work.',
        'Slow it down for scum matchups; parry and responsiveness behind armor.'
      ),
      concept(
        "Priest's Edge",
        { ST: 15, CN: 7, SZ: 11, WT: 17, WL: 16, SP: 7, DF: 11 },
        'The Priest\'s strength-led rollup — when ST runs high and DF low, the piker fights like a striker: get the first, and only, blow in.',
        'Offensive plan: 10-10-10 decisiveness all the way through, even in desperation.'
      ),
      concept(
        "Priest's Guard",
        { ST: 11, CN: 7, SZ: 10, WT: 17, WL: 17, SP: 7, DF: 15 },
        'The Priest\'s deftness-led rollup — when DF runs high and ST low, speed benefits the ability to move in reaction to the opponent.',
        'Defensive plan: responsiveness minute one, decisiveness from minute two, responsiveness in desperation.'
      ),
      concept(
        'Shell Piker',
        { ST: 17, CN: 18, SZ: 17, WT: 3, WL: 16, SP: 6, DF: 7 },
        'Assur forcing a hopeless roll-up into a style — low wit and deftness made offense impossible, so the choice came down to eleven deftness or hit points. He chose hit points: a size-17, CN-18 mountain that simply refuses to fall.',
        'Minimal effort; let armor and hit points do the work.'
      ),
      concept(
        'Easy Design',
        { ST: 10, CN: 13, SZ: 12, WT: 21, WL: 9, SP: 6, DF: 13 },
        'The easiest piker in the Pikers article — twenty-one wit is clear, nine will, eleven-plus deftness, the leftover points to strength. A learner built to outgrow the style\'s weak starting skills.',
        'Decisiveness offensively; let wit buy the skills the style lacks.'
      ),
      concept(
        'Burning Piker',
        { ST: 13, CN: 8, SZ: 16, WT: 5, WL: 19, SP: 14, DF: 9 },
        'A strange hybrid burner — a lunger-shaped roll-up forced into a piker. Nineteen will for the two-train burn to twenty-one, nine deftness for the breakpoint; after burns he reads 15-10-16-7-21-14-11 behind a battle axe.',
        'Battle axe; moderate rhythm; burn the trains early.'
      ),
      concept(
        'Wit Burn',
        { ST: 7, CN: 9, SZ: 9, WT: 16, WL: 20, SP: 13, DF: 10 },
        'The exciting alternative to the solid 17-17-11 spread — sixteen wit, twenty will, thirteen speed; burns to 9-10-9-17-21-13-11 and learns everything the style refuses to start with.',
        'Decisiveness offensively; light armor, quick tempo.'
      ),
      concept(
        'Attack Cutter',
        { ST: 17, CN: 4, SZ: 8, WT: 15, WL: 11, SP: 12, DF: 17 },
        'Low constitution screams pure offensive, so Assur maxed attack skills at creation and counted on natural learning to deliver the decisiveness.',
        '10-10 decisiveness; strike first — the tank is too thin for the long fight.'
      ),
    ],
  },
  [FightingStyle.SlashingAttack]: {
    doctrine:
      'A finesse offense — attack and initiative over defense, but it burns endurance fast, so win early or fade. The scimitar is the cornerstone blade: a design that cannot reach ST 9, WT 11, DF 11 within a couple of trains is better run as a striker; shortsword, hatchet, broadsword, battle axe, longsword, great axe, and epee all suit. Stack wit, will, and deftness — keep size small and constitution cheap, and never spend on speed. Run high offensive effort while the arms last, let activity collapse low by mid-bout, and slash only — best run untamed. Slashers eat lungers, hang with bashers and walls, respect decisive strikers, and dread the long-haul scum.',
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
      concept(
        'Scimitar Adept',
        { ST: 9, CN: 8, SZ: 14, WT: 13, WL: 17, SP: 10, DF: 13 },
        'Starts well-suited to the scimitar, with enough strength, constitution, and will for normal endurance. A good shot at good damage out of the gate — and if not, only a train or two away.',
        'Slash only.'
      ),
      concept(
        'Sacred Lord',
        { ST: 11, CN: 7, SZ: 7, WT: 17, WL: 17, SP: 9, DF: 16 },
        'Bookie\'s baseline-perfect slasher: wit, will, and deftness all elite so attack and initiative max out, speed just high enough to keep tempo honest. Strength buys the scimitar at creation and the broadsword after a train or two — his defense is not being there.',
        'Slash only; scimitar or hatchet; hot open, fade to low.'
      ),
      concept(
        'Arcane Slasher',
        { ST: 6, CN: 3, SZ: 11, WT: 15, WL: 21, SP: 11, DF: 17 },
        'Arcane Kid\'s will-over-flesh answer to the burn problem — constitution nearly bottomed so will does all the work and never tires of attacking. Deft enough for the scimitar from day one; keep him out of heavy armor until the trains land.',
        'Slash only; scimitar; never stop attacking.'
      ),
      concept(
        'Darque Slasher',
        { ST: 13, CN: 10, SZ: 7, WT: 17, WL: 17, SP: 9, DF: 11 },
        'Master Darque\'s compact bruiser — deftness deliberately bottomed because the style needs almost no defense; strength buys the heavy blades and the damage that ends fights before the endurance bill comes due.',
        'Slash only; battle axe or scimitar; hit first, hit hard.'
      ),
      concept(
        'Unbiased Slasher',
        { ST: 7, CN: 9, SZ: 5, WT: 21, WL: 18, SP: 11, DF: 13 },
        'Tex\'s tiny razor — size five with wit twenty-one: learn everything, carry nothing, dodge with deftness. Proof that a slasher can be small and still win early enough for it not to matter.',
        'Slash only; shortsword or hatchet; high effort, low activity.'
      ),
      concept(
        'Profile Slasher',
        { ST: 9, CN: 7, SZ: 15, WT: 17, WL: 15, SP: 10, DF: 11 },
        'Jorja\'s graduate Vic — a size-fifteen slasher who proved the archetype flexible: the big frame carries hit points and damage while wit and will cover skills and endurance. Ran him attacking the right arm, protecting the body.',
        'Slash; any heavy blade; attack right arm, protect body.'
      ),
      concept(
        'Anti-Thesis',
        { ST: 13, CN: 11, SZ: 12, WT: 10, WL: 16, SP: 11, DF: 11 },
        'Talon\'s deliberately average slasher who made AD anyway — no elite stat, nothing starved, scimitar-capable at creation. The article\'s lesson: you do not need a perfect design, only adequate stats, a good blade, and the right rhythm.',
        'Slash; scimitar; hot open, collapse to moderate.'
      ),
    ],
  },
  [FightingStyle.StrikingAttack]: {
    doctrine:
      'Pure offensive — the striker wins on the first blow or not at all; never a tank, rarely a dodger. Design for endurance and damage first (Normal/Normal or better), then attack, initiative, and decisiveness — decise around 8+, attack 6+. Stat minimums by consensus: strength 9, wit 11, will 9, deftness 11; constitution and size are flexible, speed situational. Weapons by need: shortsword, hatchet, or quickstrike for speed; scimitar, broadsword, or battle axe for damage; longsword all-around. ALE or lighter armor — a striker in plate has already lost. Every tactic appears on a canon sheet: decisiveness is the signature, responsiveness answers enemy strikers, and bash, slash, lunge, dodge, even none all have their place. The classic run is 10-10-x — wind him up, let him go, throttle down once the first blow lands. Hunts bashers, slashers, parry-lungers, and aimed blows; fears parry-ripostes and walls that weather the first blow.',
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
      concept(
        'Low-Will Wonder',
        { ST: 17, CN: 9, SZ: 7, WT: 17, WL: 9, SP: 14, DF: 11 },
        'This low will wonder needs help to reach normal endurance — hence the high strength, which has the bonus of guaranteeing good damage on a relatively small warrior. The 11 deftness opens suitability to almost every weapon.',
        'Decisiveness only.'
      ),
      // ── Assur's Striker Guide — his eight-man example stable ──
      concept(
        "Assur's Godling",
        { ST: 21, CN: 4, SZ: 7, WT: 21, WL: 9, SP: 11, DF: 11 },
        'Assur\'s maxed godling — twenty-one strength and wit with everything else at minimums. Brilliant on paper, but four constitution means the first minute is the whole fight; Assur offers him as the cautionary entry.',
        'Decisiveness — the bout must end before the flaws do.'
      ),
      concept(
        "Assur's Giant",
        { ST: 9, CN: 9, SZ: 16, WT: 21, WL: 10, SP: 8, DF: 11 },
        'The big striker — sixteen size supplies the hit points that nine constitution and ten will cannot, freeing wit for twenty-one. Slow, but a giant can afford to be.',
        'Decisiveness; bash if the decise fails to land.'
      ),
      concept(
        "Assur's Stayer",
        { ST: 9, CN: 3, SZ: 16, WT: 17, WL: 17, SP: 9, DF: 13 },
        'Assur\'s endurance experiment — three constitution behind a sixteen-size hit-point pool and seventeen will. Staying power bought with size and will instead of constitution.',
        'Decisiveness — and he can actually outlast the counter.'
      ),
      concept(
        "Assur's Hammer",
        { ST: 17, CN: 5, SZ: 10, WT: 21, WL: 10, SP: 10, DF: 11 },
        'Seventeen strength does the talking — great damage on demand with twenty-one wit to learn the rest. Five constitution is the usual striker tax.',
        'Decisiveness; bash against the soft matchups.'
      ),
      concept(
        "Assur's Sprinter",
        { ST: 11, CN: 13, SZ: 5, WT: 21, WL: 9, SP: 14, DF: 11 },
        'The speed build — fourteen speed on a five-size frame presses the decisiveness edge to its limit. Thirteen constitution is a luxury few strikers get.',
        'Decisiveness — first strike is the whole game plan.'
      ),
      concept(
        "Assur's Cutter",
        { ST: 15, CN: 3, SZ: 11, WT: 21, WL: 9, SP: 14, DF: 11 },
        'Fifteen strength and fourteen speed — Assur\'s scimitar striker, built to put a damaging blow in flight before anyone answers.',
        'Decisiveness; slash situationally.'
      ),
      concept(
        "Assur's Duelist",
        { ST: 17, CN: 4, SZ: 10, WT: 21, WL: 9, SP: 10, DF: 13 },
        'Seventeen strength with a thirteen-deft hand — the duelist variant, built to hit hard and hit where aimed.',
        'Decisiveness; riposte when the opponent overcommits.'
      ),
      concept(
        "Assur's Scholar",
        { ST: 9, CN: 9, SZ: 12, WT: 21, WL: 10, SP: 12, DF: 11 },
        'The balanced twenty-one-wit build — no stat starved below nine, nothing wasted. Assur\'s safest striker: learns everything, lacks only a signature.',
        'Any offensive tactic the matchup calls for; decisiveness by default.'
      ),
      // ── Blind Man's brainy low-will pair ──
      concept(
        'Brainy Striker',
        { ST: 11, CN: 12, SZ: 10, WT: 19, WL: 9, SP: 6, DF: 17 },
        'Blind Man\'s thesis build — nineteen wit does the learning that nine will cannot, and seventeen deftness makes the first blow count. His argument: will is the stat a striker can starve.',
        'Decisiveness opener; responsiveness against opposing offensives.'
      ),
      concept(
        'Glass Decider',
        { ST: 9, CN: 12, SZ: 12, WT: 19, WL: 7, SP: 4, DF: 21 },
        'The extreme version — twenty-one deftness decides bouts in a single exchange while four speed and seven will leave him glass. Blind Man\'s proof one maxed stat can carry a striker.',
        'Decisiveness — win before the flaws show.'
      ),
      // ── Sir Boyd's Striking Style ──
      concept(
        "Sir Boyd's Perfect",
        { ST: 13, CN: 4, SZ: 9, WT: 21, WL: 11, SP: 9, DF: 17 },
        'Sir Boyd\'s ideal — clears every stated minimum with maxed wit and near-maxed deftness. ST+SZ is 22, past his durability bar of 21.',
        'Decisiveness; responsiveness against enemy strikers.'
      ),
      concept(
        "Sir Boyd's Swift",
        { ST: 11, CN: 4, SZ: 11, WT: 17, WL: 11, SP: 15, DF: 15 },
        'Boyd\'s speed variant — fifteen speed sharpens the decise edge, and ST+SZ still reaches his 21-point bar.',
        'Decisiveness; responsiveness against enemy strikers.'
      ),
      // ── Talon's Strikers R Us — the Biffs, the Solid, the Perfect ──
      concept(
        "Fool's Biff",
        { ST: 10, CN: 10, SZ: 11, WT: 4, WL: 17, SP: 17, DF: 15 },
        'Talon\'s wit-starved biff — four wit, seventeen speed and will. Deliberately jank: the style forgives a bad stat line when the first blow lands.',
        'None — a biff runs naked.'
      ),
      concept(
        'Clever Biff',
        { ST: 7, CN: 11, SZ: 17, WT: 17, WL: 11, SP: 6, DF: 15 },
        'The clever biff — seventeen wit and a seventeen-size frame carry seven strength; six speed is the price of admission.',
        'None, or dodge when the first exchange goes wrong.'
      ),
      concept(
        "Gambler's Biff",
        { ST: 9, CN: 5, SZ: 14, WT: 17, WL: 11, SP: 13, DF: 15 },
        'The gambler — five constitution behind a fourteen-size frame, betting the bout ends before endurance does.',
        'None — bet it all on the opening.'
      ),
      concept(
        'Hulk Biff',
        { ST: 4, CN: 8, SZ: 17, WT: 15, WL: 13, SP: 10, DF: 17 },
        'The hulk — four strength on a seventeen-size frame with seventeen deftness. Hits like a feather, cannot be dropped: Talon\'s most perverse workable biff.',
        'None — survive to the counter-punch.'
      ),
      concept(
        'Godling Biff',
        { ST: 21, CN: 3, SZ: 15, WT: 21, WL: 5, SP: 8, DF: 11 },
        'Two twenty-ones and three dump stats — Talon\'s godling experiment. Magnificent in minute one, nothing left after.',
        'Decisiveness — there is no plan B.'
      ),
      concept(
        "Talon's Solid",
        { ST: 13, CN: 6, SZ: 9, WT: 17, WL: 17, SP: 9, DF: 13 },
        'Talon\'s solid citizen — no gimmick, just seventeen wit and will over adequate everything. The build he actually recommends.',
        'Decisiveness in minute one; responsiveness if a defensive tactic is wanted.'
      ),
      concept(
        'Primal Perfect',
        { ST: 15, CN: 3, SZ: 5, WT: 21, WL: 15, SP: 8, DF: 17 },
        'Talon\'s perfect column — twenty-one wit, fifteen will and strength, near-maxed deftness on a five-size frame. The dream roll-up.',
        'Decisiveness; responsiveness against enemy decise.'
      ),
      // ── Tex's Yet Another Striker Article — eight veterans ──
      concept(
        "Tex's Workhorse",
        { ST: 13, CN: 5, SZ: 17, WT: 17, WL: 10, SP: 9, DF: 13 },
        'Tex\'s 69-fight veteran — a seventeen-size, seventeen-wit workhorse that simply outlasted everyone. Proof durability and learning beat elegance over a career.',
        'Decisiveness; slash or bash by the matchup.'
      ),
      concept(
        "Tex's Graduate",
        { ST: 9, CN: 9, SZ: 11, WT: 17, WL: 11, SP: 10, DF: 17 },
        'The graduate — modest stats maximally deployed; seventeen wit and deftness carried him clean through to graduation.',
        'Decisiveness; any defensive tactic but parry.'
      ),
      concept(
        "Tex's Bruiser",
        { ST: 17, CN: 6, SZ: 11, WT: 17, WL: 9, SP: 11, DF: 13 },
        'Seventeen strength does the talking — a wit-seventeen bruiser who hits hard and learns whatever else he needs.',
        'Decisiveness; bash against bashers.'
      ),
      concept(
        "Tex's Godling",
        { ST: 11, CN: 13, SZ: 11, WT: 21, WL: 9, SP: 6, DF: 13 },
        'Tex\'s godling — twenty-one wit headlining a balanced frame with no true weakness. The safe godling.',
        'Decisiveness; responsiveness against enemy strikers.'
      ),
      concept(
        "Tex's Fireball",
        { ST: 17, CN: 8, SZ: 7, WT: 17, WL: 5, SP: 13, DF: 17 },
        'Five will with seventeen strength, speed, and deftness — burns spectacularly and briefly. Tex\'s cautionary fireball.',
        'Decisiveness only — the flame does not last.'
      ),
      concept(
        "Tex's Stayer",
        { ST: 10, CN: 10, SZ: 10, WT: 21, WL: 14, SP: 11, DF: 8 },
        'Twenty-one wit and fourteen will — Tex\'s stayer wins long fights he has no business surviving.',
        'Any tactic the book allows; he has the wit to use them all.'
      ),
      concept(
        "Tex's Accident",
        { ST: 12, CN: 15, SZ: 4, WT: 18, WL: 21, SP: 4, DF: 10 },
        'The accident — a roll meant for another style: eighteen wit, twenty-one will, four speed and four size. Graduated anyway; the article\'s strangest success.',
        'None — let the skills do the work.'
      ),
      concept(
        "Tex's Grinder",
        { ST: 12, CN: 12, SZ: 7, WT: 20, WL: 14, SP: 9, DF: 10 },
        'Twenty wit over a grinder\'s frame — nothing fancy: outlasts and out-learns.',
        'Decisiveness early; whatever the second minute demands.'
      ),
      // ── The Crimson Strategist's synthesized build ──
      concept(
        'Crimson Striker',
        { ST: 13, CN: 5, SZ: 10, WT: 17, WL: 11, SP: 10, DF: 17 },
        'The Crimson Strategist\'s synthesized ideal — clears every stated minimum (strength 9, wit 11, will 9, deftness 11) with seventeen wit and deftness; five constitution says pure offensive.',
        'Decisiveness or responsiveness — the answer depends on the opponent\'s tempo.'
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
