import type { GameState, RivalStableData } from '@/types/state.types';
import type { Warrior } from '@/types/warrior.types';
import type { PoolWarrior } from '@/engine/recruitment/recruitment';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { SeededRNG, hashStr, resolveRng } from '@/utils/random';
import { StateImpact } from '@/engine/impacts';
import {
  partialRefreshPool,
  generateRecruit,
  generateApprentice,
  partitionAgedFreeAgents,
  poolWarriorToWarrior,
  signWarrior,
  computeRecruitPoolHardCap,
  ACADEMY_CLAIM_WEEKS,
} from '@/engine/recruitment/recruitment';
import { collectUsedWarriorNames, collectUsedWarriorIds } from '@/engine/core/warriorCollection';
import { orderRivalsForSnakeDraft } from '@/engine/recruitment/draftService';
import { deadIdSet, isActive } from '@/engine/warrior/warriorStatus';
import { retireWithHonors } from '@/engine/warrior/retirement';
import {
  isLegacyFounderCaliber,
  collectCrownedWarriorIds,
  buildLegacyFounderQueueEntry,
} from '@/engine/ai/legacyFounder';
import { aiRosterMax, aiRosterMin } from '@/constants/ai';
import {
  AI_ACADEMY_BONUS_RECRUITS,
  WORLD_RIVAL_FLOOR,
  LEGACY_FOUND_CHANCE,
} from '@/constants/world';

/**
 * Academy first-look: legacy-founded stables (owner.foundedByWarriorId) claim
 * a small slice of the weekly intake, biased toward the founder's favored
 * styles. Apprentices are claimed before open-market recruits — academies
 * raised them. Claims rotate each week so one academy can't lock the intake.
 */
function applyAcademyClaims(pool: PoolWarrior[], state: GameState, week: number): PoolWarrior[] {
  const academies = (state.rivals ?? [])
    .filter((r) => r.owner.foundedByWarriorId)
    .sort((a, b) => (a.id < b.id ? -1 : 1));
  if (academies.length === 0 || pool.length === 0) return pool;

  const rot = week % academies.length;
  const ordered = academies.slice(rot).concat(academies.slice(0, rot));

  const out = pool.map((w) => (w.academyStableId || w.veteran ? w : { ...w }));
  for (const academy of ordered) {
    const favored = new Set(academy.owner.favoredStyles ?? []);
    if (favored.size === 0) continue;
    let claimed = 0;
    const claimable = [
      ...out.filter((w) => w.source === 'apprentice'),
      ...out.filter((w) => w.source !== 'apprentice'),
    ];
    for (const w of claimable) {
      if (claimed >= AI_ACADEMY_BONUS_RECRUITS) break;
      if (w.academyStableId || w.veteran) continue;
      if (!favored.has(w.style)) continue;
      w.academyStableId = academy.id;
      w.academyClaimExpiryWeek = week + ACADEMY_CLAIM_WEEKS;
      w.source = 'academy';
      claimed++;
    }
  }
  return out;
}

/** Clearance ordering reuses the main draft's snake-draft priority. */
const orderRivalsForClearance = orderRivalsForSnakeDraft;

/**
 * Expiring free agents get a clearance-first, honored-retirement exit:
 *  1. Needy rivals (below their roster minimum or flagged needsRecruit) can
 *     sign the veteran at a clearance discount (max(25, half cost)) — plain
 *     treasury, no reserve gate; it's a fire sale.
 *  2. Unsold veterans retire with honors, feed the retired roll, and can
 *     queue as legacy founders; each retiree mentors one apprentice into the
 *     intake and lifts the week's legacy-bloodline odds.
 * Returns the surviving shelf entries plus any side effects.
 */
