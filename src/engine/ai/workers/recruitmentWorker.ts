import { type RivalStableData, type PoolWarrior, type Warrior } from '@/types/state.types';
import { PERSONALITY_STYLE_PREFS } from '@/data/ownerData';
import { logAgentAction, logFinanceEvent } from '../agentCore';
import { checkBudget } from './budgetWorker';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { isActive } from '@/engine/warrior/warriorStatus';
import {
  aiRosterMax,
  aiRosterMin,
  AI_GENERATED_RECRUIT_COST,
  AI_DRAFT_URGENT_PRICE_SCALE,
  PERSONALITY_DRAFT_WEIGHTS,
  DEFAULT_DRAFT_WEIGHTS,
} from '@/constants/ai';
import { AI_RECRUITS_PER_WEEK_MAX } from '@/constants/world';
import { generateAIRecruit } from '@/engine/owner/roster/recruitGenerator';
import { signWarrior } from '@/engine/recruitment/recruitment';
import { competenceJitter } from '../competence';
import { classifyArchetype } from '@/data/warriorArchetypes';
import type { StyleMeta } from '@/engine/analytics/metaDrift';
import type { FightingStyle } from '@/types/shared.types';
import { keySet } from '@/utils/collections';

// NARRATIVE AUDIT 2026: Origin string generation and lore traits are dynamically sourced from registries. No manual wiring needed for new additions to populate AI stable pools and scouting reports.

/** Return type of processRecruitment — updatedPool is the authoritative
 * draft shelf handed to the next rival. */
type RecruitmentResult = {
  updatedRival: RivalStableData;
  updatedPool: PoolWarrior[];
  gazetteItems: string[];
};

interface SignGeneratedRecruitArgs {
  updatedRival: RivalStableData;
  week: number;
  meta: StyleMeta | undefined;
  gazetteItems: string[];
  usedNames?: Set<string>;
  usedIds?: Set<string>;
  deadIds?: ReadonlySet<string>;
}

/**
 * Pool-empty fallback: generates a recruit out of thin air ONLY when the
 * stable declared a need and can afford the signing fee through the same
 * budget check as pool drafts (generateAIRecruit is no longer a
 * parallel recruitment path). Consumes no pool entry, so it returns only
 * the updated stable — the caller's remainingPool passes through untouched.
 */
function signGeneratedRecruit(
  args: SignGeneratedRecruitArgs
): { updatedRival: RivalStableData } | null {
  const { week, meta, gazetteItems, usedNames } = args;
  let { updatedRival } = args;
  const { usedIds, deadIds } = args;
  const budgetReport = checkBudget(updatedRival, AI_GENERATED_RECRUIT_COST, 'ROSTER');
  if (!budgetReport.isAffordable) return null;
  const generated = generateAIRecruit({
    rival: updatedRival,
    week: week,
    meta: meta,
    seed: undefined,
    usedNames: usedNames,
    usedIds: usedIds,
  });
  if (!generated) return null;
  const signed = signWarrior({
    recruit: generated,
    roster: updatedRival.roster,
    maxRoster: aiRosterMax(updatedRival.owner.personality),
    treasury: updatedRival.treasury,
    signingCost: AI_GENERATED_RECRUIT_COST,
    stableId: updatedRival.id,
    deadIds: deadIds,
  });
  if (!signed.ok) return null;
  usedNames?.add(generated.name);
  updatedRival = {
    ...updatedRival,
    treasury: updatedRival.treasury - signed.costPaid,
    roster: [...updatedRival.roster, signed.warrior],
    needsRecruit: false,
  };
  updatedRival = logFinanceEvent(updatedRival, {
    label: `Recruit signing — ${generated.name}`,
    amount: -AI_GENERATED_RECRUIT_COST,
    week,
    category: 'recruit',
    description: `Paid ${AI_GENERATED_RECRUIT_COST}g signing fee for ${generated.name}.`,
    riskTier: budgetReport.riskTier,
  });
  updatedRival = logAgentAction({
    rival: updatedRival,
    type: 'ROSTER',
    description: `Signed recruit ${generated.name} for ${AI_GENERATED_RECRUIT_COST}g.`,
    riskTier: budgetReport.riskTier,
    week: week,
    cause: 'ROSTER_DIVERSITY',
  });
  gazetteItems.push(
    `📣 MARKET: ${updatedRival.owner.stableName} signed ${generated.name} for ${AI_GENERATED_RECRUIT_COST}g.`
  );
  return { updatedRival };
}

