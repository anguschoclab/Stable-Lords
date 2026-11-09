/**
 * Favorite Weapon & Rhythm Discovery System
 *
 * Each warrior has hidden favorite weapon and OE/AL rhythm generated at creation.
 * The bonuses are ALWAYS ON — discovery only *reveals* them (epiphany rolls,
 * hints, or Insight Tokens). Wielding the favorite raises crit chance, which
 * is what makes the classic "charting" method work: `favorites.chart` keeps a
 * per-weapon swings/crits/knockdowns ledger, so an observant player can deduce
 * the affinity from its statistical signature before it is ever named.
 */
import type { Warrior, WarriorFavorites, WeaponChartEntry } from '@/types/warrior.types';
import { FightingStyle } from '@/types/shared.types';
import type { OffensiveTactic, DefensiveTactic } from '@/types/combat.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { WEAPONS, getAvailableItems } from '@/data/equipment';
import { SeededRNG, hashStr } from '@/utils/random';
import { warriorDisplayName } from '@/utils/warriorDisplay';
import { favoriteLearnOf } from '@/engine/learning';
import { FAVORITE_TACTIC_BONUS } from '@/constants/combat';
import {
  getOffensiveSuitability,
  getDefensiveSuitability,
} from '@/engine/strategy/tacticSuitability';

// ─── Generation ─────────────────────────────────────────────────────────

/**
 * Preferred OE/AL ranges per style (favorites are drawn from these).
 *
 * Tuned 2026-04: AB and WS had default-plan OE values that fell *outside*
 * their favorite-rhythm ranges, making the rhythm-match +INI bonus
 * structurally impossible to earn via the default plan. PR's range was
 * narrow enough to make the perfect match a 1-in-9 chance.
 *
 * Widened so each style's defaultPlan OE/AL falls inside the favorite range,
 * and slightly broadened to give more variance across warriors.
 */
const STYLE_RHYTHM_RANGES: Record<FightingStyle, { oe: [number, number]; al: [number, number] }> = {
  [FightingStyle.AimedBlow]: { oe: [4, 7], al: [4, 6] }, // widened OE to include default 6
  [FightingStyle.BashingAttack]: { oe: [7, 9], al: [2, 5] }, // widened AL to include default 3
  [FightingStyle.LungingAttack]: { oe: [6, 9], al: [6, 9] },
  // Tripwire (Arena 93): PL favorites run VL-HI OE and LO-VH AL — no VH OE, no VL AL.
  [FightingStyle.ParryLunge]: { oe: [1, 8], al: [3, 10] },
  [FightingStyle.ParryRiposte]: { oe: [3, 6], al: [4, 7] }, // widened to give PR more variance
  [FightingStyle.ParryStrike]: { oe: [4, 7], al: [4, 7] },
  // Canon 65-graduate distribution (Jorja): no OE favorite below 5, AL runs
  // 1–6 with low activity dominant — the slasher runs hot, not busy.
  [FightingStyle.SlashingAttack]: { oe: [5, 10], al: [1, 6] },
  [FightingStyle.StrikingAttack]: { oe: [6, 9], al: [4, 7] },
  [FightingStyle.TotalParry]: { oe: [1, 4], al: [1, 4] },
  [FightingStyle.WallOfSteel]: { oe: [5, 9], al: [2, 7] }, // canon: berserker sheets open OE 9; the 18-11 graduate favored moderate OE over low AL
};

/**
 * V24 canon (Pagan's favorites chart): tactics a style can roll as a
 * favorite — the WS-rated set, weighted by the article's observed counts
 * where published (PR/PS/PL); uniform elsewhere.
 */
export const FAVORITE_TACTIC_POOLS: Partial<
  Record<FightingStyle, { tactic: string; weight: number }[]>
> = {
  [FightingStyle.ParryRiposte]: [
    { tactic: 'Lunge', weight: 3 },
    { tactic: 'Riposte', weight: 11 },
    { tactic: 'Parry', weight: 6 },
  ],
  [FightingStyle.ParryStrike]: [
    { tactic: 'Decisiveness', weight: 12 },
    { tactic: 'Responsiveness', weight: 9 },
    { tactic: 'Dodge', weight: 9 },
    { tactic: 'Riposte', weight: 1 },
    { tactic: 'Parry', weight: 8 },
  ],
  [FightingStyle.ParryLunge]: [
    { tactic: 'Lunge', weight: 23 },
    { tactic: 'Dodge', weight: 12 },
    { tactic: 'Parry', weight: 12 },
  ],
};

