import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtemp, rm, readFile } from 'fs/promises';
import * as os from 'os';
import * as path from 'path';

import { NodeArchiveService } from '@/scripts/nodeArchiveService';
import { createFreshState } from '@/engine/factories/gameStateFactory';

let tmpDir: string;
let service: NodeArchiveService;

beforeAll(async () => {
  tmpDir = await mkdtemp(path.join(os.tmpdir(), 'node-archive-test-'));
  service = new NodeArchiveService(tmpDir);
});

afterAll(async () => {
  await rm(tmpDir, { recursive: true, force: true });
});

describe('NodeArchiveService', () => {
  it('isSupported in node/bun test env', () => {
    expect(service.isSupported()).toBe(true);
  });

  it('archives and retrieves a bout log using the OPFS layout', async () => {
    const transcript = ['MINUTE 1.', 'A strikes!', 'BOUT END'];
    await service.archiveBoutLog(3, 2, 'bout_42', transcript, true);

    // Layout mirrors OPFS: <root>/season_{n}/bouts/{year}_{boutId}.json
    const raw = await readFile(
      path.join(tmpDir, 'season_2', 'bouts', '3_bout_42.json'),
      'utf8'
    );
    expect(JSON.parse(raw)).toEqual(transcript);

    const retrieved = await service.retrieveBoutLog(3, 2, 'bout_42');
    expect(retrieved).toEqual(transcript);
  });

  it('throws ArchiveConflictError on duplicate without overwrite', async () => {
    await service.archiveBoutLog(1, 0, 'dup_1', ['x'], true);
    await expect(service.archiveBoutLog(1, 0, 'dup_1', ['y'], false)).rejects.toMatchObject({
      name: 'ArchiveConflictError',
    });
    // Original preserved
    expect(await service.retrieveBoutLog(1, 0, 'dup_1')).toEqual(['x']);
  });

  it('overwrites when overwrite=true', async () => {
    await service.archiveBoutLog(1, 0, 'ow_1', ['old'], true);
    await service.archiveBoutLog(1, 0, 'ow_1', ['new'], true);
    expect(await service.retrieveBoutLog(1, 0, 'ow_1')).toEqual(['new']);
  });

  it('returns null for missing bout log', async () => {
    expect(await service.retrieveBoutLog(9, 9, 'missing')).toBeNull();
  });

  it('rejects unsafe boutId path segments', async () => {
    await expect(service.archiveBoutLog(1, 0, '../evil', ['x'], true)).rejects.toThrow(TypeError);
  });

  it('archives and retrieves gazette markdown', async () => {
    await service.archiveGazette(1, 7, '# Week 7\nHello');
    const raw = await readFile(
      path.join(tmpDir, 'season_1', 'gazettes', 'week_7.md'),
      'utf8'
    );
    expect(raw).toContain('Hello');
    expect(await service.retrieveGazette(1, 7)).toBe('# Week 7\nHello');
    expect(await service.retrieveGazette(1, 99)).toBeNull();
  });

  it('round-trips hot state with plausibility check', async () => {
    const state = createFreshState('node-archive-hotstate-test');
    await service.archiveHotState('slot-a', state);
    const retrieved = await service.retrieveHotState('slot-a');
    expect(retrieved).not.toBeNull();
    expect(retrieved!.meta.gameName).toBe(state.meta.gameName);
    expect(retrieved!.week).toBe(state.week);
    expect(retrieved!.treasury).toBe(state.treasury);
  });

  it('returns null for implausible hot state payload', async () => {
    await service.archiveHotState('slot-bad', { nope: true } as any);
    expect(await service.retrieveHotState('slot-bad')).toBeNull();
  });

  it('lists archived bout ids for a season', async () => {
    await service.archiveBoutLog(2, 3, 'a_1', ['x'], true);
    await service.archiveBoutLog(2, 3, 'a_2', ['x'], true);
    const ids = await service.getArchivedBoutIdsForSeason(3);
    expect(ids).toEqual(expect.arrayContaining(['2_a_1', '2_a_2']));
    expect(await service.getArchivedBoutIdsForSeason(99)).toEqual([]);
  });
});