interface ScoreCandidatesArgs {
  pool: PoolWarrior[];
  roster: Warrior[];
  personality: string;
  week: number;
  meta: StyleMeta | undefined;
  favoredStyles?: FightingStyle[];
  owner?: Pick<RivalStableData['owner'], 'id' | 'competence'>;
  intent?: string;
  /** Roster-vacancy pressure (needsRecruit or below the roster floor) —
   *  relaxes the price penalty so an urgent stable stops haggling. */
  urgent: boolean;
}

/**
 * Scores pool candidates through the personality weights table: tier
 * appetite, price sensitivity, veteran appetite, style match (personality
 * prefs ∪ founder favored styles), roster-balance duplicates, meta drift,
 * youth/ready-now bonuses, and time-in-pool pressure.
 */
type DraftWeights = typeof DEFAULT_DRAFT_WEIGHTS;

/**
 * V27 tourney-archetype bias — campaign stables scout winning frames, not
 * just wit: the best classifyArchetype fit drives the bonus, so a scum/AB
 * Rookies profile and a 21-WT Champions frame both score. 0–40 ceiling
 * matches the pre-archetype WT threshold's weight.
 */
export function tourneyDraftBonus(w: PoolWarrior, intent: string | undefined): number {
  if (intent !== 'TOURNAMENT_CAMPAIGN') return 0;
  const best = classifyArchetype(w.attributes ?? {}, w.style)[0]?.score ?? 0;
  return Math.round(best * 0.4);
}

/**
 * Price appetite — thrifty personalities discount expensive recruits; a
 * vacancy-pressed stable stops haggling and pays nearer the asking price
 * (solvency stays checkBudget's job — urgency only reorders preference).
 */
function pricePenalty(cost: number, weights: DraftWeights, urgent: boolean): number {
  const sensitivity = urgent
    ? weights.priceSensitivity * AI_DRAFT_URGENT_PRICE_SCALE
    : weights.priceSensitivity;
  return (cost * sensitivity) / 100;
}

/** Scores one pool candidate against the personality weights table. */
function scoreCandidate(
  w: PoolWarrior,
  weights: DraftWeights,
  ctx: {
    prefsSet: Set<FightingStyle>;
    activeStyleCounts: Map<string, number>;
    meta: StyleMeta | undefined;
    owner: Pick<RivalStableData['owner'], 'id' | 'competence'> | undefined;
    week: number;
    intent?: string;
    urgent: boolean;
  }
): number {
  const { prefsSet, activeStyleCounts, meta, owner, week } = ctx;
  let score = 0;
  score += weights.tierBonus[w.tier] ?? 0;
  if (prefsSet.has(w.style)) score += weights.styleMatchBonus;
  if (w.veteran) score += weights.veteranBonus;

  score += tourneyDraftBonus(w, ctx.intent);

  // ⚡ TSA: Meta-Fit Scoring
  const drift = meta?.[w.style] || 0;
  score += drift * 5; // Reward styles that are trending up

  // ⚡ TSA: Style Diversity Guard
  const styleCount = activeStyleCounts.get(w.style) ?? 0;
  if (styleCount > 0) {
    score -= styleCount * weights.duplicatePenalty;
  }

  // Youth appetite — Methodical prospect-hunting.
  if (weights.youthBonusPerYear > 0 && w.age < 21) {
    score += (21 - w.age) * weights.youthBonusPerYear;
  }

  // Ready-now appetite — Aggressive wants attribute totals today.
  if (weights.readyBonusPerPoint > 0) {
    // for…in + typeof ≡ Object.values().reduce(+(typeof number ? v : 0)) —
    // same enumerable keys, same numeric-only sum, no array allocation.
    let attrTotal = 0;
    for (const k in w.attributes ?? {}) {
      const v = w.attributes[k as keyof typeof w.attributes];
      if (typeof v === 'number') attrTotal += v;
    }
    score += Math.max(0, attrTotal - 70) * weights.readyBonusPerPoint;
  }

  score -= pricePenalty(w.cost, weights, ctx.urgent);

  // Competence noise — a Novice front office misevaluates candidates while
  // a Master nearly always spots the best value. Deterministic
  // per (owner, candidate, week) so shard order can't change the pick.
  score += competenceJitter(owner, `draft|${w.id}|${week}`, 25);

  const weeksAvailable = week - w.addedWeek;
  score += weeksAvailable * 10;

  return score;
}

