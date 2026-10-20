import { useState, useCallback } from 'react';
import { useGameStore } from '@/state/useGameStore';
import { cryptoRandomInt } from '@/utils/cryptoRandom';
import { generateCrest } from '@/engine/crest/crestGenerator';
import type { CrestData } from '@/types/crest.types';
import type { WorldDifficulty } from '@/types/state.types';
import type { BackstoryId } from '@/data/backstories';
import { useSaveSlots } from './hooks/useSaveSlots';
import { createNewGame } from './startGameOps';

/** Which start screen is currently shown. */
type Screen = 'title' | 'newGame';

/** New-game form state: identity inputs, crest, backstory, difficulty. */
function useNewGameForm() {
  const [ownerName, setOwnerName] = useState('');
  const [stableName, setStableName] = useState('');
  const [playerCrest, setPlayerCrest] = useState<CrestData>(() =>
    generateCrest({
      seed: cryptoRandomInt(0, 99999),
      philosophy: 'Balanced',
      tier: 'Established',
    })
  );
  const [backstoryId, setBackstoryId] = useState<BackstoryId | null>(null);
  const [difficulty, setDifficulty] = useState<WorldDifficulty>('Challenger');

  const canCreate =
    ownerName.trim().length >= 2 && stableName.trim().length >= 2 && backstoryId != null;

  return {
    ownerName,
    setOwnerName,
    stableName,
    setStableName,
    playerCrest,
    setPlayerCrest,
    backstoryId,
    setBackstoryId,
    difficulty,
    setDifficulty,
    canCreate,
  };
}

/** All title-screen orchestration: save slots, new-game creation, import/export/delete. */
export function useStartGame() {
  const loadGame = useGameStore((s) => s.loadGame);
  const [screen, setScreen] = useState<Screen>('title');
  const form = useNewGameForm();
  const slots = useSaveSlots(loadGame);

  const handleNewGame = useCallback(async () => {
    if (!form.backstoryId) return;
    await createNewGame({
      ownerName: form.ownerName,
      stableName: form.stableName,
      playerCrest: form.playerCrest,
      backstoryId: form.backstoryId,
      difficulty: form.difficulty,
      loadGame,
    });
  }, [
    form.backstoryId,
    form.ownerName,
    form.stableName,
    form.playerCrest,
    form.difficulty,
    loadGame,
  ]);

  return {
    screen,
    setScreen,
    ...form,
    ...slots,
    handleNewGame,
  };
}
