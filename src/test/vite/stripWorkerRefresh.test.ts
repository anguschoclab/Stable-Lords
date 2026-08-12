import { describe, it, expect } from 'vitest';

// Test the regex pattern that stripWorkerRefresh should use to match worker files.
// The current implementation only matches 'engine/worker.ts' which misses
// 'engine/storage/archiveWorker.ts'. This test validates the corrected pattern.

const WORKER_FILE_PATTERN = /engine\/(worker|storage\/archiveWorker)\.ts/;

describe('stripWorkerRefresh — worker file matching', () => {
  it('matches engine/worker.ts', () => {
    const id = '/project/src/engine/worker.ts';
    expect(WORKER_FILE_PATTERN.test(id)).toBe(true);
  });

  it('matches engine/storage/archiveWorker.ts', () => {
    const id = '/project/src/engine/storage/archiveWorker.ts';
    expect(WORKER_FILE_PATTERN.test(id)).toBe(true);
  });

  it('matches engine/worker?worker-import query variant', () => {
    // Vite sometimes appends query suffixes to worker module IDs
    const id = '/project/src/engine/worker.ts?worker-import';
    // The pattern should still match the .ts part
    expect(WORKER_FILE_PATTERN.test(id)).toBe(true);
  });

  it('does NOT match non-worker files', () => {
    const ids = [
      '/project/src/engine/simulate.ts',
      '/project/src/engine/pipeline/services/weekPipelineService.ts',
      '/project/src/state/createStore.ts',
    ];
    for (const id of ids) {
      expect(WORKER_FILE_PATTERN.test(id)).toBe(false);
    }
  });
});
