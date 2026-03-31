import { FightingStyle, type RivalStableData } from "@/types/game";
import { type PoolWarrior } from "./recruitment";
import { PERSONALITY_STYLE_PREFS } from "@/data/ownerData";
import { SeededRNG } from "@/utils/random";
import { generateId } from "@/utils/idUtils";

/**
 * AI Draft Service
 * Handles rival stables' logic for recruiting new warriors from the pool.
 */
export function aiDraftFromPool(
  pool: PoolWarrior[],
  rivals: RivalStableData[],
  week: number,
  seed?: number
): { updatedPool: PoolWarrior[]; updatedRivals: RivalStableData[]; gazetteItems: string[] } {
  const rng = new SeededRNG(seed ?? (week * 7919 + 101));
  
  const updatedRivals = rivals.map(r => ({ 
    ...r, 
    roster: [...r.roster] 
  }));
  const gazetteItems: string[] = [];
  const remainingPool = [...pool];

  // Major Draft (Every 4 weeks)
  const isMajorDraftWeek = week % 4 === 0;

  for (const rival of updatedRivals) {
    const activeCount = rival.roster.filter(w => w.status === "Active").length;
    if (activeCount >= 6) continue;
    
    // Deterministic recruitment chance
    const willRecruit = isMajorDraftWeek || (activeCount < 3 && rng.chance(0.25)) || (rng.chance(0.05));
    
    if (!willRecruit || remainingPool.length === 0) continue;

    const personality = rival.owner.personality ?? "Pragmatic";
    const prefs = PERSONALITY_STYLE_PREFS[personality] || [];
    const prefsSet = new Set(prefs);

    // Score candidates
    let bestIdx = -1;
    let bestScore = -Infinity;
    
    for (let i = 0; i < remainingPool.length; i++) {
       const w = remainingPool[i];
       let score = 0;
       
       // Quality scoring
       if (w.tier === "Prodigy") score += 100;
       if (w.tier === "Exceptional") score += 50;
       if (w.tier === "Promising") score += 20;
       
       // Style preference
       if (prefsSet.has(w.style)) score += 30;
       
       // Desperation factor (how long has the recruit been available?)
       const weeksAvailable = week - w.addedWeek;
       score += weeksAvailable * 10; 

       if (score > bestScore) {
         bestScore = score;
         bestIdx = i;
       }
    }

    // AI will only take it if the score is high enough or it's a major week
    if (bestIdx >= 0 && (bestScore > 40 || isMajorDraftWeek)) {
       const recruit = remainingPool[bestIdx];
       remainingPool.splice(bestIdx, 1);

       // Note: In a real implementation, we'd use a factory for this,
       // but we'll follow the existing pattern for now.
       rival.roster.push({
         id: generateId(),
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
         status: "Active",
         age: recruit.age,
         stableId: rival.owner.id,
       });

       gazetteItems.push(`MARKET: ${rival.owner.stableName} has signed the ${recruit.tier} prospect ${recruit.name}.`);
    }
  }

  return { updatedPool: remainingPool, updatedRivals, gazetteItems };
}
