export {
  ACADEMY_CLAIM_WEEKS,
  DEFAULT_POOL_SIZE,
  REFRESH_COST,
  TIER_COST,
  TIER_STARS,
  computeFreeAgentCost,
  computeRecruitPoolSize,
  computeRecruitPoolHardCap,
  type PoolWarrior,
  type RecruitTier,
} from './types';
export { generateRecruit, generateApprentice } from './generate';
export { fullRefreshPool, generateRecruitPool, partialRefreshPool } from './pool';
export { partitionAgedFreeAgents, veteranSigningPatch, warriorToPoolWarrior } from './freeAgents';
export {
  poolWarriorToWarrior,
  signWarrior,
  type SignWarriorArgs,
  type SignWarriorFailure,
  type SignWarriorResult,
  type PoolToWarriorOpts,
} from '../signWarrior';

// AI Draft behavior has been moved to src/engine/draftService.ts
