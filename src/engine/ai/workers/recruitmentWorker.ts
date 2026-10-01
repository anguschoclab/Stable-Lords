import { type RivalStableData, type PoolWarrior, type Warrior } from '@/types/state.types';
import { PERSONALITY_STYLE_PREFS } from '@/data/ownerData';
import { logAgentAction, logFinanceEvent } from '../agentCore';
import { checkBudget } from './budgetWorker';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { getFittedLoadout } from '@/engine/equipment/loadoutFitting';
import { isActive } from '@/engine/warrior/warriorStatus';
import {
  aiRosterMax,
  aiRosterMin,
  AI_GENERATED_RECRUIT_COST,
  PERSONALITY_DRAFT_WEIGHTS,
  DEFAULT_DRAFT_WEIGHTS,
} from '@/constants/ai';
import { AI_RECRUITS_PER_WEEK_MAX } from '@/constants/world';
import { generateAIRecruit } from '@/engine/owner/roster/recruitGenerator';
import { veteranSigningPatch } from '@/engine/recruitment/recruitment';
import type { StyleMeta } from '@/engine/analytics/metaDrift';
import type { FightingStyle } from '@/types/shared.types';

// NARRATIVE AUDIT 2026: Origin string generation and lore traits are dynamically sourced from registries. No manual wiring needed for new additions to populate AI stable pools and scouting reports.

/**
 * RecruitmentWorker: Handles drafting warriors from the pool.
 * Implements "Context Isolation" and "Risk-Tiered Execution".
/** Return type shared by processRecruitment and its signing helpers. */
type RecruitmentResult = {
  updatedRival: RivalStableData;
  updatedPool: PoolWarrior[];
  gazetteItems: string[];
};

/**
 * Pool-empty fallback: generates a recruit out of thin air ONLY when the
 * stable declared a need and can afford the signing fee through the same
 * budget check as pool drafts (G9 — generateAIRecruit is no longer a
 * parallel recruitment path).
 */
function signGeneratedRecruit(
  updatedRival: RivalStableData,
  week: number,
  meta: StyleMeta | undefined,
  gazetteItems: string[],
  usedNames?: Set<string>
): RecruitmentResult | null {
  const budgetReport = checkBudget(updatedRival, AI_GENERATED_RECRUIT_COST, 'ROSTER');
  if (!budgetReport.isAffordable) return null;
  const generated = generateAIRecruit(updatedRival, week, meta, undefined, usedNames);
  if (!generated) return null;
  usedNames?.add(generated.name);
  updatedRival = {
    ...updatedRival,
    treasury: updatedRival.treasury - AI_GENERATED_RECRUIT_COST,
    roster: [...updatedRival.roster, generated],
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
  updatedRival = logAgentAction(
    updatedRival,
    'ROSTER',
    `Signed recruit ${generated.name} for ${AI_GENERATED_RECRUIT_COST}g.`,
    budgetReport.riskTier,
    week,
    'ROSTER_DIVERSITY'
  );
  gazetteItems.push(
    `📣 MARKET: ${updatedRival.owner.stableName} signed ${generated.name} for ${AI_GENERATED_RECRUIT_COST}g.`
  );
  return { updatedRival, updatedPool: [], gazetteItems };
}

/**
 * Scores pool candidates through the personality weights table: tier
 * appetite, price sensitivity, veteran appetite, style match (personality
 * prefs ∪ founder favored styles), roster-balance duplicates, meta drift,
 * youth/ready-now bonuses, and time-in-pool pressure.
 */
function scoreCandidates(
  pool: PoolWarrior[],
  roster: Warrior[],
  personality: string,
  week: number,
  meta: StyleMeta | undefined,
  favoredStyles?: FightingStyle[]
): { bestIdx: number; bestScore: number } {
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
    let score = 0;
    score += weights.tierBonus[w.tier] ?? 0;
    if (prefsSet.has(w.style)) score += weights.styleMatchBonus;
    if (w.veteran) score += weights.veteranBonus;

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
      const attrTotal = Object.values(w.attributes ?? {}).reduce<number>(
        (acc, v) => acc + (typeof v === 'number' ? v : 0),
        0
      );
      score += Math.max(0, attrTotal - 70) * weights.readyBonusPerPoint;
    }

    // Price appetite — thrifty personalities discount expensive recruits.
    score -= (w.cost * weights.priceSensitivity) / 100;

    const weeksAvailable = week - w.addedWeek;
    score += weeksAvailable * 10;

    if (score > bestScore) {
      bestScore = score;
      bestIdx = i;
    }
  }
  return { bestIdx, bestScore };
}

/**
 * Signs the scored pool recruit: risk-tiered budget check, treasury debit,
 * finance/agent logs, and conversion of the pool entry into a roster Warrior.
 */
