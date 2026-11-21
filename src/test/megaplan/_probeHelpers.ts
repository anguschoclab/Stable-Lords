import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

/**
 * Shared repo-file probe helpers for megaplan guard specs — the file-text
 * contract assertions (existence probes, literal-absence checks) every
 * dedup/preservation spec is built from.
 */

export const REPO = path.resolve(__dirname, '../../..');

/** Whether a repo-relative path exists on disk. */
export const fileExists = (p: string) => existsSync(path.join(REPO, p));

/** Repo file contents, or '' when missing/unreadable (absence assertions). */
export const fileText = (p: string) => {
  try {
    return readFileSync(path.join(REPO, p), 'utf8');
  } catch {
    return '';
  }
};

/** True when at least one of the candidate repo paths exists. */
export const candidateExists = (paths: string[]) => paths.some(fileExists);

/** Counts a regex's matches across files — literal-clone budget assertions. */
export const occurrences = (files: string[], re: RegExp) =>
  files.reduce((n, f) => n + (fileText(f).match(re) ?? []).length, 0);