function scoreCandidates(args: ScoreCandidatesArgs): { bestIdx: number; bestScore: number } {
  const { pool, roster, personality, week, meta } = args;
  const { favoredStyles } = args;
  const weights =
    PERSONALITY_DRAFT_WEIGHTS[personality as keyof typeof PERSONALITY_DRAFT_WEIGHTS] ??
    DEFAULT_DRAFT_WEIGHTS;
  const prefs = PERSONALITY_STYLE_PREFS[personality as keyof typeof PERSONALITY_STYLE_PREFS] || [];
  const prefsSet = new Set<FightingStyle>([...prefs, ...(favoredStyles ?? [])]);

  const activeStyleCounts = new Map<string, number>();
  for (const r of roster) {
    if (!isActive(r)) continue;
    activeStyleCounts.set(r.style, (activeStyleCounts.get(r.style) ?? 0) + 1);
  }

  let bestIdx = -1;
  let bestScore = -Infinity;

  for (let i = 0; i < pool.length; i++) {
    const w = pool[i];
    if (!w) continue;
    const score = scoreCandidate(w, weights, {
      prefsSet,
      activeStyleCounts,
      meta,
      owner: args.owner,
      week,
      intent: args.intent,
      urgent: args.urgent,
    });
    if (score > bestScore) {
      bestScore = score;
      bestIdx = i;
    }
  }
  return { bestIdx, bestScore };
}

interface DraftPoolSigningsArgs {
  updatedRival: RivalStableData;
  remainingPool: PoolWarrior[];
  visible: PoolWarrior[];
  week: number;
  rng: IRNGService;
  meta: StyleMeta | undefined;
  personality: string;
  favoredStyles: FightingStyle[] | undefined;
  ctx: {
    slotsAvailable: number;
    needsRecruit: boolean;
    minRoster: number;
    maxRoster: number;
    isMajorDraftWeek: boolean;
    gazetteItems: string[];
    usedIds?: Set<string>;
    deadIds?: ReadonlySet<string>;
  };
}

/**
 * Score the visible shelf for one draft slot. Vacancy pressure (declared
 * needsRecruit or a roster below its floor) marks the pick urgent so the
 * scorer relaxes its price penalty — urgency decays as signings refill the
 * roster, so only the first pick(s) under pressure pay nearer asking.
 */
function scoreSlot(
  args: DraftPoolSigningsArgs,
  visible: PoolWarrior[],
  activeCount: number
): { bestIdx: number; bestScore: number; urgent: boolean } {
  const urgent = args.ctx.needsRecruit || activeCount < args.ctx.minRoster;
  const { bestIdx, bestScore } = scoreCandidates({
    pool: visible,
    roster: args.updatedRival.roster,
    personality: args.personality,
    week: args.week,
    meta: args.meta,
    favoredStyles: args.favoredStyles,
    owner: args.updatedRival.owner,
    intent: args.updatedRival.strategy?.intent,
    urgent: urgent,
  });
  return { bestIdx, bestScore, urgent };
}

