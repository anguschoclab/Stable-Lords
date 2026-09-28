import fs from 'fs';
import path from 'path';

/**
 * Recursive file listing by extension(s) — shared by the repo-scan audit tests.
 */
export function readDirRecursive(dir: string, exts: string | string[]): string[] {
  const match = Array.isArray(exts) ? exts : [exts];
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...readDirRecursive(full, match));
    } else if (match.some((ext) => entry.name.endsWith(ext))) {
      results.push(full);
    }
  }
  return results;
}
