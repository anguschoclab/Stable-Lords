import { useState, useCallback, useMemo, useEffect } from 'react';
import type React from 'react';
import { toast } from 'sonner';
import { useGameStore } from '@/state/useGameStore';
import { cryptoRandomInt } from '@/utils/cryptoRandom';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import {
  listSaveSlots,
  loadFromSlot,
  deleteSlot,
  saveToSlot,
  newSlotId,
  exportSlot,
  importSaveToNewSlot,
  type SaveSlotMeta,
} from '@/state/saveSlots';
import { generateCrest } from '@/engine/crest/crestGenerator';
import type { CrestData } from '@/types/crest.types';
import { applyBackstoryToPlayer, type BackstoryId } from '@/data/backstories';
import { runRankingsPass } from '@/engine/pipeline/passes/RankingsPass';
import { runPromoterPass } from '@/engine/pipeline/passes/PromoterPass';
import { resolveImpacts } from '@/engine/impacts';
import { SeededRNGService } from '@/utils/random';

/** Which start screen is currently shown. */
export type Screen = 'title' | 'newGame';

/**
 * Reads a save file, imports it into a fresh slot, then loads it — with toast
 * feedback at each failure boundary.
 */
function importSaveFile(
  file: File,
  loadGame: ReturnType<typeof useGameStore.getState>['loadGame'],
  refreshSlots: () => Promise<void>
): void {
  const reader = new FileReader();
  reader.onload = async (ev) => {
    try {
      const json = ev.target?.result as string;
      const slotId = await importSaveToNewSlot(json);
      if (!slotId) throw new Error('Import failed');
      refreshSlots();
      toast.success('Save imported! Loading now…');
      const state = await loadFromSlot(slotId);
      if (state) {
        loadGame(slotId, state);
      } else {
        toast.error(
          'Imported save could not be loaded — incompatible or corrupted. A backup has been saved.'
        );
      }
    } catch (err) {
      toast.error((err as Error)?.message ?? 'Failed to import save file.');
    }
  };
  reader.onerror = () => toast.error('Failed to read save file.');
  reader.readAsText(file);
}

type LoadGame = ReturnType<typeof useGameStore.getState>['loadGame'];

/** Build, save, and activate a fresh game state for a new stable. */
async function createNewGame(
  ownerName: string,
  stableName: string,
  playerCrest: CrestData,
  backstoryId: BackstoryId,
  loadGame: LoadGame
): Promise<void> {
  let fresh = createFreshState('alpha-prime-10');
  fresh.player.name = ownerName.trim();
  fresh.player.stableName = stableName.trim();
  fresh.player.crest = playerCrest;
  fresh.player.generation = 0;
  const slotId = newSlotId();
  const identitySeed = slotId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  applyBackstoryToPlayer(fresh, backstoryId, new SeededRNGService(identitySeed));
  fresh = resolveImpacts(fresh, [runRankingsPass(fresh), runPromoterPass(fresh)]);
  await saveToSlot(slotId, fresh.player.stableName, fresh);
  loadGame(slotId, fresh);
}

/** Save-slot lifecycle: list, refresh-on-mount, load, delete, import, export. */
function useSaveSlots(loadGame: LoadGame) {
  const [slots, setSlots] = useState<SaveSlotMeta[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<SaveSlotMeta | null>(null);

  const refreshSlots = useCallback(async () => {
    const savedSlots = await listSaveSlots();
    setSlots(savedSlots);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async data loading on mount
    refreshSlots();
  }, [refreshSlots]);

  const mostRecent = useMemo(
    () =>
      slots.length > 0
        ? slots.reduce((latest, current) =>
            current.timestamp > latest.timestamp ? current : latest
          )
        : null,
    [slots]
  );

  const loadSlot = useCallback(
    async (slotId: string) => {
      const state = await loadFromSlot(slotId);
      if (state) {
        loadGame(slotId, state);
      } else {
        toast.error(
          'Save could not be loaded — incompatible or corrupted. A backup has been saved.'
        );
      }
    },
    [loadGame]
  );

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    await deleteSlot(deleteTarget.id);
    refreshSlots();
    setDeleteTarget(null);
  }, [deleteTarget, refreshSlots]);

  const handleImport = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      importSaveFile(file, loadGame, refreshSlots);
      e.target.value = '';
    },
    [loadGame, refreshSlots]
  );

  const handleExport = useCallback((slotId: string) => {
    exportSlot(slotId);
    toast.success('Save exported!');
  }, []);

  return {
    slots,
    deleteTarget,
    setDeleteTarget,
    mostRecent,
    loadSlot,
    handleDelete,
    handleImport,
    handleExport,
  };
}

/** All title-screen orchestration: save slots, new-game creation, import/export/delete. */
export function useStartGame() {
  const loadGame = useGameStore((s) => s.loadGame);
  const [screen, setScreen] = useState<Screen>('title');
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

  const canCreate =
    ownerName.trim().length >= 2 && stableName.trim().length >= 2 && backstoryId != null;

  const {
    slots,
    deleteTarget,
    setDeleteTarget,
    mostRecent,
    loadSlot,
    handleDelete,
    handleImport,
    handleExport,
  } = useSaveSlots(loadGame);

  const handleNewGame = useCallback(async () => {
    if (!backstoryId) return;
    await createNewGame(ownerName, stableName, playerCrest, backstoryId, loadGame);
  }, [ownerName, stableName, playerCrest, backstoryId, loadGame]);

  return {
    screen,
    setScreen,
    slots,
    deleteTarget,
    setDeleteTarget,
    ownerName,
    setOwnerName,
    stableName,
    setStableName,
    playerCrest,
    setPlayerCrest,
    backstoryId,
    setBackstoryId,
    canCreate,
    mostRecent,
    loadSlot,
    handleDelete,
    handleNewGame,
    handleImport,
    handleExport,
  };
}