function drainExpiredFreeAgents(
  expired: PoolWarrior[],
  state: GameState,
  deadIds: ReadonlySet<string>,
  usedIds: Set<string>,
  impact: StateImpact
): { newlyRetired: Warrior[] } {
  if (expired.length === 0) return { newlyRetired: [] };

  const newlyRetired: Warrior[] = [];
  // Working copy — a rival that signs one clearance veteran is less needy
  // for the next one on the wire.
  const rivalsById = new Map((state.rivals ?? []).map((r) => [r.id, r] as const));
  const clearanceItems: string[] = [];

  for (const recruit of expired) {
    const clearanceCost = Math.max(25, Math.floor(recruit.cost * 0.5));
    const needy = orderRivalsForClearance([...rivalsById.values()], state.week).filter(
      (r) =>
        r.roster.filter((w) => isActive(w)).length < aiRosterMin(r.owner?.personality) ||
        r.needsRecruit === true
    );

    let placed = false;
    for (const rival of needy) {
      const clearanceRng = new SeededRNG(
        (state.absoluteWeek ?? state.week) * 37 + hashStr(`${recruit.id}:${rival.id}`)
      );
      const signed = signWarrior({
        recruit,
        roster: rival.roster,
        maxRoster: aiRosterMax(rival.owner?.personality),
        treasury: rival.treasury,
        signingCost: clearanceCost,
        stableId: rival.id,
        rng: clearanceRng,
        usedIds,
        deadIds,
      });
      if (!signed.ok) continue;
      const updated: RivalStableData = {
        ...rival,
        treasury: rival.treasury - signed.costPaid,
        roster: [...rival.roster, signed.warrior],
        needsRecruit: false,
      };
      rivalsById.set(rival.id, updated);
      (impact.rivalsUpdates ??= new Map()).set(rival.id, updated);
      clearanceItems.push(
        `📣 CLEARANCE: ${rival.owner.stableName} signed veteran ${recruit.name} off the free-agent wire for ${signed.costPaid}g.`
      );
      placed = true;
      break;
    }
    if (placed) continue;

    // No buyer — the veteran leaves the market with honors.
    const w = poolWarriorToWarrior(recruit, { deadIds });
    const retired = retireWithHonors(w, state.week);
    (impact.retired ??= []).push(retired);
    newlyRetired.push(retired);
  }

  if (clearanceItems.length > 0) {
    (impact.newsletterItems ??= []).push({
      id: `clearance-${state.week}-${hashStr(clearanceItems.join('|'))}`,
      week: state.week,
      title: 'Transfer Wire',
      items: clearanceItems,
    });
  }
  return { newlyRetired };
}

/**
 * Intake boosts after the base refresh: arena deaths and Mana Surge draw
 * bonus aspirants, and each veteran who left the market this week mentors
 * one apprentice into the pool. Ends with the hard-cap trim — oldest
 * unprotected entries go first; claims and apprentices are never trimmed.
 */
function applyIntakeBoosts(
  recruitPool: PoolWarrior[],
  state: GameState,
  ctx: {
    usedNames: Set<string>;
    rng: IRNGService;
    legacyCandidates: Warrior[];
    legacyChance: number;
    mentorBoosts: number;
    stableCount: number;
  }
): PoolWarrior[] {
  const { rng, legacyCandidates, legacyChance, usedNames, stableCount } = ctx;
  const genBase = {
    rng,
    week: state.week,
    meta: state.cachedMetaDrift,
    legacyCandidates,
    legacyChance,
  };
  const intakeNames = () => new Set<string>([...usedNames, ...recruitPool.map((w) => w.name)]);

  // Post-death pool bonus: each arena death this week draws one extra
  // aspirant into the pool (fame of mortal combat attracts more blood).
  const deathsThisWeek = (state.graveyard ?? []).filter(
    (w) => w.deathWeek === (state.absoluteWeek ?? state.week)
  ).length;
  const bonusCount = Math.min(3, deathsThisWeek);
  for (let i = 0; i < bonusCount; i++) {
    recruitPool.push(generateRecruit({ ...genBase, usedNames: intakeNames() }));
  }

  // Mana Surge — celestial attraction adds exceptional recruits.
  if (state.weather === 'Mana Surge') {
    for (let i = 0; i < 3; i++) {
      recruitPool.push(
        generateRecruit({ ...genBase, usedNames: intakeNames(), forceTier: 'Exceptional' })
      );
    }
  }

  // Mentor boost — each veteran who left the market this week sponsors one
  // apprentice into the intake (hard-cap permitting).
  const hardCap = computeRecruitPoolHardCap(stableCount);
  const mentorBoostCount = Math.min(ctx.mentorBoosts, Math.max(0, hardCap - recruitPool.length));
  for (let i = 0; i < mentorBoostCount; i++) {
    recruitPool.push(generateApprentice({ ...genBase, usedNames: intakeNames() }));
  }

  const over = recruitPool.length - hardCap;
  if (over <= 0) return recruitPool;
  const isProtected = (w: PoolWarrior) =>
    w.source === 'apprentice' ||
    (!!w.academyStableId && (w.academyClaimExpiryWeek ?? 0) >= state.week);
  const droppable = recruitPool
    .filter((w) => !isProtected(w))
    .sort((a, b) => a.addedWeek - b.addedWeek);
  const dropped = new Set(droppable.slice(0, over).map((w) => w.id));
  return [...recruitPool.filter(isProtected), ...droppable.filter((w) => !dropped.has(w.id))];
}

