import type { Warrior } from '@/types/warrior.types';
import type { ArenaConfig, FightPlan } from '@/types/shared.types';
import { FightingStyle } from '@/types/shared.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import {
  getWeaponPreferredRange,
  ARENA_SIZE_PROFILES,
  RANGE_ORDER,
} from '@/engine/combat/mechanics/distanceResolution';
import { getAllArenas, getArenaById } from '@/data/arenas';
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
  const startIdx = RANGE_ORDER.indexOf(profile.startRange);

  if (prefIdx <= maxIdx) {
    // Preferred range is reachable — reward proximity to preference
    const distanceFromPref = Math.abs(prefIdx - startIdx);
    score +=
      ARENA_FIT.RANGE_FIT_MAX -
      Math.min(ARENA_FIT.RANGE_FIT_MAX, distanceFromPref * ARENA_FIT.RANGE_DISTANCE_PENALTY);
  } else {
    // Preferred range is beyond the cap — penalise
    const overshoot = prefIdx - maxIdx;
    score -= overshoot * ARENA_FIT.RANGE_OVERSHOOT_PENALTY;
  }

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
      if (tag === 'uneven' && INITIATIVE_STYLES.has(warrior.style)) {
        score -= ARENA_FIT.UNEVEN_INITIATIVE_PENALTY * tagConfig.weight;
      }
    }
  }

  return score;
}

// ─── Matchup arena selection ───────────────────────────────────────────────────

/**
 * Select an arena for a bout, slightly favouring the designated `favorWarrior`.
 * Uses weighted random selection (not deterministic max) so the same matchup can
 * occur in different arenas across different seeds — preserves variety.
 *
 * Tournament arena (`bloodsands_arena`) is always excluded.
 *
 * @param favorWarrior - The warrior whose fit is weighted more heavily (player-side).
 * @param otherWarrior - The opposing warrior.
 * @param rng - Seeded RNG — all randomness must come from here.
 * @param opts.favorWeight - Score multiplier for favorWarrior (default 1.2).
 * @returns arena id string
 */
export function selectArenaForMatchup(
  favorWarrior: Warrior,
  otherWarrior: Warrior,
  rng: IRNGService,
  opts?: { favorWeight?: number; planA?: FightPlan; planB?: FightPlan }
): string {
  const favorWeight = opts?.favorWeight ?? ARENA_SELECTION.FAVOR_WEIGHT_DEFAULT;
  const excludedIds = new Set<string>(ARENA_SELECTION.EXCLUDED_ARENA_IDS);
  const arenas = getAllArenas().filter((a) => !excludedIds.has(a.id));

  if (arenas.length === 0) return 'standard_arena';

  const scores = arenas.map((arena) => {
    const fitFavor = scoreArenaFitForWarrior(favorWarrior, arena, opts?.planA);
    const fitOther = scoreArenaFitForWarrior(otherWarrior, arena, opts?.planB);
    return fitFavor * favorWeight + fitOther;
  });

  // Shift all scores to be non-negative (softmax-style weighted draw)
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
