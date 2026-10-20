import { useState, useMemo, useCallback } from 'react';
import { cryptoRandomInt } from '@/utils/cryptoRandom';
import { SeededRNG } from '@/utils/random';
import { generateOrphanPool } from '@/data/orphanPool';
import { poolWarriorToWarrior } from '@/engine/recruitment/recruitment';

/** Orphan pool state: seeded pool, up-to-3 selection set, derived picks. */
export function useOrphanSelection() {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [poolSeedValue, setPoolSeedValue] = useState(() => cryptoRandomInt(0, 999999));

  const orphanPool = useMemo(() => generateOrphanPool(8, poolSeedValue), [poolSeedValue]);

  const rerollPool = useCallback(() => {
    setPoolSeedValue((prev) => (prev * 1103515245 + 12345) & 0x7fffffff);
    setSelected(new Set());
  }, []);

  const toggleWarrior = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < 3) {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectedWarriors = useMemo(
    () => orphanPool.filter((w) => selected.has(w.id)),
    [selected, orphanPool]
  );

  const planWarrior = useMemo(() => {
    if (selectedWarriors.length < 1) return null;
    const poolA = selectedWarriors[0];
    if (!poolA) return null;
    return poolWarriorToWarrior(poolA, { rng: new SeededRNG(poolSeedValue + 77) });
  }, [selectedWarriors, poolSeedValue]);

  return {
    selected,
    poolSeedValue,
    orphanPool,
    rerollPool,
    toggleWarrior,
    selectedWarriors,
    planWarrior,
  };
}