/**
 * Stable Lords — Recruitment Pipeline Pass
 * Handles the weekly refresh of the recruitment pool.
 */
export function runRecruitmentPass(state: GameState, rootRng?: IRNGService): StateImpact {
  const rng = resolveRng(rootRng, (state.absoluteWeek ?? state.week) * 701 + 13);
  const impact: StateImpact = {};

  const deadIds = deadIdSet(state);
  const usedIds = collectUsedWarriorIds(state);

  // 0. Free-agent shelf decay FIRST — expired entries either clear to a needy
  //    stable or retire with honors; their retirements boost the intake below.
  const { surviving, expired } = partitionAgedFreeAgents(state.freeAgents, deadIds);
  const { newlyRetired } = drainExpiredFreeAgents(expired, state, deadIds, usedIds, impact);
  impact.freeAgents = surviving;

  // Legacy-founder queueing for distinguished retirees + this week's
  // bloodline odds (0.05 base + 0.05 per newly retired veteran, capped 0.25).
  const crowned = collectCrownedWarriorIds(state);
  const legacyRng = new SeededRNG((state.absoluteWeek ?? state.week) * 977 + 13);
  const legacyCandidates = [
    ...(state.graveyard || []),
    ...(state.retired || []),
    ...newlyRetired,
  ].filter((w) => w.fame > 1000);
  for (const ret of newlyRetired) {
    if (isLegacyFounderCaliber(ret, crowned) && legacyRng.next() < LEGACY_FOUND_CHANCE) {
      (impact.legacyFounderEnqueue ??= []).push(buildLegacyFounderQueueEntry(ret));
    }
  }
  const legacyChance = Math.min(0.25, 0.05 + newlyRetired.length * 0.05);

  // 1. Refresh recruitment pool
  const usedNames = collectUsedWarriorNames(state);

  const academies = (state.rivals ?? []).filter((r) => r.owner.foundedByWarriorId);
  const apprenticeChance = academies.length > 0 ? 0.1 : 0;

  const stableCount = state.rivals?.length ?? WORLD_RIVAL_FLOOR;
  let recruitPool: PoolWarrior[];

  if (state.weather === 'Blizzard') {
    // Passes are blocked: no new intake reaches the arenas. The pool freezes
    // rather than decimating — the old 40% slice compounded week over week
    // and could strand the world with an unusable pool.
    recruitPool = [...(state.recruitPool ?? [])];
  } else {
    recruitPool = partialRefreshPool({
      currentPool: state.recruitPool || [],
      week: state.week,
      usedNames: usedNames,
      rng: rng,
      meta: state.cachedMetaDrift,
      legacyCandidates: legacyCandidates,
      stableCount: stableCount,
      legacyChance,
      apprenticeChance,
    });

    recruitPool = applyIntakeBoosts(recruitPool, state, {
      usedNames,
      rng,
      legacyCandidates,
      legacyChance,
      mentorBoosts: newlyRetired.length,
      stableCount,
    });
  }

  // 6. Academy first-look claims on the fresh intake.
  recruitPool = applyAcademyClaims(recruitPool, state, state.week);
  impact.recruitPool = recruitPool;

  return impact;
}
