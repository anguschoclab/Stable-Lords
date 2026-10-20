import { toast } from 'sonner';
import { useGameStore } from '@/state/useGameStore';
import { cryptoRandomInt } from '@/utils/cryptoRandom';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import {
  loadFromSlot,
  saveToSlot,
  newSlotId,
  importSaveToNewSlot,
} from '@/state/saveSlots';
import type { CrestData } from '@/types/crest.types';
import type { WorldDifficulty } from '@/types/state.types';
import { applyBackstoryToPlayer, type BackstoryId } from '@/data/backstories';
import { runRankingsPass } from '@/engine/pipeline/passes/RankingsPass';
import { runPromoterPass } from '@/engine/pipeline/passes/PromoterPass';
import { resolveImpacts } from '@/engine/impacts';
import { SeededRNG } from '@/utils/random';

export type LoadGame = ReturnType<typeof useGameStore.getState>['loadGame'];

/**
 * Reads a save file, imports it into a fresh slot, then loads it — with toast
 * feedback at each failure boundary.
 */
export function importSaveFile(
  file: File,
  loadGame: LoadGame,
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

export interface CreateNewGameArgs {
  ownerName: string;
  stableName: string;
  playerCrest: CrestData;
  backstoryId: BackstoryId;
  difficulty: WorldDifficulty;
  loadGame: LoadGame;
}

/** Build, save, and activate a fresh game state for a new stable. */
export async function createNewGame(args: CreateNewGameArgs): Promise<void> {
  const { ownerName, stableName, playerCrest, backstoryId, difficulty, loadGame } = args;
  let fresh = createFreshState('alpha-prime-10', undefined, { difficulty });
  fresh.player.name = ownerName.trim();
  fresh.player.stableName = stableName.trim();
  fresh.player.crest = playerCrest;
  fresh.player.generation = 0;
  fresh.player.avatarSeed = cryptoRandomInt(0, 999999);
  const slotId = newSlotId();
  const identitySeed = slotId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  applyBackstoryToPlayer(fresh, backstoryId, new SeededRNG(identitySeed));
  fresh = resolveImpacts(fresh, [runRankingsPass(fresh), runPromoterPass(fresh)]);
  await saveToSlot(slotId, fresh.player.stableName, fresh);
  loadGame(slotId, fresh);
}