/**
 * Weekly draft loop: up to `slotsAvailable` signings, best-scored candidate
 * first, with the quality gate dropped for desperate stables, price haggling
 * relaxed under roster-vacancy pressure, and a skip-to-next-best path when
 * the top candidate is unaffordable.
 */
function draftPoolSignings(args: DraftPoolSigningsArgs): {
  updatedRival: RivalStableData;
  signings: number;
} {
  const { remainingPool, visible, week, rng } = args;
  let { updatedRival } = args;
  const { ctx } = args;
  let signings = 0;
  let activeCount = updatedRival.roster.reduce((n, w) => n + (isActive(w) ? 1 : 0), 0);
  // Membership tracker for remainingPool — removals are deferred and the
  // array compacted in place once after the loop (order preserved).
  const remainingIds = keySet(remainingPool, (p) => p.id);
  for (let slot = 0; slot < ctx.slotsAvailable; slot++) {
    const { bestIdx, bestScore, urgent } = scoreSlot(args, visible, activeCount);
    if (bestIdx < 0) break;
    const recruit = visible[bestIdx];
    if (!recruit) break;

    const qualityGate = bestScore > 0;
    const desperation = urgent || ctx.isMajorDraftWeek;
    if (!qualityGate && !desperation) break;

    const signed = signPoolRecruit({
      updatedRival: updatedRival,
      recruit: recruit,
      cost: recruit.cost,
      week: week,
      rng: rng,
      gazetteItems: ctx.gazetteItems,
      usedIds: ctx.usedIds,
      deadIds: ctx.deadIds,
      maxRoster: ctx.maxRoster,
    });
    if (!signed) {
      // Can't afford the best candidate — remove it and try the next-best
      // (a Pragmatic stable should still find value buys further down).
      visible.splice(bestIdx, 1);
      if (remainingIds.has(recruit.id)) continue;
      break;
    }
    updatedRival = signed;
    remainingIds.delete(recruit.id);
    visible.splice(bestIdx, 1);
    signings++;
    activeCount++;
  }
  // Compaction: splice out everything dropped from remainingIds, preserving
  // order and the caller's array identity.
  compactPoolInPlace(remainingPool, remainingIds);
  return { updatedRival, signings };
}

/** Splices a mutating candidate pool down to surviving ids, in place. */
function compactPoolInPlace(
  remainingPool: PoolWarrior[],
  remainingIds: ReadonlySet<PoolWarrior['id']>
): void {
  const kept = remainingPool.filter((p) => remainingIds.has(p.id));
  if (kept.length !== remainingPool.length) {
    remainingPool.splice(0, remainingPool.length, ...kept);
  }
}

interface SignPoolRecruitArgs {
  updatedRival: RivalStableData;
  recruit: PoolWarrior;
  cost: number;
  week: number;
  rng: IRNGService;
  gazetteItems: string[];
  usedIds?: Set<string>;
  deadIds?: ReadonlySet<string>;
  maxRoster: number;
}

/**
 * Signs the scored pool recruit: risk-tiered budget check, then the unified
 * signWarrior funnel (capacity, dead-identity, conversion), treasury debit,
 * and finance/agent logs.
 */
function signPoolRecruit(args: SignPoolRecruitArgs): RivalStableData | null {
  const { recruit, cost, week, rng } = args;
  let { updatedRival } = args;
  const { gazetteItems, usedIds, deadIds, maxRoster } = args;
  // ⚡ Lead Agent Verification: Check budget before signing
  const budgetReport = checkBudget(updatedRival, cost, 'ROSTER');
  if (!budgetReport.isAffordable) return null;

  const signed = signWarrior({
    recruit: recruit,
    roster: updatedRival.roster,
    maxRoster: maxRoster,
    treasury: updatedRival.treasury,
    signingCost: cost,
    stableId: updatedRival.id,
    rng: rng,
    usedIds: usedIds,
    deadIds: deadIds,
  });
  if (!signed.ok) return null;

  updatedRival.treasury -= signed.costPaid;
  updatedRival.needsRecruit = false;
  updatedRival = logFinanceEvent(updatedRival, {
    label: `Draft signing — ${recruit.name}`,
    amount: -signed.costPaid,
    week,
    category: 'recruit',
    description: `Paid ${signed.costPaid}g draft fee for ${recruit.tier} ${recruit.name}.`,
    riskTier: budgetReport.riskTier,
  });

  updatedRival.roster = [...updatedRival.roster, signed.warrior];
  updatedRival = logAgentAction({
    rival: updatedRival,
    type: 'ROSTER',
    description: `Signed ${recruit.tier} warrior ${recruit.name} for ${signed.costPaid}g.`,
    riskTier: budgetReport.riskTier,
    week: week,
  });
  gazetteItems.push(
    `📣 MARKET: ${updatedRival.owner.stableName} signed ${recruit.tier} ${recruit.name} for ${signed.costPaid}g.`
  );
  return updatedRival;
}

