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

/** Hidden per-skill luck roll at warrior creation — canon ±4, ALL styles
 *  (V23 parity: pikers no longer get a widened ±6 range). */
export const LUCKFACTOR_RANGE = 4;

/** Style-conditioned positive luck pools (Drake's canon note): positive
 *  luckfactor draws may only land on the listed skills; negatives stay
 *  free to land anywhere ("hosed stays canon"). Styles absent from the
 *  map keep unrestricted luck — V23 range parity is untouched. Only WS
 *  carries a canon-documented pool. */
export const STYLE_POSITIVE_LUCK_POOLS: Partial<Record<string, readonly string[]>> = {
  'WALL OF STEEL': ['ATT', 'PAR'],
};

// ─── Coordination (V23 — SJJ "Effects of Coordination") ────────────────────
/** Additive disarm-chance modifier by coordination rating — clumsy fighters
 *  fumble grips more. Applied in rollDisarmChance alongside armHits/damage/crit. */
export const COORD_DISARM_MOD: Partial<Record<string, number>> = {
  Clumsy: 0.1,
  'Slightly Uncoordinated': 0.05,
};
/** Chance to fumble the backup draw on disarm (draw delays one exchange).
 *  Only low-coordination fighters risk it. */
export const QUICKDRAW_FUMBLE_CHANCE: Partial<Record<string, number>> = {
  Clumsy: 0.4,
  'Slightly Uncoordinated': 0.15,
};
/** Chance per exchange that a knocked-down low-coordination fighter fails to
 *  rise (stays knockedDown one more exchange). Non-listed tiers always rise. */
export const COORD_RISE_FAIL_CHANCE: Partial<Record<string, number>> = {
  Clumsy: 0.5,
  'Slightly Uncoordinated': 0.2,
};
/** Small additive knockdown-susceptibility term by rating (house-approved
 *  speculative extension — canon mentions slower rise, not extra falls). */
export const COORD_KD_SUSCEPT: Partial<Record<string, number>> = {
  Clumsy: 0.05,
  'Slightly Uncoordinated': 0.02,
};

// ─── The Jump (V23 — Pagan "Getting the Jump") ─────────────────────────────
/** OE coefficient inside the initiative sum — canon calls OE the biggest
 *  controllable jump factor. */
export const JUMP_OE_COEFF = 0.4;
/** Minimum |iniA−iniD| for a clean first exchange — below this the jump is
 *  contested and re-rolled (CLASH events). */
export const JUMP_DISPARITY = 3;
/** Max clash re-rolls at bout open before the last roll stands. */
export const JUMP_CLASH_MAX = 3;

// ─── Handedness & Dual Wield (V23) ─────────────────────────────────────────
/** Chance an ambidextrous fighter's lazily-picked primary side is the right
 *  hand (canon: ambis carry primary in the right but use the left more). */
export const AMBI_PRIMARY_RIGHT_BIAS = 0.75;
/** Chance an ambidextrous roll flips to the 'ambi-reversed' variant —
 *  rare canon variant, primary in the left. */
export const AMBI_REVERSED_CHANCE = 0.1;
/** Very High Coordination gate for the free off-hand shot: SP+DF ≥ 32 AND
 *  both SP and DF ≥ 15 (canon VHC profile line). */
export const DUAL_VHC_SUM_MIN = 32;
export const DUAL_VHC_STAT_MIN = 15;
// Off-hand free shot deals a reduced-weight hit — the off-hand weapon is
// the lighter weapon in canon dual setups; tunable house value.
export const DUAL_OFFHAND_DAMAGE_MULT = 0.6;

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

/** Canon: Strikers draw on a deeper endurance pool than their (ST+CN)×WL
 *  chart cell suggests — applied once at build to derivedStats.endurance. */
export const STRIKER_ENDURANCE_POOL_BONUS = 1.1;

/** Canon secondary-damage statements use a fixed wound threshold alongside
 *  ratio tiers: a blow this big is a hard hit no matter how deep the pool. */
export const DAMAGE_HARD_HIT = 15;

/** Coefficient on skills.ATT inside the critical-hit chance — canon: skilled
 *  strikers find vitals more often. ATT 25 → +10%, ATT 5 → +2%. */
export const ATT_CRIT_COEFF = 0.004;

/** Penalty on a dodge-triggered riposte check vs a parry-triggered one —
 *  canon: dodging opens a counter window, but a parry positions better. */
export const DODGE_RIPOSTE_MOD = -2;

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

// ─── V24 canon knobs (Phase-1 scaffolding — wired in later phases) ─────────
/** Pagan's model: tactics a style cannot roll as a favorite are net-negative
 *  — the tactic "enhances" its area while draining the rest twice as fast. */
export const TACTIC_U_MULT = -0.5;
/** Consortium canon: running an offensive AND a defensive tactic together is
 *  "very limiting" — the tactics' own benefits are halved while both are
 *  active (the warrior itself is untaxed; the pairing loses punch). */
export const DOUBLE_TACTIC_EFFECTIVENESS = 0.5;
/** Pagan's jump: each clash re-draws a string term into both totals until a
 *  clear disparity emerges. Jitter added per clash per side. */
export const JUMP_CLASH_JITTER = 2;
/** Assur: KD 9-10 makes warriors "fight somewhat strangely" — flat efficacy
 *  tax at or above the threshold (kill window still scales as before). */
export const KD_HIGH_PENALTY = { threshold: 9, attPenalty: -1, iniPenalty: -1 } as const;
/** Assur's fast weapons (Design vs. Strategy / Getting the Jump): initiative
 *  edge independent of the weight-derived formula. */
export const FAST_WEAPON_INI: readonly string[] = [
  'war_hammer',
  'hatchet',
  'quarterstaff',
  'short_sword',
];
/** Assur: lunging weapons have the best knock-down ability — additive
 *  knockdown-chance bump before KNOCKDOWN_CHANCE_CAP. */
export const LUNGE_KNOCKDOWN_BONUS = 0.1;
/** Assur: 2-handed weapons "break often when used to parry" and burn
 *  endurance faster — parry-side endurance surcharge for two-handed weapons. */
export const TWOHANDED_PARRY_ENDURANCE_SURCHARGE = 1.2;
/** Per-weapon armor overrides layered before the damage-type table
 *  (weaponArmor.canon). Jalopy: the dagger is "poor or ineffective at ASM
 *  or higher" — reconciled with Assur's "surprisingly good vs APA/APM" as a
 *  mid-armor penalty only; the plate tiers stay at dtype parity. */
export const WEAPON_ARMOR_OVERRIDES: Record<string, Record<string, number>> = {
  dagger: { scale_mail: 0.7, chain_mail: 0.7 },
};
/** Favorite tactic fires hidden (weapon-crit parity — Godling Heresy:
 *  favorites matter before you know them). */
export const FAVORITE_TACTIC_BONUS = 2;
/** Smithy (hedged canon): a warrior too small for a weapon takes NO skill
 *  penalty from the SZ shortfall — only the endurance tax remains. */
export const SZ_REQ_NO_ATT_PENALTY = true;
/** Canon: a bloodfeud challenge is near-guaranteed — dominant offer bonus. */
export const BLOODFEUD_PRIORITY = 500;
/** Smithy: off-hand weapon attacks come from the highly coordinated OR the
 *  ambidextrous — handedness bypasses the VHC stat profile. */
export const OFFHAND_AMBI_GATE = true;


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
