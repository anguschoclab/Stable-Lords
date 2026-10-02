import type { Warrior } from '@/types/warrior.types';
import type { ArenaConfig, FightPlan, WeatherType } from '@/types/shared.types';
import type { FightSummary } from '@/types/combat.types';
import { FightingStyle } from '@/types/shared.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import {
  getWeaponPreferredRange,
  ARENA_SIZE_PROFILES,
  RANGE_ORDER,
} from '@/engine/combat/mechanics/distanceResolution';
import { getAllArenas, getArenaById, getArenasByTag, arenaTagSet } from '@/data/arenas';
import { HAZARDOUS_WEATHER } from '@/engine/ai/weatherSuitability';
import { ARENA_FIT, ARENA_SELECTION, ARENA_TAG_WEIGHTS } from '@/constants/arena';

// ─── Style classification helpers ─────────────────────────────────────────────

const RIPOSTE_STYLES = new Set<FightingStyle>([
  FightingStyle.ParryRiposte,
  FightingStyle.ParryStrike,
  FightingStyle.WallOfSteel,
]);

const INITIATIVE_STYLES = new Set<FightingStyle>([
  FightingStyle.LungingAttack,
  FightingStyle.StrikingAttack,
  FightingStyle.SlashingAttack,
]);

const HIGH_AGGRESSION_STYLES = new Set<FightingStyle>([
  FightingStyle.BashingAttack,
  FightingStyle.SlashingAttack,
  FightingStyle.AimedBlow,
  FightingStyle.LungingAttack,
]);

// ─── Core scoring ─────────────────────────────────────────────────────────────

/**
 * Range fit: reward when the preferred range is reachable under the arena cap
 * (closer to the arena's natural start range = better); penalise overshoot.
 */
function rangeFitScore(
  prefIdx: number,
  maxIdx: number,
  profile: (typeof ARENA_SIZE_PROFILES)[keyof typeof ARENA_SIZE_PROFILES]
): number {
  const startIdx = RANGE_ORDER.indexOf(profile.startRange);
  if (prefIdx <= maxIdx) {
    // Preferred range is reachable — reward proximity to preference
    const distanceFromPref = Math.abs(prefIdx - startIdx);
    return (
      ARENA_FIT.RANGE_FIT_MAX -
      Math.min(ARENA_FIT.RANGE_FIT_MAX, distanceFromPref * ARENA_FIT.RANGE_DISTANCE_PENALTY)
    );
  }
  // Preferred range is beyond the cap — penalise
  const overshoot = prefIdx - maxIdx;
  return -overshoot * ARENA_FIT.RANGE_OVERSHOOT_PENALTY;
}

/**
 * Score how well an arena suits a warrior. Higher = better fit.
 * Pure function — no RNG, no side effects.
 *
 * Scoring ranges roughly 0–4:
 *   range fit:       0–1.5
 *   riposte fit:     0–1
 *   initiative fit:  0–0.5
 *   endurance fit:   0–1 (penalty-side)
 */
