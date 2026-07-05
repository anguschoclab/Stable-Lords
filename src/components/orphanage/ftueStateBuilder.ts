import { SeededRNGService } from '@/utils/random';
import { makeWarrior } from '@/engine/factories/warriorFactory';
import { generatePotential } from '@/engine/potential';
import { generateRivalStables } from '@/engine/rivals';
import { generateRecruitPool } from '@/engine/recruitment';
import { generatePromoters } from '@/engine/promoters/promoterGenerator';
import { runRankingsPass } from '@/engine/pipeline/passes/RankingsPass';
import { runPromoterPass } from '@/engine/pipeline/passes/PromoterPass';
import { resolveImpacts } from '@/engine/impacts';
import type { GameState, Promoter } from '@/types/state.types';
import { defaultPlanForWarrior } from '@/engine';
import { TRAIT_DATA } from '@/data/orphanPool';
import type { FightingStyle, FightPlan } from '@/types/shared.types';
import type { Attributes } from '@/types/shared.types';
import type { AttributePotential } from '@/types/warrior.types';

interface SelectedWarrior {
  name: string;
  style: FightingStyle;
  attrs: Attributes;
  age: number;
  trait: string;
  lore: string;
  origin?: string;
  potential?: AttributePotential;
}

interface BoutResult {
  a: { name: string };
  d: { name: string };
  outcome: { winner: 'A' | 'D'; by: string; post?: { tags?: string[] } };
  summary: unknown;
}

/**
 *
 */
export function buildFTUEInitialState(
  baseState: GameState,
  selectedWarriors: SelectedWarrior[],
  boutResult: BoutResult | null,
  poolSeedValue: number,
  playerPlan?: FightPlan | null
) {
  const finishRng = new SeededRNGService(poolSeedValue + 999);

  const warriors = selectedWarriors.map((pw, idx) => {
    // Use the orphan's pre-generated potential (or regenerate if somehow missing)
    const potential = pw.potential ?? generatePotential(pw.attrs, 'Common', finishRng);
    // Build base plan and merge trait-based modifiers
    const basePlan = defaultPlanForWarrior(makeWarrior(undefined, pw.name, pw.style, pw.attrs));
    const traitData = TRAIT_DATA[pw.trait];
    const traitMods = traitData?.effect.fightPlanMod ?? {};
    // warrior[0] is the plan warrior — apply player's custom plan if provided
    const plan =
      idx === 0 && playerPlan ? { ...playerPlan, ...traitMods } : { ...basePlan, ...traitMods };
    const w = makeWarrior(
      finishRng.uuid() as import('@/types/shared.types').WarriorId,
      pw.name,
      pw.style,
      pw.attrs,
      {
        potential,
        age: pw.age,
        plan,
        traits: [pw.trait],
        lore: pw.lore,
        origin: pw.origin,
      },
      finishRng
    );
    if (boutResult) {
      const wasA = pw.name === boutResult.a.name;
      const wasD = pw.name === boutResult.d.name;
      if (wasA || wasD) {
        const won =
          (wasA && boutResult.outcome.winner === 'A') ||
          (wasD && boutResult.outcome.winner === 'D');
        return {
          ...w,
          fame: won ? 1 : 0,
          popularity: won ? 1 : 0,
          flair: (boutResult.outcome.post?.tags ?? []).includes('Flashy') && won ? ['Flashy'] : [],
        };
      }
    }
    return w;
  });

  const deadWarriorName =
    boutResult?.outcome.by === 'Kill'
      ? boutResult.outcome.winner === 'A'
        ? boutResult.d.name
        : boutResult.a.name
      : null;

  const aliveWarriors = warriors.filter((w) => w.name !== deadWarriorName);
  const deadWarriors = warriors
    .filter((w) => w.name === deadWarriorName)
    .map((w) => ({
      ...w,
      status: 'Dead' as const,
      deathWeek: 1,
      deathCause: 'Killed in first arena bout',
      killedBy: boutResult?.outcome.winner === 'A' ? boutResult.a.name : boutResult?.d.name,
      isDead: true,
      dateOfDeath: `Week 1, ${baseState.season}`,
    }));

  const rivals = generateRivalStables(23, poolSeedValue + 777);

  const usedNames = new Set<string>();
  aliveWarriors.forEach((w) => usedNames.add(w.name));
  deadWarriors.forEach((w) => usedNames.add(w.name));
  rivals.forEach((r) => r.roster.forEach((w) => usedNames.add(w.name)));

  const recruitPool = generateRecruitPool(
    100,
    1,
    usedNames,
    new SeededRNGService(poolSeedValue + 888)
  );

  const promotersArray = generatePromoters(30, poolSeedValue + 999);
  const promoters: Record<string, Promoter> = {};
  promotersArray.forEach((p) => {
    promoters[p.id] = p;
  });

  // Build a minimal state snapshot to seed rankings + offers
  const seedState: GameState = {
    ...baseState,
    isFTUE: false,
    ftueComplete: true,
    roster: aliveWarriors,
    rivals,
    promoters,
    boutOffers: {},
    realmRankings: {},
  };
  const seeded = resolveImpacts(seedState, [
    runRankingsPass(seedState),
    runPromoterPass(seedState),
  ]);

  return {
    aliveWarriors,
    deadWarriors,
    rivals,
    recruitPool,
    promoters: seeded.promoters,
    boutOffers: seeded.boutOffers,
    realmRankings: seeded.realmRankings,
    arenaHistory: boutResult ? [boutResult.summary] : [],
  };
}
