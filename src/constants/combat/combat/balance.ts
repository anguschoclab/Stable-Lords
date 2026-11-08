// ─── Balance Guardrails ───────────────────────────────────────────────────────
/**
 * Allowed deviation from 50% for mirror-match A-side win rates
 * Engine A/D bias should be reduced toward 0.05 over time
 */
export const MIRROR_MATCH_BAND = 0.1;

/**
 * Target absolute-power band for overall style win rates (50% ± 10pp)
 * Styles outside this band are globally over/under-tuned
 */
export const ABSOLUTE_POWER_LOW = 0.4;
export const ABSOLUTE_POWER_HIGH = 0.6;

// Per-style knobs (AB_*, BA_*, LU_*, PL_*, PR_*, PS_*, SL_*, ST_*, TP_*,
// WS_*) live in ./styles/<code>.ts — re-exported through the barrel.

/** Hidden per-skill luck roll at warrior creation — canon ±4 (every style but pikers). */
export const LUCKFACTOR_RANGE = 4;

// ─── Commit Mechanic ──────────────────────────────────────────────────────
/** HP ratio below which a fighter is considered "at low HP" for commit triggering. */
export const COMMIT_HP_THRESHOLD = 0.35;
/** Kill desire required to trigger commit. */
export const COMMIT_KILL_DESIRE = 7;
/** Damage multiplier applied when a fighter has committed. */
export const COMMIT_DAMAGE_MULT = 1.2;

// ─── Knockdown ────────────────────────────────────────────────────────────
/** Defender HP ratio (after hit) below which a knockdown can occur. */
export const KNOCKDOWN_HP_RATIO = 0.4;
/** Minimum damage-to-maxHP ratio required for a knockdown check. */
export const KNOCKDOWN_DAMAGE_RATIO = 0.12;
/** Cap on the knockdown probability per hit. */
export const KNOCKDOWN_CHANCE_CAP = 0.35;
/** Knockdown probability bonus per existing leg hit on the defender. */
export const KNOCKDOWN_LEG_BONUS = 0.05;

// ─── Disarm ───────────────────────────────────────────────────────────────
/** Base disarm probability per landed arm hit. Balance knob. */
export const DISARM_BASE_CHANCE = 0.08;
/** Disarm probability bonus per cumulative arm hit on the defender (wounded arm). */
export const DISARM_PER_ARMHIT = 0.07;
/** Disarm probability bonus per unit of damage-to-maxHP ratio on the triggering hit. */
export const DISARM_DAMAGE_COEFF = 0.4;
/** Extra disarm probability when the arm hit crits. */
export const DISARM_CRIT_BONUS = 0.1;
/** Cap on the disarm probability per landed arm hit. */
export const DISARM_CHANCE_CAP = 0.5;
/** Flat per-exchange chance a disarmed fighter retrieves their weapon at exchange start. */
export const DISARM_RECOVER_CHANCE = 0.5;
/** Weapon id a disarmed fighter falls back to once backup is gone (or none carried). */
export const DISARM_UNARMED_WEAPON_ID = 'fist';
/** Hit locations that can carry a disarm — the weapon-bearing limbs. */
export const DISARM_ARM_LOCATIONS = ['right arm', 'left arm'] as const;
/** XOR salt for the dedicated disarm RNG stream — keeps disarm/rearm rolls
 *  off the shared combat stream so the mechanic doesn't reshuffle
 *  downstream rolls (guardrail samples are stream-deterministic). */
export const DISARM_RNG_SEED_XOR = 0xd15a01;

// ─── Post-Bout Injury Coupling ────────────────────────────────────────────
/** Limb hits on one side at/above which post-bout injury selection is
 *  biased toward that limb's injuries (arms take priority over legs). */
export const INJURY_LOCATION_BIAS_HITS = 3;
/** InjuryData.location values treated as "arm" for the bias pool. */
export const INJURY_ARM_LOCATIONS = ['Right Arm', 'Left Arm'] as const;
/** InjuryData.location values treated as "leg" for the bias pool. */
export const INJURY_LEG_LOCATIONS = ['Right Leg', 'Left Leg'] as const;

// ─── Hit Side-Effects ─────────────────────────────────────────────────────
/** Chance per damaging hit to grant an insight token. */
export const INSIGHT_CHANCE = 0.2;
/** Consecutive hits required to classify a kill as a critical chain. */
export const CRITICAL_CHAIN_HITS = 3;
/** Raw damage threshold for classifying a kill as armor failure. */
export const ARMOR_FAILURE_DMG_THRESHOLD = 20;

// ─── Momentum ─────────────────────────────────────────────────────────────
/** Momentum cap (maximum positive momentum). */
export const MOMENTUM_CAP = 3;
/** Momentum floor (minimum negative momentum). */
export const MOMENTUM_FLOOR = -3;
/** Multiplier applied to momentum when computing initiative bonus. */
export const MOMENTUM_INI_MULT = 2;

// ─── Decisiveness → strike order ───────────────────────────────────────────
// Canon (Noblish Island): the decisiveness SKILL feeds who strikes first —
// distinct from the named Decisiveness tactic's tacticIni edge. Fractional
// coeff keeps DEC meaningful but subordinate to raw INI (decise is a lean,
// not a replacement for speed).
/** Coefficient on skills.DEC inside the initiative contest sum. */
export const DEC_INI_COEFF = 0.2;

// ─── Whiff & Riposte ──────────────────────────────────────────────────────
/** Endurance cost multiplier on a whiffed attack (fraction of normal cost). */
export const WHIFF_ENDURANCE_COST_MULT = 0.5;
/** Flat defense penalty subtracted from whiff-riposte check difficulty. */
export const WHIFF_RIPOSTE_DEF_PENALTY = 4;

// ─── Narrative & Feint ────────────────────────────────────────────────────
/** Probability that a style passive narrative triggers an event. */
export const PASSIVE_NARRATIVE_CHANCE = 0.4;
/** Defense bonus granted to a defender when the attacker's feint fails. */
export const FEINT_FAILED_DEF_BONUS = 2;

// ─── Favorites ──────────────────────────────────────────────────────────
/** Added crit chance while a fighter wields their (hidden) favorite weapon.
 *  The "charting" signal: baseline critChance is ~0 for most styles, so a
 *  sustained ~20% crit rate over a weapon's swings is the player's cue that
 *  they have found the favorite — before formal discovery reveals it. */
export const FAVORITE_WEAPON_CRIT_CHANCE = 0.2;

// ─── Trait Generation ───────────────────────────────────────────────────────
/**
 * Synergy multiplier for archetype-matching traits
 * Amplifies identity by making thematic fits more likely
 */
export const TRAIT_SYNERGY_MULTIPLIER = 3.0;

/**
 * Anti-synergy multiplier for archetype-opposed traits
 * Reduces cross-style noise by making against-type traits rare
 */
export const TRAIT_ANTI_SYNERGY_MULTIPLIER = 0.1;

/** Birth-trait distribution: most warriors are born blank; traits are developed. */
export const BIRTH_BLANK_CHANCE = 0.68;
export const BIRTH_FLAW_CHANCE = 0.07;
