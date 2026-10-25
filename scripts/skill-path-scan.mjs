#!/usr/bin/env node
/**
 * skill-path-scan.mjs — skill-doc path drift detector for Stable Lords.
 *
 * Extracts every repo-relative path referenced in .claude/skills/ SKILL.md
 * files and verifies it still exists on disk. Skill docs name test files and
 * scripts that rot silently as the suite reorganizes (the test tree moved to
 * per-domain dirs + a .slow tier); this is the ratchet that catches it.
 *
 * Resolution rules (mirroring how the docs actually cite paths):
 *   - trailing prose punctuation (.,;:`)] ) stripped
 *   - extensionless refs probe .ts/.tsx/.test.ts/.test.tsx/.slow.test.ts/.mjs/.py/.md
 *   - `*` globs and `{a,b}` brace alternates are matched against the repo file index
 *
 * Output: scripts/out/skill-path-scan.json + stdout summary.
 * Exit: 1 when any referenced path is missing (CI gate).
 * Zero dependencies. Run: `node scripts/skill-path-scan.mjs` (or `bun`).
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = path.resolve(import.meta.dirname, '..');
const OUT_DIR = path.join(ROOT, 'scripts', 'out');
const SKILL_DIRS = ['.claude/skills', '.devin/skills', '.agents/skills'];

// Prefixes that count as repo paths when they appear in skill docs.
const PATH_RE = /(?<![\w./-])(src|scripts|docs|e2e|test|public|\.github)\/[A-Za-z0-9_./{}*+\\-]+/g;
const TRAILING = /[.,;:)\]`'"]+$/;
const PROBED_SUFFIXES = ['', '.ts', '.tsx', '.test.ts', '.test.tsx', '.slow.test.ts', '.mjs', '.py', '.md'];

function* skillFiles() {
  for (const dir of SKILL_DIRS) {
    const abs = path.join(ROOT, dir);
    if (!fs.existsSync(abs)) continue;
    for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        const f = path.join(abs, entry.name, 'SKILL.md');
        if (fs.existsSync(f)) yield f;
      }
    }
  }
}

/** All repo files under the path prefixes we care about, posix-style. */
function repoFileIndex() {
  const out = new Set();
  const walk = (abs) => {
    for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
      const p = path.join(abs, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || entry.name.startsWith('.git')) continue;
        walk(p);
      } else {
        out.add(path.relative(ROOT, p).split(path.sep).join('/'));
      }
    }
  };
  for (const top of ['src', 'scripts', 'docs', 'e2e', 'test', 'public']) {
    const abs = path.join(ROOT, top);
    if (fs.existsSync(abs)) walk(abs);
  }
  return out;
}

const globToRe = (glob) =>
  new RegExp(
    '^' +
      glob
        .replace(/[.+^${}()|[\]\\]/g, '\\$&')
        .replace(/\*\*/g, '\x00')
        .replace(/\*/g, '[^/]*')
        .replace(/\x00/g, '.*') +
      '$'
  );

/** Expand `{a,b}` alternates into concrete patterns. */
function expandBraces(p) {
  const m = p.match(/\{([^{}]+)\}/);
  if (!m) return [p];
  return m[1].split(',').flatMap((alt) => expandBraces(p.replace(m[0], alt)));
}

function extractPaths(text) {
  const clean = text.replace(/\\\*/g, '*');
  const found = new Set();
  for (const m of clean.matchAll(PATH_RE)) {
    let p = m[0].replace(TRAILING, '');
    while (p.endsWith('.')) p = p.slice(0, -1);
    if (p.split('/').length < 2) continue;
    found.add(p.replace(/\/+$/, ''));
  }
  return [...found].sort();
}

function resolvePath(p, fileIndex) {
  if (p.includes('*')) {
    for (const expanded of expandBraces(p)) {
      const re = globToRe(expanded);
      for (const f of fileIndex) if (re.test(f)) return expanded;
    }
    return null;
  }
  for (const suffix of PROBED_SUFFIXES) {
    const candidate = p + suffix;
    if (fs.existsSync(path.join(ROOT, candidate))) return candidate;
  }
  return null;
}

const fileIndex = repoFileIndex();
const report = { skills: [], missing: [] };

for (const file of skillFiles()) {
  const skill = path.basename(path.dirname(file));
  const refs = extractPaths(fs.readFileSync(file, 'utf8'));
  const unresolved = [];
  for (const ref of refs) {
    if (!resolvePath(ref, fileIndex)) unresolved.push(ref);
  }
  report.skills.push({ skill, refs: refs.length, unresolved });
  for (const ref of unresolved) report.missing.push({ skill, path: ref });
}

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(path.join(OUT_DIR, 'skill-path-scan.json'), JSON.stringify(report, null, 2) + '\n');

const totalRefs = report.skills.reduce((n, s) => n + s.refs, 0);
console.log(`scanned ${report.skills.length} skills, ${totalRefs} path references`);
if (report.missing.length === 0) {
  console.log('all skill-doc paths resolve.');
} else {
  for (const m of report.missing) console.log(`  MISSING  ${m.skill}: ${m.path}`);
  console.log(`${report.missing.length} unresolved path(s) — stale skill doc(s)`);
  process.exit(1);
}
