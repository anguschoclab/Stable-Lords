/**
 * Unified signing funnel — every roster-addition path (AI draft, generated
 * fallback, player recruit page, custom build, floor auto-recruit, FTUE,
 * store addWarrior, rosterAdditions impacts) converts a PoolWarrior to a
 * Warrior through here so capacity, identity, and affordability invariants
 * are enforced exactly once.
 */
import type { WarriorId, StableId } from '@/types/shared.types';
import { ATTRIBUTE_MAX } from '@/types/shared.types';
import type { Warrior } from '@/types/warrior.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { resolveRng, hashStr } from '@/utils/random';
import { newWarriorDefaults } from '@/engine/factories/warriorDefaults';
import { veteranSigningPatch } from './recruitment/freeAgents';
import { rollHandedness, applyHandednessAttack } from '@/engine/warrior/skillCalc';
import { getFittedLoadout } from '@/engine/equipment/loadoutFitting';
import { computeWarriorStats } from '@/engine/warrior/skillCalc';
import { conceptPrimaryAttr } from '@/data/fighterConcepts';
import { isActive } from '@/engine/warrior/warriorStatus';
import type { PoolWarrior } from './recruitment/types';

/** Reasons a signing can fail — stable machine-readable codes. */
export type SignWarriorFailure =
  'ROSTER_FULL' | 'INSUFFICIENT_FUNDS' | 'DEAD_IDENTITY' | 'DUPLICATE_ID';

/** Inputs to the signing funnel — everything the gates need to decide. */
export interface SignWarriorArgs {
  /** The pool entry being signed. */
  recruit?: PoolWarrior;
  /** The signing stable's current roster — active warriors count toward the cap. */
  roster: Warrior[];
  /** Active-roster cap for this stable (aiRosterMax / BASE_ROSTER_CAP + bonus). */
  maxRoster: number;
  /** Treasury to charge — when provided the signing cost must be covered. */
  treasury?: number;
  /** Price override (e.g. clearance discounts); defaults to recruit.cost. */
  signingCost?: number;
  /** +2 XP + 'Eager' flair — the player's signing-bonus upsell. */
  signingBonus?: boolean;
  /** Stable the recruit joins. */
  stableId?: StableId;
  /** Deterministic stream — callers pass context-derived seeds. */
  rng?: IRNGService;
  /** Every live warrior id — fresh minted ids re-roll until unique. */
  usedIds?: Set<string>;
  /** Dead-registry ids — the recruit id and forced ids must not appear here. */
  deadIds?: ReadonlySet<string>;
  /** Force a specific roster id (only safe paths — collides to DUPLICATE_ID). */
  forceId?: WarriorId;
  /** Pool shelf the recruit came from — drains the recruit id on success. */
  pool?: PoolWarrior[];
  /** Free-agent shelf — drains the recruit id on success. */
  freeAgents?: PoolWarrior[];
}

/**
 * Signing outcome — on success the roster-ready warrior, what was paid, and
 * the drained shelves; on failure a stable machine-readable reason.
 */
export type SignWarriorResult =
  | {
      ok: true;
      warrior: Warrior;
      costPaid: number;
      updatedPool?: PoolWarrior[];
      updatedFreeAgents?: PoolWarrior[];
    }
  | { ok: false; reason: SignWarriorFailure };

/** Conversion options for poolWarriorToWarrior (no gate checks — the pure
 *  materialization half of the funnel). */
export interface PoolToWarriorOpts {
  stableId?: StableId;
  rng?: IRNGService;
  usedIds?: Set<string>;
  deadIds?: ReadonlySet<string>;
  signingBonus?: boolean;
}

/** Mint a roster id that collides with nothing known — live or dead. */
function mintWarriorId(
  rng: IRNGService,
  usedIds?: Set<string>,
  deadIds?: ReadonlySet<string>
): WarriorId {
  let id = rng.uuid('warrior') as WarriorId;
  while (usedIds?.has(id) || deadIds?.has(id)) {
    id = rng.uuid('warrior') as WarriorId;
  }
  usedIds?.add(id);
  return id;
}

/**
 * Convert a pool entry into a roster Warrior. The recruit's build survives
 * verbatim — attributes, potential, base/derived stats, luckfactor, traits,
 * lore, origin, favorites, lineage, avatarSeed — with fresh-prospect
 * baselines layered on top. Veterans keep identity, fame, and career through
 * veteranSigningPatch; apprentices get their style-primary attribute bump.
 */