/**
 * Bonus applied when the fighter's plan uses their (hidden) favorite tactic —
 * weapon-crit parity (Godling Heresy): fires whether or not the favorite is
 * discovered, just like the favorite-weapon crit chance.
 */
export function getFavoriteTacticBonus(
  warrior: { favorites?: WarriorFavorites },
  tactic: string | undefined
): number {
  const fav = warrior.favorites?.tactic;
  if (!fav || !tactic || tactic === 'none') return 0;
  return fav === tactic ? FAVORITE_TACTIC_BONUS : 0;
}

/**
 * Styles without published favorite-tactic counts roll uniformly over their
 * WS-rated set (Pagan: a favorite can only come from the WS pool).
 */
function defaultFavoriteTacticPool(style: FightingStyle): { tactic: string; weight: number }[] {
  const off: OffensiveTactic[] = ['Lunge', 'Slash', 'Bash', 'Decisiveness'];
  const def: DefensiveTactic[] = ['Dodge', 'Parry', 'Riposte', 'Responsiveness'];
  const suited = [
    ...off.filter((t) => getOffensiveSuitability(style, t) === 'WS'),
    ...def.filter((t) => getDefensiveSuitability(style, t) === 'WS'),
  ];
  return suited.map((tactic) => ({ tactic, weight: 1 }));
}

/**
 * Every tactic a style can roll as a favorite — the canon weighted pool
 * where published, else the uniform WS-suited set. Shared by generation
 * and the strategy lab's explore probes (V26: the AI can only organically
 * *earn* a tactic discovery by fighting tactics the dice could roll).
 */
export function favoriteTacticPool(style: FightingStyle): { tactic: string; weight: number }[] {
  return FAVORITE_TACTIC_POOLS[style] ?? defaultFavoriteTacticPool(style);
}

/** Generate hidden favorites for a warrior at creation */
export function generateFavorites(style: FightingStyle, rng: IRNGService): WarriorFavorites {
  const r = () => rng.next();
  // Favorite weapon: draw randomly from style-appropriate pool (no bias toward canonical gear)
  // This allows for "unideal" but legal favorites (e.g. lightweight warrior favoring a medium weapon)
  const available = getAvailableItems('weapon', style);
  const weaponId = available[Math.floor(r() * available.length)]?.id ?? 'broadsword';

  // Favorite rhythm: 80% chance of style-standard range, 20% global "weird" range
  const useStyleRange = r() < 0.8;
  let oe: number, al: number;

  if (useStyleRange) {
    const range = STYLE_RHYTHM_RANGES[style];
    oe = range.oe[0] + Math.floor(r() * (range.oe[1] - range.oe[0] + 1));
    al = range.al[0] + Math.floor(r() * (range.al[1] - range.al[0] + 1));
  } else {
    oe = 1 + Math.floor(r() * 9);
    al = 1 + Math.floor(r() * 9);
  }

  // Favorite tactic (V24 canon): weighted draw from the style's WS pool.
  const tacticPool = favoriteTacticPool(style);
  const tacticTotal = tacticPool.reduce((s, p) => s + p.weight, 0);
  let tacticRoll = r() * tacticTotal;
  let tactic = tacticPool[0]?.tactic;
  for (const p of tacticPool) {
    tacticRoll -= p.weight;
    if (tacticRoll < 0) {
      tactic = p.tactic;
      break;
    }
  }

  return {
    weaponId,
    rhythm: { oe, al },
    tactic,
    discovered: {
      weapon: false,
      rhythm: false,
      weaponHints: 0,
      rhythmHints: 0,
      learn: false,
      learnHints: 0,
      tactic: false,
      tacticHints: 0,
    },
  };
}

// ─── Discovery ──────────────────────────────────────────────────────────

const CHANCE_REVEAL_BASE = 0.02; // 2% "Lucky Epiphany"
const CHANCE_REVEAL_SYMMETRY = 0.25; // 25% if using correct gear
const CHANCE_HINT = 0.1; // 10% chance to learn a hint regardless

/**
 *
 */
export interface DiscoveryResult {
  updated: boolean;
  hints: string[];
  weaponRevealed: boolean;
  rhythmRevealed: boolean;
  learnRevealed: boolean;
  tacticRevealed: boolean;
}

