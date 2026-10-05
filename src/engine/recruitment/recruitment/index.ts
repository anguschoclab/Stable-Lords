export {
  ACADEMY_CLAIM_WEEKS,
  DEFAULT_POOL_SIZE,
  REFRESH_COST,
  TIER_COST,
  TIER_STARS,
  computeFreeAgentCost,
  computeRecruitPoolHardCap,
  computeRecruitPoolSize,
  type PoolWarrior,
  type RecruitTier,
} from './types';
export { generateRecruit, type GenerateRecruitArgs } from './generate';
export {
  fullRefreshPool,
  generateRecruitPool,
  partialRefreshPool,
  type GenerateRecruitPoolArgs,
  type PartialRefreshPoolArgs,
} from './pool';
export { veteranSigningPatch, warriorToPoolWarrior } from './freeAgents';

// AI Draft behavior has been moved to src/engine/draftService.ts
