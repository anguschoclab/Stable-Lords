import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

/**
 * MEGAPLAN-V13 A7 — reconstruction field-parity guard (characterization):
 *
 * `reconstructGameState` memoizes on `collectStoreValues`'s tracked fields;
 * `hydrateDraft` is where worker-returned/loaded states write the store.
 * Any GameState field hydrated into the store but absent from
 * collectStoreValues is silently invisible to change detection: if only that
 * field changes, the cached GameState goes stale. Today the only intentionally
 * untracked hydrated fields are the EXEMPTIONS below (UI-facing, never sent
 * to the worker, or derived). A new field landing in hydrateDraft without a
 * matching collectStoreValues key fails this spec.
 */

const SRC = path.resolve(__dirname, '../..');
const SERIALIZATION = readFileSync(path.join(SRC, 'state/serialization.ts'), 'utf8');
const CREATE_STORE = readFileSync(path.join(SRC, 'state/createStore.ts'), 'utf8');

/** Hydrated-but-deliberately-untracked fields (UI-only or derived). */
const EXEMPTIONS = new Set([
  'absoluteWeek', // derived in reconstructGameState from year+week
  'pendingResolutionData', // display payload; strip-adjacent, never re-entered
  'lastWeekBoutDisplay', // display payload; stripped before worker transfer
  'activeSlotId',
  'atTitleScreen',
  'lastSavedAt',
  'isSimulating',
]);

function collectKeys(): string[] {
  const m = SERIALIZATION.match(/function collectStoreValues[\s\S]*?\n  return \{([\s\S]*?)\n  \};/);
  expect(m, 'could not locate collectStoreValues return literal').not.toBeNull();
  return [...m![1]!.matchAll(/^\s*(\w+):/gm)].map((x) => x[1]!);
}

function hydratedFields(): string[] {
  const m = CREATE_STORE.match(/function hydrateDraft[\s\S]*?\n\}/);
  expect(m, 'could not locate hydrateDraft').not.toBeNull();
  return [
    ...new Set([...m![0].matchAll(/draft\.(\w+)\s*=/g)].map((x) => x[1]!)),
  ];
}

describe('reconstruction field parity', () => {
  it('every hydrateDraft-written field is tracked by collectStoreValues or exempted', () => {
    const tracked = new Set(collectKeys());
    const missing = hydratedFields().filter((f) => !tracked.has(f) && !EXEMPTIONS.has(f));
    expect(
      missing,
      `hydrateDraft writes fields invisible to reconstructGameState change detection — ` +
        `track them in collectStoreValues or exempt them deliberately: ${missing.join(', ')}`
    ).toEqual([]);
  });

  it('every collectStoreValues key is hydrated or exempted (no phantom tracking)', () => {
    const hydrated = new Set(hydratedFields());
    const phantom = collectKeys().filter((k) => !hydrated.has(k) && !EXEMPTIONS.has(k));
    expect(phantom, `tracked but never hydrated: ${phantom.join(', ')}`).toEqual([]);
  });
});