interface RollOutcome {
  revealed: boolean;
  hint?: string;
}

const HINT_CAP = 2;

/** Symmetry-or-base reveal + capped hint accrual — the shape every channel
 *  shares. `revealChance: null` skips the reveal draw entirely (the learn
 *  channel only rolls reveal when the bout actually learned the affinity —
 *  preserving its original one-draw shape when it didn't). */
function rollChannel(
  revealChance: number | null,
  revealedLine: string,
  hintLine: string,
  hintsUsed: number,
  next: () => number
): { outcome: RollOutcome; hintAccrued: boolean } {
  if (revealChance !== null && next() < revealChance) {
    return { outcome: { revealed: true, hint: revealedLine }, hintAccrued: false };
  }
  if (next() < CHANCE_HINT && hintsUsed < HINT_CAP) {
    return { outcome: { revealed: false, hint: hintLine }, hintAccrued: true };
  }
  return { outcome: { revealed: false }, hintAccrued: false };
}

function rollWeaponDiscovery(warrior: Warrior, fav: WarriorFavorites, context: DiscoveryContext, r: () => number): RollOutcome {
  if (fav.discovered.weapon) return { revealed: false };
  const isUsingFav = context.weaponId === fav.weaponId;
  const weaponItem = WEAPONS.find((w) => w.id === fav.weaponId);
  const name = weaponItem?.name ?? fav.weaponId;
  const { outcome, hintAccrued } = rollChannel(
    isUsingFav ? CHANCE_REVEAL_SYMMETRY : CHANCE_REVEAL_BASE,
    isUsingFav
      ? `EUREKA! ${warriorDisplayName(warrior)} has mastered the ${name}!`
      : `Insight: ${warriorDisplayName(warrior)} realizes their true weapon preference is the ${name}.`,
    `Observing: ${warriorDisplayName(warrior)} is developing a distinct feel for certain weapons...`,
    fav.discovered.weaponHints,
    r
  );
  if (outcome.revealed) fav.discovered.weapon = true;
  else if (hintAccrued) fav.discovered.weaponHints++;
  return outcome;
}

function rollRhythmDiscovery(warrior: Warrior, fav: WarriorFavorites, context: DiscoveryContext, r: () => number): RollOutcome {
  if (fav.discovered.rhythm) return { revealed: false };
  const isMatchingRhythm =
    context.oe != null &&
    context.al != null &&
    Math.abs(context.oe - fav.rhythm.oe) <= 1 &&
    Math.abs(context.al - fav.rhythm.al) <= 1;
  const { outcome, hintAccrued } = rollChannel(
    isMatchingRhythm ? CHANCE_REVEAL_SYMMETRY : CHANCE_REVEAL_BASE,
    `EUREKA! ${warriorDisplayName(warrior)} has found their natural soul-rhythm: OE ${fav.rhythm.oe}, AL ${fav.rhythm.al}!`,
    `Observing: ${warriorDisplayName(warrior)} is finding their own unique rhythm in the chaos of battle.`,
    fav.discovered.rhythmHints,
    r
  );
  if (outcome.revealed) fav.discovered.rhythm = true;
  else if (hintAccrued) fav.discovered.rhythmHints++;
  return outcome;
}

/** A warrior who just learned in their hidden affinity skill may realize the
 *  pattern (symmetry epiphany). `learn` is absent on legacy saves; `?? false`
 *  keeps them eligible. */
function rollLearnDiscovery(warrior: Warrior, fav: WarriorFavorites, context: DiscoveryContext, r: () => number): RollOutcome {
  if (fav.discovered.learn ?? false) return { revealed: false };
  const learnedFavorite = context.learnedFavorite === true;
  const { outcome, hintAccrued } = rollChannel(
    learnedFavorite ? CHANCE_REVEAL_SYMMETRY : null,
    `EUREKA! ${warriorDisplayName(warrior)} senses an unusual aptitude for ${favoriteLearnOf(warrior)} — lessons in it come easily!`,
    `Observing: ${warriorDisplayName(warrior)} is absorbing some lessons faster than others...`,
    fav.discovered.learnHints ?? 0,
    r
  );
  if (outcome.revealed) fav.discovered.learn = true;
  else if (hintAccrued) fav.discovered.learnHints = (fav.discovered.learnHints ?? 0) + 1;
  return outcome;
}