export function scoreArenaFitForWarrior(
  warrior: Warrior,
  arena: ArenaConfig,
  plan?: FightPlan
): number {
  let score = 0;

  // 1. Range preference vs arena size cap
  const weaponId = warrior.equipment?.weapon ?? warrior.favorites?.weaponId;
  const prefRange = plan?.rangePreference ?? getWeaponPreferredRange(weaponId);
  const profile = ARENA_SIZE_PROFILES[arena.size];
  const prefIdx = RANGE_ORDER.indexOf(prefRange);
  const maxIdx = RANGE_ORDER.indexOf(profile.maxRange);

  score += rangeFitScore(prefIdx, maxIdx, profile);

  // 2. Riposte style vs surfaceMod.riposteMod
  if (RIPOSTE_STYLES.has(warrior.style)) {
    score += arena.surfaceMod.riposteMod * ARENA_FIT.RIPOSTE_MOD_MULTIPLIER;
  }

  // 3. Initiative style vs surfaceMod.initiativeMod
  if (INITIATIVE_STYLES.has(warrior.style)) {
    score += arena.surfaceMod.initiativeMod * ARENA_FIT.INITIATIVE_MOD_MULTIPLIER;
  }

  // 4. Endurance fit: high-aggression / low-CN warriors suffer in high-drain arenas
  const cn = warrior.attributes?.CN ?? 12;
  const isHighAgg = HIGH_AGGRESSION_STYLES.has(warrior.style);
  const drainStress = arena.surfaceMod.enduranceMult - 1.0; // positive = harder
  if (drainStress > 0) {
    const cnPenaltyFactor = isHighAgg ? ARENA_FIT.HIGH_AGG_CN_FACTOR : 1.0;
    const cnRatio = Math.max(0, (ARENA_FIT.CN_BASELINE - cn) / ARENA_FIT.CN_BASELINE); // more penalty for low-CN
    score -= drainStress * cnRatio * cnPenaltyFactor;
  }

  // 5. Tag-based scoring
  for (const tag of arena.tags) {
    const tagConfig = ARENA_TAG_WEIGHTS[tag as keyof typeof ARENA_TAG_WEIGHTS];
    if (tagConfig) {
      // Bonus for close-range fighters in cramped arenas
      if (tag === 'cramped' && prefIdx <= 1) {
        score += ARENA_FIT.CLOSE_RANGE_BONUS * tagConfig.weight;
      }
      // Bonus for reach fighters in open arenas
      if (tag === 'open' && prefRange === 'Extended') {
        score += ARENA_FIT.REACH_BONUS * tagConfig.weight;
      }
      // Penalty for initiative styles in uneven arenas

      // Penalty for low-endurance fighters in elevated arenas
      if (tag === 'elevated') {
        const cn = warrior.attributes?.CN ?? 12;
        if (cn < ARENA_FIT.CN_BASELINE) {
          score -= (ARENA_FIT.CN_BASELINE - cn) * 0.1 * tagConfig.weight;
        }
      }

      if (tag === 'uneven' && INITIATIVE_STYLES.has(warrior.style)) {
        score -= ARENA_FIT.UNEVEN_INITIATIVE_PENALTY * tagConfig.weight;
      }
    }
  }

  // Synergy penalties for specific tag combinations
  const arenaTags = arenaTagSet(arena);
  const hasWater = arenaTags.has('water');
  const hasCursed = arenaTags.has('cursed');

  if (hasWater && hasCursed) {
    // Water + Cursed creates an extremely draining environment that punishes high-aggression
    if (HIGH_AGGRESSION_STYLES.has(warrior.style)) {
      score -= 0.5;
    }
  }

  if (hasWater && arenaTags.has('uneven')) {
    // Water + Uneven makes lunging styles prone to slipping
    if (INITIATIVE_STYLES.has(warrior.style)) {
      score -= 0.4;
    }
  }

  return score;
}

/** The arena where the warrior holds the most recorded bouts — their "home"
 *  venue. Ties resolve to the earliest-fought venue (insertion order).
 *  Tournament-only grounds (Bloodsands) are ineligible — a record there can
 *  never be defended, so it must not become "home". */
function homeVenueOf(warrior: Warrior): { arenaId: string; bouts: number } | undefined {
  const recs = warrior.career?.byArena;
  if (!recs) return undefined;
  const excluded = new Set<string>(ARENA_SELECTION.EXCLUDED_ARENA_IDS);
  let best: string | undefined;
  let bestBouts = 0;
  for (const [arenaId, rec] of Object.entries(recs)) {
    if (excluded.has(arenaId)) continue;
    const bouts = (rec.wins ?? 0) + (rec.losses ?? 0);
    if (bouts > bestBouts) {
      best = arenaId;
      bestBouts = bouts;
    }
  }
  return best ? { arenaId: best, bouts: bestBouts } : undefined;
}

// ─── Arena eligibility ─────────────────────────────────────────────────────────

/** Inputs for {@link eligibleArenasFor}. */
export interface ArenaEligibilityOpts {
  weather?: WeatherType;
  /** Venues the warrior is barred from (title-locked bans, sanctions). */
  bannedArenaIds?: readonly string[];
}

/**
 * The venues a warrior may be booked at right now.
 *
 * - Tier-1 arenas are open to everyone.
 * - Tier-2 requires fame ≥ TIER_2_FAME_THRESHOLD.
 * - Tier-3 requires fame ≥ TIER_3_FAME_THRESHOLD, champion status, or a title.
 * - Tournament-only grounds (EXCLUDED_ARENA_IDS) and banned venues are out.
 * - Hazardous weather restricts the set to indoor venues when one exists.
 */
export function eligibleArenasFor(warrior: Warrior, opts?: ArenaEligibilityOpts): ArenaConfig[] {
  const excluded = new Set<string>(ARENA_SELECTION.EXCLUDED_ARENA_IDS);
  for (const id of opts?.bannedArenaIds ?? []) excluded.add(id);

  const fame = warrior.fame ?? 0;
  const elite =
    fame >= ARENA_SELECTION.TIER_3_FAME_THRESHOLD ||
    warrior.champion === true ||
    (warrior.titles?.length ?? 0) > 0;
  const mid = elite || fame >= ARENA_SELECTION.TIER_2_FAME_THRESHOLD;

  let eligible = getAllArenas().filter(
    (a) => !excluded.has(a.id) && (a.tier === 1 || (a.tier === 2 && mid) || (a.tier === 3 && elite))
  );

  if (opts?.weather && HAZARDOUS_WEATHER.includes(opts.weather)) {
    const indoorIds = new Set(getArenasByTag('indoor').map((a) => a.id));
    const indoor = eligible.filter((a) => indoorIds.has(a.id));
    if (indoor.length > 0) eligible = indoor;
  }

  return eligible;
}

