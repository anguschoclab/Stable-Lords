#!/usr/bin/env node
/**
 * scanLib.mjs — shared boilerplate for scripts/*.mjs audit scanners (V30-W5.1).
 *
 * Every structural scanner walks src/, skips test/fixture files, collects
 * violations, and writes scripts/out/<name>.json with the same plumbing.
 * Consolidated here so a scanner file carries only its rules + reporting.
 *
 * Usage:
 *   import { ROOT, walk, rel, isTest, writeReport, scanArgs } from '../lib/scanLib.mjs';
 *   — or from scripts/lib-adjacent dirs, resolve against import.meta.
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

/** Repo root — scripts/lib is two levels below it. */
export const ROOT = path.resolve(import.meta.dirname, '..', '..');

/** Recursively collect .ts/.tsx files under dir (skips node_modules + dotdirs). */
export function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
      walk(p, out);
    } else if (/\.tsx?$/.test(entry.name)) {
      out.push(p);
    }
  }
  return out;
}

/** Repo-root-relative path with forward slashes. */
export const rel = (p) => path.relative(ROOT, p).split(path.sep).join('/');

/** Test/fixture path check — scanners never flag spec infrastructure. */
export const isTest = (r) =>
  r.includes('/test/') ||
  /\.(test|spec)\.tsx?$/.test(r) ||
  r.includes('/_fixtures/') ||
  r.includes('/_setup/');

/** Standard scripts/out dir. */
export const OUT_DIR = path.join(ROOT, 'scripts', 'out');

/**
 * Write a scanner report to scripts/out/<outFile> and log the destination.
 * `payload` is { summary, violations } by convention.
 */
export function writeReport(outFile, payload) {
  const dest = path.join(OUT_DIR, outFile);
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(dest, JSON.stringify(payload, null, 2));
  console.log(`\nwrote ${rel(dest)}`);
}

/** True when moduleUrl is the invoked entry point: `isMain(import.meta.url)`. */
export function isMain(moduleUrl, argv = process.argv) {
  return argv[1] && moduleUrl === pathToFileURL(argv[1]).href;
}
