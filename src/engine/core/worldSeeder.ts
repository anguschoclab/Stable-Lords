import { FightingStyle } from '@/types/shared.types';
import type { Warrior } from '@/types/warrior.types';
import type { GameState, Promoter } from '@/types/state.types';
import { makeWarrior } from '@/engine/factories/warriorFactory';
import { generateRivalStables } from '@/engine/rivals';
import { generateRecruitPool } from '@/engine/recruitment/recruitment';
import { generateHiringPool } from '@/engine/trainers/trainers';
import { generateWarriorName } from '@/data/names/nameGenerator';
import { STYLE_ARCHETYPE } from '@/engine/factories/statGeneration';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { SeededRNGService, resolveRng } from '@/utils/random';

import { generatePromoters } from '@/engine/promoters/promoterGenerator';
import { WORLD_RIVAL_FLOOR, PROMOTERS_PER_STABLE, PROMOTER_COUNT_MIN } from '@/constants/world';
import { computeRecruitPoolSize } from '@/engine/recruitment/recruitment';

/**
 * Seed the world with initial rivals, recruits, and a starter player roster.
 * Bypasses the FTUE for headless simulation.
 */
export function populateInitialWorld(state: GameState, seed: number, rng?: IRNGService): GameState {
  const rngService = resolveRng(rng, seed);
  const usedNames = new Set<string>();

  // 1. Generate Rivals — the living-world floor (every arena needs a schedule)
  const rivals = generateRivalStables(WORLD_RIVAL_FLOOR, seed + 1);
  rivals.forEach((r) => r.roster.forEach((w) => usedNames.add(w.name)));

  // 1.1 Generate Promoters — scaled to the stable count
  const promoterCount = Math.max(
    PROMOTER_COUNT_MIN,
    Math.round(WORLD_RIVAL_FLOOR * PROMOTERS_PER_STABLE)
  );
  const promotersArray = generatePromoters(promoterCount, seed + 3, rngService);
  const promoters: Record<string, Promoter> = {};
  promotersArray.forEach((p) => (promoters[p.id] = p));

  // 2. Generate Initial Recruit Pool — scaled to the stable count
  const recruitPool = generateRecruitPool(
    computeRecruitPoolSize(WORLD_RIVAL_FLOOR),
    1,
    usedNames,
    new SeededRNGService(seed + 2)
  );

  // 3. Generate Player Roster (4 balanced warriors)
  const styles = [
    FightingStyle.StrikingAttack,
    FightingStyle.WallOfSteel,
    FightingStyle.ParryRiposte,
    FightingStyle.LungingAttack,
  ];

  const playerRoster: Warrior[] = styles.map((style) => {
    const attrs = {
      ST: 8 + Math.floor(rngService.next() * 4),
      CN: 8 + Math.floor(rngService.next() * 4),
      SZ: 10,
      WT: 10,
      WL: 10,
      SP: 8 + Math.floor(rngService.next() * 4),
      DF: 8 + Math.floor(rngService.next() * 4),
    };
    const w = makeWarrior(
      undefined,
      generateWarriorName({ rng: rngService, archetype: STYLE_ARCHETYPE[style], usedNames }),
      style,
      attrs,
      {},
      rngService
    );
    usedNames.add(w.name);
    return w;
  });

  return {
    ...state,
    rivals,
    promoters, // Seeded Promoters
    boutOffers: {},
    realmRankings: {},
    recruitPool,
    hiringPool: generateHiringPool(8, seed + 100),
    roster: playerRoster,
    isFTUE: false,
    ftueComplete: true,
    treasury: 500,
    week: 1,
    year: 1,
  };
}