/**
 * Recent-booking weight: venues with fewer recorded bouts over the last
 * UNDERSERVED_LOOKBACK_WEEKS get up to UNDERSERVED_ARENA_WEIGHT added to
 * their draw score, nudging coverage across the circuit.
 */
function underservedWeights(
  arenaHistory: FightSummary[] | undefined,
  currentWeek: number | undefined
): Map<string, number> {
  const weights = new Map<string, number>();
  if (!arenaHistory || currentWeek === undefined) return weights;

  const usage = new Map<string, number>();
  let maxUsage = 0;
  for (const f of arenaHistory) {
    const week = f.absoluteWeek ?? 0;
    if (!f.arenaId || currentWeek - week > ARENA_SELECTION.UNDERSERVED_LOOKBACK_WEEKS) continue;
    const count = (usage.get(f.arenaId) ?? 0) + 1;
    usage.set(f.arenaId, count);
    if (count > maxUsage) maxUsage = count;
  }
  if (maxUsage === 0) return weights;
  for (const [arenaId, count] of usage) {
    weights.set(
      arenaId,
      (ARENA_SELECTION.UNDERSERVED_ARENA_WEIGHT * (maxUsage - count)) / maxUsage
    );
  }
  return weights;
}

// ─── Matchup arena selection ───────────────────────────────────────────────────

/** Optional inputs for {@link selectArenaForMatchup}. */
export interface MatchupArenaOpts {
  favorWeight?: number;
  planA?: FightPlan;
  planB?: FightPlan;
  arenaPool?: string[];
  weather?: WeatherType;
  /** Recent fight history — feeds the under-served-venue weighting. */
  arenaHistory?: FightSummary[];
  currentWeek?: number;
}

/**
 * Candidate venues: legal for BOTH warriors (tier/fame gating, bans,
 * tournament-ground exclusion, hazardous-weather indoor rule) and inside
 * the promoter's pool when one is supplied.
 */
function matchupArenas(
  favorWarrior: Warrior,
  otherWarrior: Warrior,
  opts?: MatchupArenaOpts
): ArenaConfig[] {
  const eligibleA = new Set(
    eligibleArenasFor(favorWarrior, { weather: opts?.weather }).map((a) => a.id)
  );
  const eligibleB = new Set(
    eligibleArenasFor(otherWarrior, { weather: opts?.weather }).map((a) => a.id)
  );
  const allAvailable = opts?.arenaPool ? opts.arenaPool.map(getArenaById) : getAllArenas();
  return allAvailable.filter((a) => eligibleA.has(a.id) && eligibleB.has(a.id));
}

/** The pair's shared "home" venue — favored warrior's record wins ties. */
function sharedHomeVenueId(favorWarrior: Warrior, otherWarrior: Warrior): string | undefined {
  const homeA = homeVenueOf(favorWarrior);
  const homeB = homeVenueOf(otherWarrior);
  return !homeA
    ? homeB?.arenaId
    : !homeB
      ? homeA.arenaId
      : homeA.bouts >= homeB.bouts
        ? homeA.arenaId
        : homeB.arenaId;
}

/** Softmax-style weighted draw over scored arenas. */
function weightedArenaDraw(arenas: ArenaConfig[], scores: number[], rng: IRNGService): string {
  const minScore = Math.min(...scores);
  const shifted = scores.map((s) => s - minScore + ARENA_SELECTION.SCORE_SHIFT_BUFFER);
  const total = shifted.reduce((a, b) => a + b, 0);

  let pick = rng.next() * total;
  for (let i = 0; i < arenas.length; i++) {
    const s = shifted[i];
    const arena = arenas[i];
    if (s === undefined || !arena) continue;
    pick -= s;
    if (pick <= 0) return arena.id;
  }
  const lastArena = arenas[arenas.length - 1];
  return lastArena ? lastArena.id : 'bloodsands_arena';
}

/**
 * Select an arena for a bout, slightly favouring the designated `favorWarrior`.
 * Uses weighted random selection (not deterministic max) so the same matchup can
 * occur in different arenas across different seeds — preserves variety.
 *
 * Tournament arena (`bloodsands_arena`) is always excluded.
 */