/** Active-roster count for capacity checks. */
function countActiveRoster(rival: RivalStableData): number {
  return rival.roster.filter((w) => isActive(w)).length;
}

/** Academy first-look filter — recruits claimed by another stable's academy
 * are invisible until the claim expires. */
function visiblePool(pool: PoolWarrior[], rivalId: string, week: number): PoolWarrior[] {
  return pool.filter(
    (w) =>
      !w.academyStableId || w.academyStableId === rivalId || (w.academyClaimExpiryWeek ?? 0) < week
  );
}

interface ProcessRecruitmentArgs {
  rival: RivalStableData;
  pool: PoolWarrior[];
  week: number;
  rng: IRNGService;
  isMajorDraftWeek: boolean;
  meta?: StyleMeta;
  usedNames?: Set<string>;
  usedIds?: Set<string>;
  /** Dead-registry ids — computed once per draft run by the caller. */
  deadIds?: ReadonlySet<string>;
}

/**
 * RecruitmentWorker: Handles drafting warriors from the pool.
 * Implements "Context Isolation" and "Risk-Tiered Execution".
 */
/**
 * Generated fallback: only when the pools couldn't serve a stable that
 * declared a need or sits below its minimum — cheap, so poor stables can
 * still refill instead of starving out.
 */
function tryGeneratedFallback(args: {
  updatedRival: RivalStableData;
  week: number;
  meta: StyleMeta | undefined;
  gazetteItems: string[];
  needsRecruit: boolean;
  activeCount: number;
  minRoster: number;
  intent: string;
  signings: number;
  usedNames?: Set<string>;
  usedIds?: Set<string>;
  deadIds?: ReadonlySet<string>;
}): RivalStableData {
  const { updatedRival, week, meta, gazetteItems, needsRecruit } = args;
  const { activeCount, minRoster, intent, signings } = args;
  const { usedNames, usedIds, deadIds } = args;
  if (
    signings !== 0 ||
    !(needsRecruit || activeCount < minRoster) ||
    intent === 'RECOVERY' ||
    intent === 'SURVIVAL'
  ) {
    return updatedRival;
  }
  // signGeneratedRecruit appends directly into `gazetteItems`.
  const signed = signGeneratedRecruit({
    updatedRival: updatedRival,
    week: week,
    meta: meta,
    gazetteItems: gazetteItems,
    usedNames: usedNames,
    usedIds: usedIds,
    deadIds: deadIds,
  });
  return signed ? signed.updatedRival : updatedRival;
}