function signPoolRecruit(
  updatedRival: RivalStableData,
  recruit: PoolWarrior,
  cost: number,
  week: number,
  rng: IRNGService,
  gazetteItems: string[]
): RivalStableData | null {
  // ⚡ Lead Agent Verification: Check budget before signing
  const budgetReport = checkBudget(updatedRival, cost, 'ROSTER');
  if (!budgetReport.isAffordable) return null;

  updatedRival.treasury -= cost;
  updatedRival.needsRecruit = false;
  updatedRival = logFinanceEvent(updatedRival, {
    label: `Draft signing — ${recruit.name}`,
    amount: -cost,
    week,
    category: 'recruit',
    description: `Paid ${cost}g draft fee for ${recruit.tier} ${recruit.name}.`,
    riskTier: budgetReport.riskTier,
  });

  const newWarrior: Warrior = {
    id: rng.uuid() as import('@/types/shared.types').WarriorId,
    name: recruit.name,
    style: recruit.style,
    attributes: { ...recruit.attributes },
    potential: { ...recruit.potential },
    baseSkills: { ...recruit.baseSkills },
    derivedStats: { ...recruit.derivedStats },
    fame: 10,
    popularity: 5,
    titles: [],
    injuries: [],
    flair: [],
    career: { wins: 0, losses: 0, kills: 0 },
    champion: false,
    status: 'Active',
    age: recruit.age,
    stableId: updatedRival.id,
    lineage: recruit.lineage,
    traits: recruit.traits,
    favorites: recruit.favorites,
    equipment: getFittedLoadout(recruit.style, recruit.attributes),
    isStarInvestment: recruit.tier === 'Prodigy',
  };
  // Veterans (displaced by dissolution) keep their identity and career;
  // ordinary recruits take the fresh-prospect defaults above.
  Object.assign(newWarrior, veteranSigningPatch(recruit));

  updatedRival.roster = [...updatedRival.roster, newWarrior];
  updatedRival = logAgentAction(
    updatedRival,
    'ROSTER',
    `Signed ${recruit.tier} warrior ${recruit.name} for ${cost}g.`,
    budgetReport.riskTier,
    week
  );
  gazetteItems.push(
    `📣 MARKET: ${updatedRival.owner.stableName} signed ${recruit.tier} ${recruit.name} for ${cost}g.`
  );
  return updatedRival;
}

/**
 * RecruitmentWorker: Handles drafting warriors from the pool.
 * Implements "Context Isolation" and "Risk-Tiered Execution".
 */
export function processRecruitment(
  rival: RivalStableData,
  pool: PoolWarrior[],
  week: number,
  rng: IRNGService,
  isMajorDraftWeek: boolean,
  meta?: StyleMeta,
  usedNames?: Set<string>
): RecruitmentResult {
  let updatedRival = { ...rival };
  const gazetteItems: string[] = [];
  const remainingPool = [...pool];

  const intent = updatedRival.strategy?.intent ?? 'CONSOLIDATION';
  let activeCount = 0;
  for (const w of updatedRival.roster) {
    if (isActive(w)) activeCount++;
  }

  // **Intentional asymmetry (audited 2026-04-19)**: personality-based soft cap
  // is deliberately decoupled from the player's `BASE_ROSTER_CAP` constant.
  // Single config source: src/constants/ai.ts (G9).
  const maxRoster = aiRosterMax(updatedRival.owner.personality);
  if (activeCount >= maxRoster) {
    return { updatedRival, updatedPool: remainingPool, gazetteItems };
  }

  // G9: a stable flagged needsRecruit always drafts — the flag is set by
  // processAIRosterManagement (unified path) and cleared on a successful sign.
  const needsRecruit = updatedRival.needsRecruit === true;

  // Academy first-look: recruits claimed by another stable's academy are
  // invisible until the claim expires.
  const visible = remainingPool.filter(
    (w) =>
      !w.academyStableId ||
      w.academyStableId === updatedRival.id ||
      (w.academyClaimExpiryWeek ?? 0) < week
  );

  const personality = updatedRival.owner.personality ?? 'Pragmatic';
  const minRoster = aiRosterMin(personality);
  const favoredStyles = updatedRival.owner.favoredStyles;

  // Drafting rule (megaplan): a stable below its cap drafts whenever the
  // treasury covers the cost plus reserve — no weekly lottery. Up to
  // AI_RECRUITS_PER_WEEK_MAX signings per week; below-minimum stables drop
  // the quality gate so they never stall behind a weak pool.
  const slotsAvailable = Math.min(AI_RECRUITS_PER_WEEK_MAX, maxRoster - activeCount);
  let signings = 0;
  for (let slot = 0; slot < slotsAvailable; slot++) {
    const { bestIdx, bestScore } = scoreCandidates(
      visible,
      updatedRival.roster,
      personality,
      week,
      meta,
      favoredStyles
    );
    if (bestIdx < 0) break;
    const recruit = visible[bestIdx];
    if (!recruit) break;

    const qualityGate = bestScore > 0;
    const desperation = needsRecruit || activeCount < minRoster || isMajorDraftWeek;
    if (!qualityGate && !desperation) break;

    const signed = signPoolRecruit(updatedRival, recruit, recruit.cost, week, rng, gazetteItems);
    if (!signed) {
      // Can't afford the best candidate — remove it and try the next-best
      // (a Pragmatic stable should still find value buys further down).
      const idx = remainingPool.findIndex((p) => p.id === recruit.id);
      const vIdx = visible.findIndex((p) => p.id === recruit.id);
      if (vIdx >= 0) visible.splice(vIdx, 1);
      if (idx >= 0) continue;
      break;
    }
    updatedRival = signed;
    const idx = remainingPool.findIndex((p) => p.id === recruit.id);
    if (idx >= 0) remainingPool.splice(idx, 1);
    visible.splice(bestIdx, 1);
    signings++;
    activeCount++;
  }

  // Generated fallback: only when the pools couldn't serve a stable that
  // declared a need or sits below its minimum — cheap, so poor stables can
  // still refill instead of starving out.
  if (
    signings === 0 &&
    (needsRecruit || activeCount < minRoster) &&
    intent !== 'RECOVERY'
  ) {
    const signed = signGeneratedRecruit(updatedRival, week, meta, gazetteItems, usedNames);
    if (signed) {
      updatedRival = signed.updatedRival;
      gazetteItems.push(...signed.gazetteItems);
    }
  }

  return { updatedRival, updatedPool: remainingPool, gazetteItems };
}