export function poolWarriorToWarrior(recruit: PoolWarrior, opts: PoolToWarriorOpts): Warrior {
  const rng = resolveRng(opts.rng, hashStr(String(recruit.id)));

  // Academy graduate flair: +1 to the style's primary attribute (recomputed
  // stats stay coherent), flavour text records the schooling.
  let attributes = { ...recruit.attributes };
  let baseSkills = { ...recruit.baseSkills };
  let derivedStats = { ...recruit.derivedStats };
  const flair: string[] = [];
  if (recruit.source === 'apprentice') {
    const primary = conceptPrimaryAttr(recruit.style);
    if (primary) {
      attributes = {
        ...attributes,
        [primary]: Math.min(ATTRIBUTE_MAX, (attributes[primary] ?? 0) + 1),
      };
      const recalc = computeWarriorStats(attributes, recruit.style);
      baseSkills = recalc.baseSkills;
      derivedStats = recalc.derivedStats;
    }
    flair.push('Academy Graduate');
  }

  // Handedness persists from the recruit sheet — entries minted before the
  // field existed get a roll here (the +1 ATT bump applies only to the
  // freshly-rolled case; baked-in sheets already carry it).
  const handedness = recruit.handedness ?? rollHandedness(rng, recruit.style);
  if (!recruit.handedness) applyHandednessAttack(baseSkills, handedness);

  const warrior: Warrior = {
    ...newWarriorDefaults(),
    // Veterans keep their original id; prospects take a fresh minted one.
    id: recruit.veteran
      ? (recruit.id as WarriorId)
      : mintWarriorId(rng, opts.usedIds, opts.deadIds),
    name: recruit.name,
    style: recruit.style,
    attributes,
    potential: { ...recruit.potential },
    baseSkills,
    derivedStats,
    fame: 10,
    popularity: 5,
    age: recruit.age,
    stableId: opts.stableId,
    lineage: recruit.lineage,
    traits: [...recruit.traits],
    favorites: recruit.favorites,
    luckfactor: { ...recruit.luckfactor },
    bloodlust: recruit.bloodlust,
    handedness,
    trainability: recruit.trainability ?? 0.4 + rng.next() * 0.5,
    // Veteran bout progression rides the pool entry — preserved verbatim so
    // a re-signed warrior keeps everything they earned. Prospects leave
    // these at the fresh-mint defaults above.
    xp: recruit.xp,
    learnedSkills: { ...(recruit.learnedSkills ?? {}) },
    skillDrills: recruit.skillDrills ? { ...recruit.skillDrills } : undefined,
    strategyMemory: recruit.strategyMemory
      ? {
          cells: { ...recruit.strategyMemory.cells },
          recentLossFactors: recruit.strategyMemory.recentLossFactors
            ? [...recruit.strategyMemory.recentLossFactors]
            : undefined,
        }
      : undefined,
    burnedSkills: recruit.burnedSkills ? { ...recruit.burnedSkills } : undefined,
    equipment: recruit.equipment
      ? { ...recruit.equipment }
      : getFittedLoadout(recruit.style, attributes),
    isStarInvestment: recruit.tier === 'Prodigy',
    lore: recruit.lore,
    origin: recruit.origin,
    avatarSeed: recruit.avatarSeed,
    flair,
  };

  if (opts.signingBonus) {
    warrior.xp = (warrior.xp ?? 0) + 2;
    warrior.flair = [...(warrior.flair ?? []), 'Eager'];
  }

  // Veterans (displaced by dissolution or released) keep their identity and
  // career; ordinary recruits take the fresh-prospect defaults above.
  Object.assign(warrior, veteranSigningPatch(recruit));
  return warrior;
}

/**
 * The single gate every roster addition passes through, in order:
 *  1. CAPACITY — active roster count must be below maxRoster.
 *  2. INSUFFICIENT_FUNDS — when a treasury is provided, it must cover the
 *     signing cost (recruit.cost unless signingCost overrides).
 *  3. DEAD_IDENTITY — a recruit whose id is registered dead can never sign.
 *  4. Conversion — a forced id colliding with used/dead ids fails as
 *     DUPLICATE_ID; otherwise a unique id is minted.
 */
export function signWarrior(args: SignWarriorArgs): SignWarriorResult {
  const { recruit, roster, maxRoster } = args;
  const { treasury, signingBonus = false, stableId } = args;
  const { usedIds, deadIds, forceId, pool, freeAgents } = args;

  const activeCount = roster.filter((w) => isActive(w)).length;
  if (activeCount >= maxRoster) {
    return { ok: false, reason: 'ROSTER_FULL' };
  }

  const costPaid = args.signingCost ?? recruit?.cost ?? 0;
  if (treasury !== undefined && treasury < costPaid) {
    return { ok: false, reason: 'INSUFFICIENT_FUNDS' };
  }

  const recruitId = String(recruit?.id);
  if (deadIds?.has(recruitId)) {
    return { ok: false, reason: 'DEAD_IDENTITY' };
  }

  const drain = (shelf: PoolWarrior[] | undefined) =>
    shelf === undefined ? undefined : shelf.filter((p) => p.id !== recruitId);

  if (forceId !== undefined && (usedIds?.has(forceId) || deadIds?.has(forceId))) {
    return { ok: false, reason: 'DUPLICATE_ID' };
  }
  if (!recruit) {
    return { ok: false, reason: 'DUPLICATE_ID' };
  }

  const rng = resolveRng(args.rng, hashStr(String(recruit.id)));
  const warrior = poolWarriorToWarrior(recruit, {
    stableId,
    rng: forceId === undefined ? rng : undefined,
    usedIds,
    deadIds,
    signingBonus,
  });
  if (forceId !== undefined) {
    warrior.id = forceId;
    usedIds?.add(forceId);
  }

  return {
    ok: true,
    warrior,
    costPaid,
    updatedPool: drain(pool),
    updatedFreeAgents: drain(freeAgents),
  };
}