/** The fought plan ran the hidden favorite → symmetry epiphany. Draws on a
 *  dedicated (warrior, week) sub-stream so the shared bout stream's
 *  consumption order is untouched whether or not the bout supplied tactic
 *  context (V26 parity — one shared discovery system for every stable). */
function rollTacticDiscovery(warrior: Warrior, fav: WarriorFavorites, context: DiscoveryContext): RollOutcome {
  if ((fav.discovered.tactic ?? false) || !fav.tactic) return { revealed: false };
  const sub = new SeededRNG(hashStr(`${warrior.id}|tactic-discovery|${context.week ?? 0}`));
  const isUsingFavTactic =
    context.offensiveTactic === fav.tactic || context.defensiveTactic === fav.tactic;
  const { outcome, hintAccrued } = rollChannel(
    isUsingFavTactic ? CHANCE_REVEAL_SYMMETRY : CHANCE_REVEAL_BASE,
    `EUREKA! ${warriorDisplayName(warrior)} feels an uncanny instinct for ${fav.tactic}!`,
    `Observing: ${warriorDisplayName(warrior)} keeps gravitating toward a favorite technique...`,
    fav.discovered.tacticHints ?? 0,
    () => sub.next()
  );
  if (outcome.revealed) fav.discovered.tactic = true;
  else if (hintAccrued) fav.discovered.tacticHints = (fav.discovered.tacticHints ?? 0) + 1;
  return outcome;
}

interface DiscoveryContext {
  weaponId?: string;
  oe?: number;
  al?: number;
  learnedFavorite?: boolean;
  week?: number;
  offensiveTactic?: string;
  defensiveTactic?: string;
}

/**
 *
 */
export function checkDiscovery(
  warrior: Warrior,
  rng: IRNGService,
  context?: DiscoveryContext
): DiscoveryResult {
  const r = () => rng.next();
  const fav = warrior.favorites;
  const result: DiscoveryResult = {
    updated: false,
    hints: [],
    weaponRevealed: false,
    rhythmRevealed: false,
    learnRevealed: false,
    tacticRevealed: false,
  };
  if (!fav) return result;

  const ctx = context ?? {};
  const rolls: [RollOutcome, keyof Pick<DiscoveryResult, 'weaponRevealed' | 'rhythmRevealed' | 'learnRevealed' | 'tacticRevealed'>][] = [
    [rollWeaponDiscovery(warrior, fav, ctx, r), 'weaponRevealed'],
    [rollRhythmDiscovery(warrior, fav, ctx, r), 'rhythmRevealed'],
    [rollLearnDiscovery(warrior, fav, ctx, r), 'learnRevealed'],
    [rollTacticDiscovery(warrior, fav, ctx), 'tacticRevealed'],
  ];
  for (const [roll, flag] of rolls) {
    if (roll.revealed) result[flag] = true;
    if (roll.hint) result.hints.push(roll.hint);
    if (roll.revealed || roll.hint) result.updated = true;
  }
  return result;
}

// ─── Combat Bonuses ─────────────────────────────────────────────────────

/** True when the fighter is wielding their favorite weapon — known or not.
 *  The favorite bonus is always on; discovery only *reveals* it. This is what
 *  makes weapon charting work: the elevated performance is visible in the
 *  swing/crit ledger before the affinity is ever named. */
export function isWieldingFavoriteWeapon(
  favorites: WarriorFavorites | undefined,
  weaponId: string | undefined
): boolean {
  return !!favorites && !!weaponId && favorites.weaponId === weaponId;
}

/**
 * Get INI bonus from matching favorite rhythm.
 *
 * - Perfect match (exact OE and AL) → +2 INI
 * - Close match (within ±1 of both axes) → +1 INI
 * - Otherwise → 0
 *
 * Widened from "exact only" 2026-04: the perfect-match-only rule meant the
 * bonus was a 1-in-9 lottery for warriors whose default plan was inside the
 * favorite range, and structurally impossible for AB/WS whose defaults were
 * outside. The ±1 "close match" tier gives a more reliable bonus while still
 * rewarding plans that exactly hit the warrior's natural rhythm.
 *
 * V25 canon (Assur): the rhythm bonus is always on — like the favorite
 * weapon, discovery only *reveals* the affinity to the manager; the
 * warrior fights better at their natural rhythm whether or not anyone
 * has charted it.
 */
