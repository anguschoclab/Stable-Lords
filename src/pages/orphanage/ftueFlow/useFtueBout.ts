import { useState, useCallback } from 'react';
import { loadCombatNarrative } from '@/data/narrative';
import type { FightPlan } from '@/types/game';
import { cryptoRandomInt } from '@/utils/cryptoRandom';
import {
  simulateTutorialBout,
  type FtueBoutResult,
  type PoolWarrior,
} from './tutorialBout';

/** Tutorial-bout state: plan, seeded bout, run callback. */
export function useFtueBout(selectedWarriors: PoolWarrior[]) {
  const [boutResult, setBoutResult] = useState<FtueBoutResult | null>(null);
  const [playerPlan, setPlayerPlan] = useState<FightPlan | null>(null);
  const [boutSeed] = useState(() => cryptoRandomInt(0, 0x7fffffff));

  const runTutorialBout = useCallback(async () => {
    // The FTUE bout runs on the main thread outside the week pipeline, which
    // is the only production site that warms the combat narrative archive.
    await loadCombatNarrative();
    const result = simulateTutorialBout(selectedWarriors, playerPlan, boutSeed);
    if (result) setBoutResult(result);
  }, [selectedWarriors, playerPlan, boutSeed]);

  return { boutResult, playerPlan, setPlayerPlan, runTutorialBout, boutSeed };
}
