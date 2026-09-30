import { type RivalStableData, type PoolWarrior, type Warrior } from '@/types/state.types';
import { PERSONALITY_STYLE_PREFS } from '@/data/ownerData';
import { logAgentAction, logFinanceEvent } from '../agentCore';
import { checkBudget } from './budgetWorker';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { getStyleDefaultLoadout } from '@/data/equipment';
import { isActive } from '@/engine/warrior/warriorStatus';
import { aiRosterMax, AI_GENERATED_RECRUIT_COST } from '@/constants/ai';
import { generateAIRecruit } from '@/engine/owner/roster/recruitGenerator';
import { veteranSigningPatch } from '@/engine/recruitment/recruitment';
import type { StyleMeta } from '@/engine/analytics/metaDrift';

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
 * Scores pool candidates: tier premium, personality style prefs, meta
 * drift bonus, duplicate-style penalty, and time-in-pool pressure.
 */
function scoreCandidates(
  pool: PoolWarrior[],
  roster: Warrior[],
  personality: string,
  week: number,
  meta: StyleMeta | undefined
): { bestIdx: number; bestScore: number } {
  const prefs = PERSONALITY_STYLE_PREFS[personality as keyof typeof PERSONALITY_STYLE_PREFS] || [];
  const prefsSet = new Set(prefs);

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
    if (w.tier === 'Prodigy') score += 100;
    if (w.tier === 'Exceptional') score += 50;
    if (w.tier === 'Promising') score += 20;
    if (prefsSet.has(w.style)) score += 30;

    // ⚡ TSA: Meta-Fit Scoring
    const drift = meta?.[w.style] || 0;
    score += drift * 5; // Reward styles that are trending up

    // ⚡ TSA: Style Diversity Guard
    const styleCount = activeStyleCounts.get(w.style) ?? 0;
    if (styleCount > 0) {
      score -= styleCount * 15; // Penalize duplicates to avoid "Weather Fragility"
    }

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
    equipment: getStyleDefaultLoadout(recruit.style),
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

  // 1. Check Recruitment Chance
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
  const intentBonus = intent === 'EXPANSION' ? 0.6 : 0;
  const willRecruit =
    needsRecruit ||
    isMajorDraftWeek ||
    (activeCount < 4 && rng.next() < 0.3 + intentBonus) ||
    rng.next() < 0.05 + intentBonus;

  if (!willRecruit) {
    return { updatedRival, updatedPool: remainingPool, gazetteItems };
  }

  if (remainingPool.length === 0) {
    if (!needsRecruit) {
      return { updatedRival, updatedPool: remainingPool, gazetteItems };
    }
    const signed = signGeneratedRecruit(updatedRival, week, meta, gazetteItems, usedNames);
    if (!signed) {
      return { updatedRival, updatedPool: remainingPool, gazetteItems };
    }
    return { ...signed, updatedPool: remainingPool };
  }

  // 2. Score Candidates (Personality Alignment)
  const personality = updatedRival.owner.personality ?? 'Pragmatic';
  const { bestIdx, bestScore } = scoreCandidates(
    remainingPool,
    updatedRival.roster,
    personality,
    week,
    meta
  );

  // 3. Risk-Tiered Budget Check & Finalizing Recruit
  if (bestIdx >= 0 && (bestScore > 30 || isMajorDraftWeek)) {
    const recruit = remainingPool[bestIdx];
    if (!recruit) {
      throw new Error('Recruit selection failed');
    }
    const cost = recruit.tier === 'Prodigy' ? 400 : recruit.tier === 'Exceptional' ? 250 : 100;
    const signed = signPoolRecruit(updatedRival, recruit, cost, week, rng, gazetteItems);
    if (signed) {
      updatedRival = signed;
      remainingPool.splice(bestIdx, 1);
    }
  }

  return { updatedRival, updatedPool: remainingPool, gazetteItems };
}