export function getFavoriteRhythmBonus(
  warrior: { favorites?: WarriorFavorites },
  currentOE: number,
  currentAL: number
): number {
  const fav = warrior.favorites;
  if (!fav) return 0;
  const oeDelta = Math.abs(currentOE - fav.rhythm.oe);
  const alDelta = Math.abs(currentAL - fav.rhythm.al);
  if (oeDelta === 0 && alDelta === 0) return 2; // perfect match
  if (oeDelta <= 1 && alDelta <= 1) return 1; // close match
  return 0;
}

// ─── Charting ────────────────────────────────────────────────────────────

/** Minimum swings before a weapon's chart row means anything. */
export const CHART_MIN_SWINGS = 10;
/** Crits-per-swing rate that reads as a real affinity signal. */
export const CHART_SIGNAL_CRIT_RATE = 0.15;

/**
 * The weapon the evidence points at — the "charting" deduction.
 *
 * - Discovered favorite → that weapon, always.
 * - Otherwise the chart row whose crits-per-swing rate crosses the signal
 *   threshold over a meaningful sample (highest rate wins).
 * - No evidence yet → undefined.
 *
 * Players read this off the Weapon Chart UI; AI stables feed it into their
 * weekly armory pass. Legality/wieldability checks are the caller's job —
 * this only says what the evidence suggests.
 */
export function suspectedFavoriteWeapon(
  favorites: WarriorFavorites | undefined
): string | undefined {
  if (!favorites) return undefined;
  if (favorites.discovered.weapon) return favorites.weaponId;
  let bestId: string | undefined;
  let bestRate = 0;
  for (const [weaponId, row] of Object.entries(favorites.chart ?? {})) {
    if (row.swings < CHART_MIN_SWINGS) continue;
    const rate = row.crits / row.swings;
    if (rate >= CHART_SIGNAL_CRIT_RATE && rate > bestRate) {
      bestRate = rate;
      bestId = weaponId;
    }
  }
  return bestId;
}

/**
 * Merge a bout's per-weapon charting tally into the warrior's persistent
 * `favorites.chart` ledger. Returns a fresh favorites object when the tally
 * changed anything, or undefined when there is nothing to record (no
 * favorites, no tally) so callers can skip the state write.
 */
export function mergeWeaponChart(
  favorites: WarriorFavorites | undefined,
  tally: Record<string, WeaponChartEntry> | undefined
): WarriorFavorites | undefined {
  if (!favorites || !tally) return undefined;
  const chart = { ...(favorites.chart ?? {}) };
  let changed = false;
  for (const [weaponId, row] of Object.entries(tally)) {
    const prev = chart[weaponId] ?? { swings: 0, crits: 0, knockdowns: 0, critDamages: 0 };
    chart[weaponId] = {
      swings: prev.swings + row.swings,
      crits: prev.crits + row.crits,
      knockdowns: prev.knockdowns + row.knockdowns,
      critDamages: (prev.critDamages ?? 0) + (row.critDamages ?? 0),
    };
    changed = true;
  }
  if (!changed) return undefined;
  return { ...favorites, chart };
}

/** Apply Insight Token — instantly reveals weapon, rhythm, or favorite learn */
export function applyInsightToken(
  warrior: Warrior,
  type: 'weapon' | 'rhythm' | 'learn'
): string {
  const fav = warrior.favorites;
  if (!fav) return `${warriorDisplayName(warrior)} has no hidden favorites.`;

  if (type === 'weapon') {
    if (fav.discovered.weapon)
      return `${warriorDisplayName(warrior)} already knows their favorite weapon.`;
    fav.discovered.weapon = true;
    const weaponItem = WEAPONS.find((w) => w.id === fav.weaponId);
    return `Weapon Insight Token used! ${warriorDisplayName(warrior)}'s favorite weapon is the ${weaponItem?.name ?? fav.weaponId}.`;
  }
  if (type === 'learn') {
    if (fav.discovered.learn)
      return `${warriorDisplayName(warrior)} already knows their favorite learn.`;
    fav.discovered.learn = true;
    return `Learn Insight Token used! ${warriorDisplayName(warrior)} learns ${favoriteLearnOf(warrior)} fastest — lessons in it stick.`;
  }
  if (fav.discovered.rhythm)
    return `${warriorDisplayName(warrior)} already knows their natural rhythm.`;
  fav.discovered.rhythm = true;
  return `Rhythm Insight Token used! ${warriorDisplayName(warrior)}'s natural rhythm is OE ${fav.rhythm.oe}, AL ${fav.rhythm.al}.`;
}
