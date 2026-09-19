import { type RivalStableData, type PoolWarrior, type Warrior } from '@/types/state.types';
import { PERSONALITY_STYLE_PREFS } from '@/data/ownerData';
import { logAgentAction } from '../agentCore';
import { checkBudget } from './budgetWorker';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { getStyleDefaultLoadout } from '@/data/equipment';
import { isActive } from '@/engine/warriorStatus';
import { aiRosterMax, AI_GENERATED_RECRUIT_COST } from '@/constants/ai';
import { generateAIRecruit } from '@/engine/owner/roster/recruitGenerator';
import type { StyleMeta } from '@/engine/metaDrift';

// NARRATIVE AUDIT 2026: Origin string generation and lore traits are dynamically sourced from registries. No manual wiring needed for new additions to populate AI stable pools and scouting reports.

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
  meta?: StyleMeta
): { updatedRival: RivalStableData; updatedPool: PoolWarrior[]; gazetteItems: string[] } {
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

  // Pool-empty fallback: generate a recruit out of thin air ONLY when the
  // stable declared a need and can afford the signing fee through the same
  // budget check as pool drafts (G9 — generateAIRecruit is no longer a
  // parallel recruitment path).
  if (remainingPool.length === 0) {
    if (!needsRecruit) {
      return { updatedRival, updatedPool: remainingPool, gazetteItems };
    }
    const budgetReport = checkBudget(updatedRival, AI_GENERATED_RECRUIT_COST, 'ROSTER');
    if (!budgetReport.isAffordable) {
      return { updatedRival, updatedPool: remainingPool, gazetteItems };
    }
    const generated = generateAIRecruit(updatedRival, week, meta);
    if (!generated) {
      return { updatedRival, updatedPool: remainingPool, gazetteItems };
    }
    updatedRival = {
      ...updatedRival,
      treasury: updatedRival.treasury - AI_GENERATED_RECRUIT_COST,
      roster: [...updatedRival.roster, generated],
      needsRecruit: false,
    };
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
    return { updatedRival, updatedPool: remainingPool, gazetteItems };
  }

  // 2. Score Candidates (Personality Alignment)
  const personality = updatedRival.owner.personality ?? 'Pragmatic';
  const prefs = PERSONALITY_STYLE_PREFS[personality] || [];
  const prefsSet = new Set(prefs);

  const activeStyleCounts = new Map<string, number>();
  for (const r of updatedRival.roster) {
    if (!isActive(r)) continue;
    activeStyleCounts.set(r.style, (activeStyleCounts.get(r.style) ?? 0) + 1);
  }

  let bestIdx = -1;
  let bestScore = -Infinity;

  for (let i = 0; i < remainingPool.length; i++) {
    const w = remainingPool[i];
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

  // 3. Risk-Tiered Budget Check & Finalizing Recruit
  if (bestIdx >= 0 && (bestScore > 30 || isMajorDraftWeek)) {
    const recruit = remainingPool[bestIdx];
    if (!recruit) {
      throw new Error('Recruit selection failed');
    }
    const cost = recruit.tier === 'Prodigy' ? 400 : recruit.tier === 'Exceptional' ? 250 : 100;

    // ⚡ Lead Agent Verification: Check budget before signing
    const budgetReport = checkBudget(updatedRival, cost, 'ROSTER');

    if (budgetReport.isAffordable) {
      updatedRival.treasury -= cost;
      updatedRival.needsRecruit = false;
      remainingPool.splice(bestIdx, 1);

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
    }
  }

  return { updatedRival, updatedPool: remainingPool, gazetteItems };
}
