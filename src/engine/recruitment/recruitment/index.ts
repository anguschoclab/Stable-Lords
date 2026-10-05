export {
  ACADEMY_CLAIM_WEEKS,
  DEFAULT_POOL_SIZE,
  REFRESH_COST,
  TIER_COST,
  TIER_STARS,
  computeFreeAgentCost,
  computeRecruitPoolSize,
  type PoolWarrior,
  type RecruitTier,
} from './types';
export { generateRecruit } from './generate';
export { fullRefreshPool, generateRecruitPool, partialRefreshPool } from './pool';
export { veteranSigningPatch, warriorToPoolWarrior } from './freeAgents';

// AI Draft behavior has been moved to src/engine/draftService.ts
