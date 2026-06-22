# Plan 9 — Offload/trim the Zod schema parse

## Problem (measured)
`GameStateSchema` = 1,379 lines (`gameStateSchema.ts:1283`, `.strict()`). Shipped **twice**:
`opfsArchive-*.js` (88,147 B, main-thread chunk) and `archiveWorker-*.js` (92,271 B) — the
worker only does `flushLogs` and never parses, so its copy is dead weight. **The hot read path
runs on the main thread**: `retrieveHotState` does a synchronous `GameStateSchema.parse(parsed)`
at `service.ts:116` (line 207 `retrieveBoutLog` uses plain `JSON.parse`, no Zod). Legit untrusted
consumers that must keep full validation: `saveSlots.ts:184` (import), `useAdminTools.ts:59`,
`saveSlots.ts:33,44` (`SaveSlotMetaSchema`).

## Recommendation: (b)+(c), not (a)
Sever the static schema import in `service.ts`; on the hot path do an always-on cheap
shape+version check; gate full validation behind `import.meta.env.DEV` via lazy
`await import('@/schemas/gameStateSchema')` so the schema leaves both prod chunks. Not (a)
move-into-worker: reads don't currently touch a worker, dev proxy is main-thread anyway, and
Comlink would structured-clone the whole parsed state back — replacing parse cost with clone cost.

## Changes — `src/engine/storage/opfsArchive/service.ts`
Delete the line-2 `import { GameStateSchema }`. Add `isPlausibleGameState(value)` checking
`meta` object, `roster`/`arenaHistory` arrays, `week`/`year` numbers, `player` object. Rewrite
`retrieveHotState` read branch:
```ts
const parsed: unknown = JSON.parse(await file.text());
if (!isPlausibleGameState(parsed)) { console.error('corrupt/incompatible save'); return null; }
if (import.meta.env.DEV) {
  const { GameStateSchema } = await import('@/schemas/gameStateSchema');
  const r = GameStateSchema.safeParse(parsed);
  if (!r.success) console.error('dev schema drift', r.error.issues); // still return data
}
return parsed as GameState;
```
Use **`safeParse`** not `parse` (current `parse` throws → swallowed → old saves silently vanish).
`import.meta.env.DEV` constant-folds to `false` in prod → Rollup drops the dynamic import →
schema leaves `opfsArchive` AND `archiveWorker` (it was only transitive). Extract a shared
`SAVE_STATE_VERSION` (currently hardcoded `serialization.ts:160`) for the version tripwire.
Leave the untrusted-boundary parses untouched. No edit needed to `archiveWorker.ts`/`archiveWorkerProxy.ts`.

## Verification
`npm run build`: both chunks shrink; `grep -c "AIMED BLOW" dist/assets/opfsArchive-*.js
archiveWorker-*.js` → 0 (now in the import/admin chunk). Load a real save → restores, no stall.
Corrupt a hot-state file → `null`, logged, handled like missing slot. Dev: schema drift → logged
but still loads. `importSaveToNewSlot` with malformed JSON → still rejected.

## Risks
Dropped validation hides corruption (mitigated by always-on tripwire + dev/CI `safeParse`;
residual: deep prod corruption passes — acceptable for self-produced data); dev/prod drift (anchor
the check on stable top-level keys; unit-test good + corrupt fixtures); constant-folding assumption
(verify via grep); version-constant duplication (single `SAVE_STATE_VERSION`); avoid worker
serialization by not routing reads through the worker.

## Critical files
`src/engine/storage/opfsArchive/service.ts`; `src/schemas/gameStateSchema.ts`;
`src/state/saveSlots.ts`; `src/state/serialization.ts`; `src/engine/storage/archiveWorker.ts`.
