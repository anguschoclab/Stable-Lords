import { existsSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

/**
 * Recursive file walk shared by the repo-scan audit specs — defaults to all
 * .ts/.tsx files; pass `match` to narrow (e.g. /\.(?:test|spec)\.[tj]sx?$/).
 */
export function* walkTsFiles(dir: string, match: RegExp = /\.tsx?$/): Generator<string> {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) yield* walkTsFiles(full, match);
    else if (match.test(entry)) yield full;
  }
}

/** Eager list form of walkTsFiles for specs that want arrays. */
export function listTsFiles(dir: string, match?: RegExp): string[] {
  return [...walkTsFiles(dir, match)];
}

/**
 * Extension-suffix variant — every file under `dir` whose name ends with any
 * of `exts` (string or array, e.g. '.ts' or ['.test.ts', '.test.tsx']).
 * Missing dirs yield an empty list (callers sweep optional output dirs).
 */
export function listFiles(dir: string, exts: string | string[]): string[] {
  const match = Array.isArray(exts) ? exts : [exts];
  const results: string[] = [];
  if (!existsSync(dir)) return results;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...listFiles(full, match));
    else if (match.some((ext) => entry.name.endsWith(ext))) results.push(full);
  }
  return results;
}
