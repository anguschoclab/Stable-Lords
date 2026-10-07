import { useGameStore, reconstructGameState, type GameStore } from '@/state/useGameStore';
import { cryptoRandomInt } from '@/utils/cryptoRandom';
import type { GameState, RivalStableData } from '@/types/state.types';
import { GameStateSchema } from '@/schemas/gameStateSchema';
import { toast } from 'sonner';
import { engineProxy } from '@/engine/runtime/workerProxy';
import { engineSession } from '@/engine/runtime/session';
import { archiveBoutLogs } from '@/engine/pipeline/adapters/opfsArchiver';
import { stripNonSerializable } from '@/state/serialization';

/**
 * Serialize the live store state to a downloadable JSON file.
 */
export function exportSessionState(week: number): void {
  const currentState = useGameStore.getState();
  const data = JSON.stringify({ state: currentState }, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `stable-lords-export-w${week}.json`;
  a.click();
  URL.revokeObjectURL(url);
  toast.success('Current session state exported.');
}

/**
 * Read a previously exported JSON save, schema-validate it, and load it.
 */
export function importSaveFile(
  e: React.ChangeEvent<HTMLInputElement>,
  loadGame: (slotId: string, state: GameState) => void
): void {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const content = event.target?.result;
      if (typeof content !== 'string') throw new Error('Invalid file content');
      const data = JSON.parse(content);
      if (data && data.state) {
        const validatedState = GameStateSchema.parse(data.state) as GameState;
        loadGame('autosave', validatedState);
        toast.success('Save loaded successfully.');
      } else {
        toast.error('Invalid save file.');
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'ZodError') {
        toast.error('Invalid save data: schema validation failed');
        console.error('Zod validation error:', err);
      } else {
        toast.error(err instanceof Error ? err.message : 'Failed to load save.');
      }
    }
  };
  reader.onerror = () => toast.error('Failed to read save file.');
  reader.readAsText(file);
}

/**
 * Shared admin fast-forward runner — the same session/archive contract as
 * the store's runEngineJob: runGuarded supplies the 15s timeout + cancelSim
 * termination (a hung week must not block the worker FIFO forever), epoch
 * discard on undefined, deferred-archive flush on the main thread, then
 * loadGame commit.
 */
async function runAdminSkip(
  job: (state: GameState) => Promise<{ state: GameState; pendingArchives?: unknown[] }>,
  messages: { success: string; failure: string }
): Promise<void> {
  const store = useGameStore.getState();
  if (store.isSimulating) {
    toast.error('Simulation already in progress.');
    return;
  }
  // Parity with doAdvance*: strip computed/cached fields before transfer.
  const currentState = stripNonSerializable(reconstructGameState(store));
  store.setSimulating(true);
  try {
    const result = await engineSession.runGuarded(() => job(currentState as GameState));
    // undefined → epoch moved mid-run (loadGame/reset); discard the result.
    if (!result) return;
    // Batch advancement never does I/O — flush drained transcripts here on
    // the main thread where the Electron/OPFS switch is visible.
    archiveBoutLogs((result.pendingArchives ?? []) as Parameters<typeof archiveBoutLogs>[0]);
    // WorldPass already computed the new season each week — no post-hoc fix needed.
    store.loadGame(store.activeSlotId || 'autosave', result.state);
    toast.success(messages.success);
  } catch (err) {
    console.error('Admin fast-forward failed:', err);
    toast.error(messages.failure);
  } finally {
    store.setSimulating(false);
  }
}

/**
 * Fast-forward the simulation to the next quarter boundary via the engine.
 */
export async function skipToSeasonEnd(): Promise<void> {
  await runAdminSkip((s) => engineProxy.skipToQuarterEnd(s), {
    success: 'Season rollover forced.',
    failure: 'Season rollover failed.',
  });
}

/**
 * Fast-forward the simulation by one month (4 weeks) via the engine.
 * Same session/archive contract as skipToSeasonEnd.
 */
export async function skipToMonthEnd(): Promise<void> {
  await runAdminSkip((s) => engineProxy.skipToMonthEnd(s), {
    success: 'Advanced 4 weeks.',
    failure: 'Month advance failed.',
  });
}

/**
 * Regenerate the entire rival ecosystem with a fresh seed.
 */
export function regenerateRivals(setState: (fn: (draft: GameStore) => void) => void): void {
  import('@/engine/rivals').then(({ generateRivalStables }) => {
    const newRivals = generateRivalStables(23, cryptoRandomInt(0, 2147483647)) as RivalStableData[];
    setState((draft) => {
      draft.rivals = newRivals;
    });
    toast.success('Rival ecosystem regenerated.');
  });
}
