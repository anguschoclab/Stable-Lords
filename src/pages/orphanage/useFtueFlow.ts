import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useShallow } from 'zustand/react/shallow';
import { useGameStore, type GameStore } from '@/state/useGameStore';
import { simulateFight, defaultPlanForWarrior } from '@/engine';
import { loadCombatNarrative } from '@/data/narrative';
import type { GameState } from '@/types/state.types';
import type { Warrior, FightSummary, FightPlan } from '@/types/game';
import { cryptoRandomInt } from '@/utils/cryptoRandom';
import { generateId } from '@/utils/idUtils';
import { SeededRNG } from '@/utils/random';
import { generateOrphanPool } from '@/data/orphanPool';
import { poolWarriorToWarrior } from '@/engine/recruitment/recruitment';
import { createBoutSummary } from '@/engine/core/fightSummaryFactory';
import { buildFTUEInitialState } from '@/components/orphanage/ftueStateBuilder';

/** A completed FTUE exhibition bout: combatants, outcome, and fight summary. */
interface FtueBoutResult {
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
): FtueBoutResult | null {
  if (selectedWarriors.length < 2) return null;
  const poolA = selectedWarriors[0];
  const poolB = selectedWarriors[1];
  if (!poolA || !poolB) return null;
  const wA = poolWarriorToWarrior(poolA, { rng: new SeededRNG(boutSeed) });
  const wB = poolWarriorToWarrior(poolB, { rng: new SeededRNG(boutSeed + 1) });
  const planA = playerPlan ?? defaultPlanForWarrior(wA);
  const planB = defaultPlanForWarrior(wB);
  const outcome = simulateFight({ planA: planA, planD: planB, warriorA: wA, warriorD: wB, providedRng: boutSeed });
  const tags = outcome.post?.tags ?? [];

  const summary = createBoutSummary(
    { warriorA: wA, warriorD: wB, outcome: outcome, week: 1, rng: {
      uuid: () => generateId(undefined, 'ftue'),
    }, arenaId: 'standard_arena' } // simulateFight defaults to the standard arena
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
/** Orphan pool state: seeded pool, up-to-3 selection set, derived picks. */
function useOrphanSelection() {
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

/** Build the post-FTUE game state, commit it, persist, and enter the Stable hub. */
function commitFtue(props: {
  selectedWarriors: Parameters<typeof buildFTUEInitialState>[1];
  boutResult: FtueBoutResult | null;
  poolSeedValue: number;
  playerPlan: FightPlan | null;
  setState: ReturnType<typeof useGameStore.getState>['setState'];
  saveCurrentState: () => void;
  navigate: ReturnType<typeof useNavigate>;
}) {
  const { selectedWarriors, boutResult, poolSeedValue, playerPlan } = props;
  const { setState, saveCurrentState, navigate } = props;
  const state = useGameStore.getState();
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
}

/** Store slice for the FTUE flow — player identity, graveyard, and actions. */
function useFtueStore() {
  return useGameStore(
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
}

/** FTUE flow orchestration: steps, identity fields, orphan picks, finish commit. */
export function useFtueFlow() {
  const navigate = useNavigate();
  const state = useFtueStore();
  const { initializeStable, setState, returnToTitle, saveCurrentState } = state;

  const initialStep = !state.player.stableName ? 0 : 1;
  const [step, setStep] = useState(initialStep);
  const [stableInput, setStableInput] = useState(state.player.stableName || '');
  const [ownerInput, setOwnerInput] = useState(state.player.name || '');

  const {
    selected,
    poolSeedValue,
    orphanPool,
    rerollPool,
    toggleWarrior,
    selectedWarriors,
    planWarrior,
  } = useOrphanSelection();

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

  const finishFTUE = useCallback(() => {
    commitFtue({
      selectedWarriors,
      boutResult,
      poolSeedValue,
      playerPlan,
      setState,
      saveCurrentState,
      navigate,
    });
  }, [
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
