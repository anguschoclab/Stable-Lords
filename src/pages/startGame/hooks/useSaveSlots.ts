import { useState, useCallback, useMemo, useEffect } from 'react';
import type React from 'react';
import { toast } from 'sonner';
import {
  listSaveSlots,
  loadFromSlot,
  deleteSlot,
  exportSlot,
  type SaveSlotMeta,
} from '@/state/saveSlots';
import { importSaveFile, type LoadGame } from '../startGameOps';

/** Save-slot lifecycle: list, refresh-on-mount, load, delete, import, export. */
export function useSaveSlots(loadGame: LoadGame) {
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
