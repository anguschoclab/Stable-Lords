import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useShallow } from 'zustand/react/shallow';
import { useGameStore, type GameStore } from '@/state/useGameStore';
import { makeWarrior } from '@/engine/factories/warriorFactory';
import { simulateFight, defaultPlanForWarrior } from '@/engine';
import type { GameState } from '@/types/state.types';
import type { Warrior, FightSummary, WarriorId, FightPlan } from '@/types/game';
import { cryptoRandomInt } from '@/utils/cryptoRandom';
import { generateId } from '@/utils/idUtils';
import { generateOrphanPool } from '@/data/orphanPool';
import { createBoutSummary } from '@/engine/core/fightSummaryFactory';
import { buildFTUEInitialState } from '@/components/orphanage/ftueStateBuilder';

/** A completed FTUE exhibition bout: combatants, outcome, and fight summary. */
export interface BoutResult {
  a: Warrior;
  d: Warrior;
  outcome: ReturnType<typeof simulateFight>;
  summary: FightSummary;
}

type PoolWarrior = ReturnType<typeof generateOrphanPool>[number];

/** Run the FTUE exhibition bout between the first two selected orphans. */
function simulateTutorialBout(
  selectedWarriors: PoolWarrior[],
  playerPlan: FightPlan | null,
  boutSeed: number
): BoutResult | null {
  if (selectedWarriors.length < 2) return null;
  const poolA = selectedWarriors[0];
  const poolB = selectedWarriors[1];
  if (!poolA || !poolB) return null;
  const wA = makeWarrior(poolA.id as WarriorId, poolA.name, poolA.style, poolA.attrs);
  const wB = makeWarrior(poolB.id as WarriorId, poolB.name, poolB.style, poolB.attrs);
  const planA = playerPlan ?? defaultPlanForWarrior(wA);
  const planB = defaultPlanForWarrior(wB);
  const outcome = simulateFight(planA, planB, wA, wB, boutSeed);
  const tags = outcome.post?.tags ?? [];

  const summary = createBoutSummary(
    wA,
    wB,
    outcome,
    1,
    {
      uuid: () => generateId(undefined, 'ftue'),
    },
    'standard_arena' // simulateFight defaults to the standard arena
  );
  summary.flashyTags = tags;
  summary.fameDeltaA = outcome.winner === 'A' ? 1 : 0;
  summary.fameDeltaD = outcome.winner === 'D' ? 1 : 0;

  return { a: wA, d: wB, outcome, summary };
}

/** Commit the built FTUE result into the store draft. */
function commitFTUEState(
  setState: (fn: (draft: GameStore) => void) => void,
  result: ReturnType<typeof buildFTUEInitialState>,
  graveyard: Warrior[]
): void {
  setState((draft: GameStore) => {
    draft.isFTUE = false;
    draft.ftueComplete = true;
    draft.roster = result.aliveWarriors;
    draft.graveyard = [...graveyard, ...result.deadWarriors];
    draft.rivals = result.rivals;
    draft.recruitPool = result.recruitPool;
    draft.arenaHistory = result.arenaHistory as FightSummary[];
    draft.promoters = result.promoters;
    draft.boutOffers = result.boutOffers;
    draft.realmRankings = result.realmRankings;
  });
}

/**
 * Orphanage FTUE orchestration: step state, identity inputs, orphan pool,
 * selection, plan, tutorial bout, and the finish-commit that builds the
 * initial GameState and navigates to the stable hub.
 */
export function useFtueFlow() {
  const navigate = useNavigate();
  const state = useGameStore(
    useShallow((s) => ({
      player: s.player,
      graveyard: s.graveyard,
      ftueComplete: s.ftueComplete,
      initializeStable: s.initializeStable,
      setState: s.setState,
      returnToTitle: s.returnToTitle,
      saveCurrentState: s.saveCurrentState,
    }))
  );
  const { initializeStable, setState, returnToTitle, saveCurrentState } = state;

  const initialStep = !state.player.stableName ? 0 : 1;
  const [step, setStep] = useState(initialStep);
  const [stableInput, setStableInput] = useState(state.player.stableName || '');
  const [ownerInput, setOwnerInput] = useState(state.player.name || '');

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [poolSeedValue, setPoolSeedValue] = useState(() => cryptoRandomInt(0, 999999));

  const orphanPool = useMemo(() => generateOrphanPool(8, poolSeedValue), [poolSeedValue]);

  const [boutResult, setBoutResult] = useState<BoutResult | null>(null);

  const [playerPlan, setPlayerPlan] = useState<FightPlan | null>(null);
  const [boutSeed] = useState(() => cryptoRandomInt(0, 0x7fffffff));

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
    return makeWarrior(poolA.id as WarriorId, poolA.name, poolA.style, poolA.attrs);
  }, [selectedWarriors]);

  const runTutorialBout = useCallback(() => {
    const result = simulateTutorialBout(selectedWarriors, playerPlan, boutSeed);
    if (result) setBoutResult(result);
  }, [selectedWarriors, playerPlan, boutSeed]);

  const finishFTUE = useCallback(() => {
    if (state.ftueComplete) {
      navigate({ to: '/stable' });
      return;
    }

    const result = buildFTUEInitialState(
      state as unknown as GameState,
      selectedWarriors,
      boutResult as Parameters<typeof buildFTUEInitialState>[2],
      poolSeedValue,
      playerPlan
    );

    commitFTUEState(setState, result, state.graveyard);
    saveCurrentState();

    // Navigate to the Stable hub after FTUE
    navigate({ to: '/stable' });
  }, [
    state,
    setState,
    selectedWarriors,
    boutResult,
    poolSeedValue,
    saveCurrentState,
    navigate,
    playerPlan,
  ]);

  return {
    step,
    setStep,
    stableInput,
    setStableInput,
    ownerInput,
    setOwnerInput,
    selected,
    orphanPool,
    boutResult,
    playerPlan,
    setPlayerPlan,
    planWarrior,
    rerollPool,
    toggleWarrior,
    runTutorialBout,
    finishFTUE,
    initializeStable,
    returnToTitle,
  };
}