export function selectArenaForMatchup(
  favorWarrior: Warrior,
  otherWarrior: Warrior,
  rng: IRNGService,
  opts?: MatchupArenaOpts
): string {
  const favorWeight = opts?.favorWeight ?? ARENA_SELECTION.FAVOR_WEIGHT_DEFAULT;
  const arenas = matchupArenas(favorWarrior, otherWarrior, opts);

  if (arenas.length === 0) return 'standard_arena';

  // Record-book stickiness: fighters defend home turf. A flat chance the bout
  // books the venue where either warrior holds the deepest record — this is
  // what lets venue records accumulate enough for title contention to emerge.
  // The roll is only consumed when a legal home venue exists, keeping the RNG
  // stream stable for warriors without records.
  const homeArenaId = sharedHomeVenueId(favorWarrior, otherWarrior);
  if (
    homeArenaId &&
    arenas.some((a) => a.id === homeArenaId) &&
    rng.next() < ARENA_SELECTION.HOME_VENUE_CHANCE
  ) {
    return homeArenaId;
  }

  const underserved = underservedWeights(opts?.arenaHistory, opts?.currentWeek);
  const scores = arenas.map((arena) => {
    const fitFavor = scoreArenaFitForWarrior(favorWarrior, arena, opts?.planA);
    const fitOther = scoreArenaFitForWarrior(otherWarrior, arena, opts?.planB);
    // Home venues also dominate the fit draw — the flat roll above is not the
    // only path back; record-book depth earns real (capped) weight in the
    // softmax. Under-booked venues earn a bounded nudge the other way so the
    // circuit stays covered.
    const homeBonus =
      arena.id === homeArenaId
        ? Math.min(ARENA_SELECTION.HOME_VENUE_FIT_BONUS, ARENA_SELECTION.HOME_VENUE_WEIGHT_MAX)
        : 0;
    const underBonus =
      underserved.size > 0
        ? (underserved.get(arena.id) ?? ARENA_SELECTION.UNDERSERVED_ARENA_WEIGHT)
        : 0;
    return fitFavor * favorWeight + fitOther + homeBonus + underBonus;
  });

  return weightedArenaDraw(arenas, scores, rng);
}

// ─── Offer card description ────────────────────────────────────────────────────

/**
 * Return a short human-readable description of why this arena suits (or doesn't suit)
 * the given warrior. Used on bout-offer cards.
 *
 * Examples: "Favors your reach", "Cramped — punishes your polearm",
 *           "Riposte-friendly", "High-drain — tests your stamina"
 */
export function describeArenaFit(warrior: Warrior, arenaId: string, plan?: FightPlan): string {
  const arena = getArenaById(arenaId);
  const weaponId = warrior.equipment?.weapon ?? warrior.favorites?.weaponId;
  const prefRange = plan?.rangePreference ?? getWeaponPreferredRange(weaponId);
  const profile = ARENA_SIZE_PROFILES[arena.size];
  const prefIdx = RANGE_ORDER.indexOf(prefRange);
  const maxIdx = RANGE_ORDER.indexOf(profile.maxRange);

  // Range misfit takes priority (most impactful)
  if (prefIdx > maxIdx) {
    const weaponLabel = weaponId ? weaponId.replace(/_/g, ' ') : 'long weapon';
    return `Cramped — punishes your ${weaponLabel}`;
  }
  if (arena.size === 'open' && prefRange === 'Extended') {
    return 'Open ground — favors your reach';
  }
  if (arena.size === 'cramped' && prefIdx <= 1) {
    return 'Tight quarters — suits your close game';
  }

  // Riposte fit
  if (RIPOSTE_STYLES.has(warrior.style) && arena.surfaceMod.riposteMod > 0) {
    return 'Counter-fighting venue — suits your style';
  }
  if (RIPOSTE_STYLES.has(warrior.style) && arena.surfaceMod.riposteMod < 0) {
    return 'Open brawling venue — less suited to your counters';
  }

  // Initiative fit
  if (INITIATIVE_STYLES.has(warrior.style)) {
    if (arena.surfaceMod.initiativeMod > 0) return 'Fast reads — favors your initiative';
    if (arena.surfaceMod.initiativeMod < 0) return 'Disruptive winds — slows your initiative';
  }

  // Endurance
  const drainStress = arena.surfaceMod.enduranceMult - 1.0;
  if (drainStress >= ARENA_FIT.DRAIN_DESCRIPTION_THRESHOLD) {
    if (HIGH_AGGRESSION_STYLES.has(warrior.style)) return 'High-drain — tests your stamina';
    return 'Grueling conditions';
  }

  return 'Neutral ground';
}
