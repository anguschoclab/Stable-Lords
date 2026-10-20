import { useState, useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useOrphanSelection } from './ftueFlow/useOrphanSelection';
import { useFtueStore } from './ftueFlow/useFtueStore';
import { useFtueBout } from './ftueFlow/useFtueBout';
import { commitFtue } from './ftueFlow/tutorialBout';

/** FTUE flow orchestration: steps, identity fields, orphan picks, finish commit. */
export function useFtueFlow() {
  const navigate = useNavigate();
  const state = useFtueStore();
  const { initializeStable, setState, returnToTitle, saveCurrentState } = state;

  const initialStep = !state.player.stableName ? 0 : 1;
  const [step, setStep] = useState(initialStep);
  const [stableInput, setStableInput] = useState(state.player.stableName || '');
  const [ownerInput, setOwnerInput] = useState(state.player.name || '');

  const sel = useOrphanSelection();
  const bout = useFtueBout(sel.selectedWarriors);

  const finishFTUE = useCallback(() => {
    commitFtue({
      selectedWarriors: sel.selectedWarriors,
      boutResult: bout.boutResult,
      poolSeedValue: sel.poolSeedValue,
      playerPlan: bout.playerPlan,
      setState,
      saveCurrentState,
      navigate,
    });
  }, [
    setState,
    sel.selectedWarriors,
    bout.boutResult,
    sel.poolSeedValue,
    saveCurrentState,
    navigate,
    bout.playerPlan,
  ]);

  return {
    step,
    setStep,
    stableInput,
    setStableInput,
    ownerInput,
    setOwnerInput,
    ...sel,
    ...bout,
    finishFTUE,
    initializeStable,
    returnToTitle,
  };
}
