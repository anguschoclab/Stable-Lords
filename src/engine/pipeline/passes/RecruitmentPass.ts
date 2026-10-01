import type { GameState } from '@/types/state.types';
import type { PoolWarrior } from '@/engine/recruitment/recruitment';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { resolveRng } from '@/utils/random';
import { StateImpact } from '@/engine/impacts';
import {
  partialRefreshPool,
  generateRecruit,
  ACADEMY_CLAIM_WEEKS,
} from '@/engine/recruitment/recruitment';
import { collectUsedWarriorNames } from '@/engine/core/warriorCollection';
import { AI_ACADEMY_BONUS_RECRUITS, WORLD_RIVAL_FLOOR } from '@/constants/world';

/**
 * Academy first-look: legacy-founded stables (owner.foundedByWarriorId) claim
 * a small slice of the weekly intake, biased toward the founder's favored
 * styles. Claims rotate each week so one academy can't lock the whole intake.
 */
function applyAcademyClaims(pool: PoolWarrior[], state: GameState, week: number): PoolWarrior[] {
  const academies = (state.rivals ?? [])
    .filter((r) => r.owner.foundedByWarriorId)
    .sort((a, b) => (a.id < b.id ? -1 : 1));
  if (academies.length === 0 || pool.length === 0) return pool;

  const rot = week % academies.length;
  const ordered = academies.slice(rot).concat(academies.slice(0, rot));

  const out = pool.map((w) => (w.academyStableId || w.veteran ? w : { ...w }));
  for (const academy of ordered) {
    const favored = new Set(academy.owner.favoredStyles ?? []);
    if (favored.size === 0) continue;
    let claimed = 0;
    for (const w of out) {
      if (claimed >= AI_ACADEMY_BONUS_RECRUITS) break;
      if (w.academyStableId || w.veteran) continue;
      if (!favored.has(w.style)) continue;
      w.academyStableId = academy.id;
      w.academyClaimExpiryWeek = week + ACADEMY_CLAIM_WEEKS;
      w.source = 'academy';
      claimed++;
    }
  }
  return out;
}

/**
 * Free-agent shelf decay: each week ticks `shelfWeeksRemaining` down; expired
 * veterans leave the market entirely (their records stay in the arena history
 * where their careers were actually spent).
 */
function ageFreeAgents(freeAgents: PoolWarrior[] | undefined): PoolWarrior[] {
  return (freeAgents ?? [])
    .map((w) => ({
      ...w,
      shelfWeeksRemaining: (w.shelfWeeksRemaining ?? 0) - 1,
    }))
    .filter((w) => w.shelfWeeksRemaining > 0);
}

/**
 * Stable Lords — Recruitment Pipeline Pass
 * Handles the weekly refresh of the recruitment pool.
 */
export function runRecruitmentPass(state: GameState, rootRng?: IRNGService): StateImpact {
  const rng = resolveRng(rootRng, (state.absoluteWeek ?? state.week) * 701 + 13);

  // 1. Refresh recruitment pool
  const usedNames = collectUsedWarriorNames(state);

  // Collect legacy candidates (fame > 1000)
  const legacyCandidates = [...(state.graveyard || []), ...(state.retired || [])].filter(
    (w) => w.fame > 1000
  );

  const stableCount = state.rivals?.length ?? WORLD_RIVAL_FLOOR;
  let recruitPool: PoolWarrior[];

  if (state.weather === 'Blizzard') {
    // Passes are blocked: no new intake reaches the arenas. The pool freezes
    // rather than decimating — the old 40% slice compounded week over week
    // and could strand the world with an unusable pool.
    recruitPool = [...(state.recruitPool ?? [])];
  } else {
    recruitPool = partialRefreshPool(
      state.recruitPool || [],
      state.week,
      usedNames,
      rng,
      state.cachedMetaDrift,
      legacyCandidates,
      stableCount
    );

    // 2. Post-death pool bonus: each arena death this week draws one extra
    // aspirant into the pool (fame of mortal combat attracts more blood).
    const deathsThisWeek = (state.graveyard ?? []).filter(
      (w) => w.deathWeek === (state.absoluteWeek ?? state.week)
    ).length;
    const bonusCount = Math.min(3, deathsThisWeek);
    if (bonusCount > 0) {
      const poolNames = new Set(recruitPool.map((w) => w.name));
      const allUsed = new Set<string>([...usedNames, ...poolNames]);
      for (let i = 0; i < bonusCount; i++) {
        recruitPool.push(
          generateRecruit(
            rng,
            allUsed,
            state.week,
            undefined,
            state.cachedMetaDrift,
            legacyCandidates
          )
        );
      }
    }

    // 3. Mana Surge — celestial attraction adds exceptional recruits.
    if (state.weather === 'Mana Surge') {
      const poolNames = new Set(recruitPool.map((w) => w.name));
      const allUsed = new Set<string>([...usedNames, ...poolNames]);
      for (let i = 0; i < 3; i++) {
        recruitPool.push(
          generateRecruit(
            rng,
            allUsed,
            state.week,
            'Exceptional',
            state.cachedMetaDrift,
            legacyCandidates
          )
        );
      }
    }
  }

  // 4. Academy first-look claims on the fresh intake.
  recruitPool = applyAcademyClaims(recruitPool, state, state.week);

  return {
    recruitPool,
    freeAgents: ageFreeAgents(state.freeAgents),
  };
}
