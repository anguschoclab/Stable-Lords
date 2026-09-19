/**
 * NodeArchiveService — fs-backed implementation of the ArchiveService
 * contract for Node/bun script contexts (simulation harness, daily oracle).
 *
 * Mirrors the OPFS on-disk layout so transcripts written here match what the
 * app produces:
 *   <root>/season_{n}/bouts/{year}_{boutId}.json   (JSON string[])
 *   <root>/season_{n}/gazettes/week_{w}.md
 *   <root>/hot_state/{slotId}.json
 *
 * Lives in src/scripts/ deliberately — it imports node:fs and must never be
 * pulled into the browser/engine bundle.
 */
import { mkdir, readFile, readdir, writeFile } from 'fs/promises';
import * as path from 'path';

import type { ArchiveService } from '@/engine/storage/electronArchive';
import { ArchiveConflictError } from '@/engine/storage/ArchiveConflictError';
import { assertSafeFileNamePart } from '@/engine/storage/opfsArchive/validation';
import { isPlausibleGameState } from '@/engine/storage/opfsArchive/plausibility';
import type { GameState } from '@/types/state.types';

/**
 * The NodeArchiveService class.
 */
export class NodeArchiveService implements ArchiveService {
  private writeQueue: Promise<unknown> = Promise.resolve();

  /**
   * Creates a NodeArchiveService rooted at the given directory.
   * @param rootDir - Archive root; defaults to `<cwd>/archives`.
   */
  constructor(private readonly rootDir: string = path.join(process.cwd(), 'archives')) {}

  private async enqueue<T>(task: () => Promise<T>): Promise<T> {
    const p = this.writeQueue.then(task);
    this.writeQueue = p.catch(() => {}); // catch errors to allow next task in queue
    return p;
  }

  /**
   * Is supported.
   */
  isSupported(): boolean {
    return (
      typeof process !== 'undefined' &&
      !!process.versions &&
      (!!process.versions.node || !!process.versions.bun)
    );
  }

  private seasonDir(season: number, type: 'bouts' | 'gazettes'): string {
    return path.join(this.rootDir, `season_${season}`, type);
  }

  private async writeJson(filePath: string, data: unknown): Promise<void> {
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, JSON.stringify(data), 'utf8');
  }

  /**
   * Archive bout log.
   */
  async archiveBoutLog(
    year: number,
    season: number,
    boutId: string,
    logData: string[],
    overwrite = false
  ): Promise<void> {
    assertSafeFileNamePart(boutId, 'boutId');
    return this.enqueue(async () => {
      const filePath = path.join(this.seasonDir(season, 'bouts'), `${year}_${boutId}.json`);
      if (!overwrite) {
        try {
          await readFile(filePath);
          throw new ArchiveConflictError(`Bout log ${boutId} already exists in archive.`);
        } catch (err) {
          if (err instanceof ArchiveConflictError) throw err;
          // ENOENT → file does not exist → safe to write
        }
      }
      await this.writeJson(filePath, logData);
    });
  }

  /**
   * Retrieve bout log.
   */
  async retrieveBoutLog(year: number, season: number, boutId: string): Promise<string[] | null> {
    assertSafeFileNamePart(boutId, 'boutId');
    try {
      const filePath = path.join(this.seasonDir(season, 'bouts'), `${year}_${boutId}.json`);
      const text = await readFile(filePath, 'utf8');
      return JSON.parse(text) as string[];
    } catch {
      return null;
    }
  }

  /**
   * Archive gazette.
   */
  async archiveGazette(season: number, week: number, markdown: string): Promise<void> {
    assertSafeFileNamePart(String(week), 'week');
    return this.enqueue(async () => {
      const filePath = path.join(this.seasonDir(season, 'gazettes'), `week_${week}.md`);
      await mkdir(path.dirname(filePath), { recursive: true });
      await writeFile(filePath, markdown, 'utf8');
    });
  }

  /**
   * Retrieve gazette.
   */
  async retrieveGazette(season: number, week: number): Promise<string | null> {
    assertSafeFileNamePart(String(week), 'week');
    try {
      const filePath = path.join(this.seasonDir(season, 'gazettes'), `week_${week}.md`);
      return await readFile(filePath, 'utf8');
    } catch {
      return null;
    }
  }

  /**
   * Archive hot state.
   */
  async archiveHotState(slotId: string, stateData: GameState): Promise<void> {
    assertSafeFileNamePart(slotId, 'slotId');
    return this.enqueue(async () => {
      await this.writeJson(path.join(this.rootDir, 'hot_state', `${slotId}.json`), stateData);
    });
  }

  /**
   * Retrieve hot state.
   */
  async retrieveHotState(slotId: string): Promise<GameState | null> {
    assertSafeFileNamePart(slotId, 'slotId');
    try {
      const filePath = path.join(this.rootDir, 'hot_state', `${slotId}.json`);
      const text = await readFile(filePath, 'utf8');
      const parsed: unknown = JSON.parse(text);
      if (!isPlausibleGameState(parsed)) {
        console.error('corrupt/incompatible save: failed plausibility check', { slotId });
        return null;
      }
      return parsed as GameState;
    } catch {
      return null;
    }
  }

  /**
   * Get archived bout ids for season.
   */
  async getArchivedBoutIdsForSeason(season: number): Promise<string[]> {
    try {
      const entries = await readdir(this.seasonDir(season, 'bouts'));
      return entries.filter((e) => e.endsWith('.json')).map((e) => e.replace(/\.json$/, ''));
    } catch {
      return [];
    }
  }
}