/** Derives the draft context (capacity, visibility, appetite) and runs the pool draft cycle. */
function runPoolDraft(args: {
  updatedRival: RivalStableData;
  remainingPool: PoolWarrior[];
  week: number;
  rng: IRNGService;
  isMajorDraftWeek: boolean;
  meta?: StyleMeta;
  activeCount: number;
  maxRoster: number;
  needsRecruit: boolean;
  gazetteItems: string[];
  usedIds?: Set<string>;
  deadIds?: ReadonlySet<string>;
}): { updatedRival: RivalStableData; signings: number; minRoster: number } {
  const { updatedRival, remainingPool, week, rng, isMajorDraftWeek } = args;
  const { meta, activeCount, maxRoster, needsRecruit } = args;
  const { gazetteItems, usedIds, deadIds } = args;

  // Academy first-look: recruits claimed by another stable's academy are
  // invisible until the claim expires.
  const visible = visiblePool(remainingPool, updatedRival.id, week);

  const personality = updatedRival.owner.personality ?? 'Pragmatic';
  const minRoster = aiRosterMin(personality);
  const favoredStyles = updatedRival.owner.favoredStyles;

  // Drafting rule (megaplan): a stable below its cap drafts whenever the
  // treasury covers the cost plus reserve — no weekly lottery. Up to
  // AI_RECRUITS_PER_WEEK_MAX signings per week; below-minimum stables drop
  // the quality gate so they never stall behind a weak pool.
  const slotsAvailable = Math.min(AI_RECRUITS_PER_WEEK_MAX, maxRoster - activeCount);
  const drafted = draftPoolSignings({
    updatedRival: updatedRival,
    remainingPool: remainingPool,
    visible: visible,
    week: week,
    rng: rng,
    meta: meta,
    personality: personality,
    favoredStyles: favoredStyles,
    ctx: {
      slotsAvailable,
      needsRecruit,
      minRoster,
      maxRoster,
      isMajorDraftWeek,
      gazetteItems,
      usedIds,
      deadIds,
    },
  });
  return { updatedRival: drafted.updatedRival, signings: drafted.signings, minRoster };
}

/**
 * Per-rival recruitment entry point (called once per stable inside
 * draftService's snake-draft loop). Skips drafting entirely once the
 * personality-based roster cap is reached, drafts from the shared pool
 * first, then falls back to a generated recruit when the stable declared
 * needsRecruit and still came up short. The returned updatedPool is the
 * authoritative shelf threaded to the next rival.
 */
export function processRecruitment(args: ProcessRecruitmentArgs): RecruitmentResult {
  const { rival, pool, week, rng, isMajorDraftWeek } = args;
  const { meta, usedNames, usedIds, deadIds } = args;
  let updatedRival = { ...rival };
  const gazetteItems: string[] = [];
  const remainingPool = [...pool];

  const intent = updatedRival.strategy?.intent ?? 'CONSOLIDATION';
  let activeCount = countActiveRoster(updatedRival);

  // **Intentional asymmetry (audited 2026-04-19)**: personality-based soft cap
  // is deliberately decoupled from the player's `BASE_ROSTER_CAP` constant.
  // Single config source: src/constants/ai.ts.
  const maxRoster = aiRosterMax(updatedRival.owner.personality);
  if (activeCount >= maxRoster) {
    return { updatedRival, updatedPool: remainingPool, gazetteItems };
  }

  // A stable flagged needsRecruit always drafts — the flag is set by
  // processAIRosterManagement (unified path) and cleared on a successful sign.
  const needsRecruit = updatedRival.needsRecruit === true;

  const drafted = runPoolDraft({
    updatedRival: updatedRival,
    remainingPool: remainingPool,
    week: week,
    rng: rng,
    isMajorDraftWeek: isMajorDraftWeek,
    meta: meta,
    activeCount: activeCount,
    maxRoster: maxRoster,
    needsRecruit: needsRecruit,
    gazetteItems: gazetteItems,
    usedIds: usedIds,
    deadIds: deadIds,
  });
  updatedRival = drafted.updatedRival;
  const signings = drafted.signings;
  activeCount += signings;

  updatedRival = tryGeneratedFallback({
    updatedRival: updatedRival,
    week: week,
    meta: meta,
    gazetteItems: gazetteItems,
    needsRecruit: needsRecruit,
    activeCount: activeCount,
    minRoster: drafted.minRoster,
    intent: intent,
    signings: signings,
    usedNames: usedNames,
    usedIds: usedIds,
    deadIds: deadIds,
  });

  return { updatedRival, updatedPool: remainingPool, gazetteItems };
}
