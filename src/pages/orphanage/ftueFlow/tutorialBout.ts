import { useNavigate } from '@tanstack/react-router';
import { useGameStore, type GameStore } from '@/state/useGameStore';
import { simulateFight, defaultPlanForWarrior } from '@/engine';
import type { GameState } from '@/types/state.types';
import type { Warrior, FightSummary, FightPlan } from '@/types/game';
import { SAVE_STATE_VERSION } from '@/constants/core';
import { generateId } from '@/utils/idUtils';
import { SeededRNG } from '@/utils/random';
import { generateOrphanPool } from '@/data/orphanPool';
import { poolWarriorToWarrior } from '@/engine/recruitment/recruitment';
import { createBoutSummary } from '@/engine/core/fightSummaryFactory';
import { buildFTUEInitialState } from '@/components/orphanage/ftueStateBuilder';

/** A completed FTUE exhibition bout: combatants, outcome, and fight summary. */
export interface FtueBoutResult {
  a: Warrior;
  d: Warrior;
  outcome: ReturnType<typeof simulateFight>;
  summary: FightSummary;
}

export type PoolWarrior = ReturnType<typeof generateOrphanPool>[number];

/** Run the FTUE exhibition bout between the first two selected orphans. */
export function simulateTutorialBout(
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
  const outcome = simulateFight({
    planA: planA,
    planD: planB,
    warriorA: wA,
    warriorD: wB,
    providedRng: boutSeed,
  });
  const tags = outcome.post?.tags ?? [];

  const summary = createBoutSummary(
    {
      warriorA: wA,
      warriorD: wB,
      outcome: outcome,
      week: 1,
      rng: {
        uuid: () => generateId(undefined, 'ftue'),
      },
      arenaId: 'standard_arena',
    } // simulateFight defaults to the standard arena
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

/** Build the post-FTUE game state, commit it, persist, and enter the Stable hub. */
export function commitFtue(props: {
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

  // The store carries no `meta` block (it's synthesized at save time), so the
  // FTUE seed supplies one explicitly instead of casting the store shape.
  const baseState: GameState = {
    ...state,
    meta: {
      gameName: 'Stable Lords',
      version: SAVE_STATE_VERSION,
      createdAt: new Date().toISOString(),
    },
  };
  const result = buildFTUEInitialState(
    baseState,
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
