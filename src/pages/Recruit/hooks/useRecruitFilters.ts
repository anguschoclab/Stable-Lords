import { useState, useMemo, useCallback } from 'react';
import { shuffled, SeededRNG } from '@/utils/random';
import { type PoolWarrior, type RecruitTier } from '@/engine/recruitment';
import type { FightingStyle } from '@/types/game';

type SortBy = 'cost-asc' | 'cost-desc' | 'random' | 'age-asc';

/**
 *
 */
export function useRecruitFilters(recruitPool: PoolWarrior[] | undefined, seed?: number) {
  const [activeTiers, setActiveTiers] = useState<Set<RecruitTier>>(
    new Set(['Common', 'Promising', 'Exceptional', 'Prodigy'])
  );
  const [activeStyle, setActiveStyle] = useState<FightingStyle | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortBy>('random');

  const filteredPool = useMemo(() => {
    let pool = [...(recruitPool ?? [])];
    pool = pool.filter((w: PoolWarrior) => activeTiers.has(w.tier));
    if (activeStyle !== 'all') {
      pool = pool.filter((w: PoolWarrior) => w.style === activeStyle);
    }
    if (sortBy === 'random') {
      pool = shuffled(pool, new SeededRNG(seed ?? 0));
    } else {
      pool.sort((a: PoolWarrior, b: PoolWarrior) => {
        switch (sortBy) {
          case 'cost-asc':
            return a.cost - b.cost;
          case 'cost-desc':
            return b.cost - a.cost;
          case 'age-asc':
            return a.age - b.age;
          default:
            return 0;
        }
      });
    }
    return pool;
  }, [recruitPool, activeTiers, activeStyle, sortBy, seed]);

  const toggleTier = useCallback((tier: RecruitTier) => {
    setActiveTiers((prev) => {
      const next = new Set(prev);
      if (next.has(tier)) next.delete(tier);
      else next.add(tier);
      return next;
    });
  }, []);

  return {
    activeTiers,
    activeStyle,
    sortBy,
    filteredPool,
    setActiveStyle,
    setSortBy,
    toggleTier,
  };
}
