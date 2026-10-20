import { readdirSync, statSync } from 'node:fs';
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
