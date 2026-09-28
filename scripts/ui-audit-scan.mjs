#!/usr/bin/env node
/**
 * ui-audit-scan.mjs — classified Design-Bible violation scanner.
 *
 * Scans src/{components,pages,hooks}/** for violation CLASSES (not raw counts):
 *   token-violation   raw hex/#rgb/rgba()/hsla() literals in className/style —
 *                     Codex Sanguis tokens live in index.css/tailwind config.
 *                     Allowlisted contexts: SVG paint attrs (stopColor/fill/
 *                     stroke inside <svg> trees), data-driven palettes (crest
 *                     metals), files under a checked-in allowlist.
 *   screaming-copy    SCREAMING_SNAKE_CASE or caps+underscore display strings
 *                     in JSX text / string literals.
 *   rng-violation     Math.random() outside utils/random.ts + engine RNG
 *                     service (docs/RNG_POLICY.md).
 *   motion-violation  animate-FOO / transition classes without a
 *                     motion-reduce sibling on the same line (WCAG).
 *   fake-chrome       decorative telemetry-style strings (SECTOR/LIVE SECURE/
 *                     SYS. patterns) with no data binding — honesty audit bait.
 *
 * Output: scripts/out/ui-audit.json + per-class summary.
 * Run: `node scripts/ui-audit-scan.mjs`
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = path.resolve(import.meta.dirname, '..');
const SRC = path.join(ROOT, 'src');
const OUT_DIR = path.join(ROOT, 'scripts', 'out');
const OUT_FILE = path.join(OUT_DIR, 'ui-audit.json');

const SCAN_DIRS = ['components', 'pages', 'hooks'];
// Files/paths where raw literals are legitimately data-driven paint, not tokens.
const PAINT_ALLOWLIST = [
  /components\/crest\//,        // heraldic metal/color palette is data
  /components\/arena\//,        // bout-viewer canvas/SVG paints
  /StaminaCurve/,               // semantic chart colors
  /index\.css|tailwind\.config/,
];
const RNG_ALLOWLIST = [/utils\/random\.ts/, /engine\/core\/rng\//, /AudioManager/];

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
      walk(p, out);
    } else if (/\.tsx?$/.test(entry.name)) out.push(p);
  }
  return out;
}

const rel = (p) => path.relative(ROOT, p).split(path.sep).join('/');
const allowlisted = (r, list) => list.some((re) => re.test(r));

const HEX_RE = /#[0-9a-fA-F]{3,8}\b/;
const RAW_FN_RE = /\b(?:rgba?|hsla?)\s*\((?![^)]*var\(--)[^)]*\d/;
// screaming-copy: only flag UPPER_SNAKE inside quoted strings or JSX text
// (`>FOO_BAR<`) — bare identifiers are constant references, not copy.
const SCREAM_RE = /(['"`>])[^'"`<\n]*\b[A-Z]{2,}_[A-Z0-9_]{2,}\b/;
// fake-chrome: decorative sci-fi chrome words that can't map to real state.
// 'Override'/'telemetry' excluded — both are real game features here.
const FAKE_CHROME_RE = /\b(SECTOR|SECURE|UPLINK|ENCRYPTED|CLASSIFIED|PROTOCOL)\b/;

/** Collect classified UI violations. Returns { findings, filesAffected }. */
export function collectUiAudit() {
  const findings = { 'token-violation': [], 'screaming-copy': [], 'rng-violation': [], 'motion-violation': [], 'fake-chrome': [] };

  for (const dir of SCAN_DIRS) {
    const base = path.join(SRC, dir);
    if (!fs.existsSync(base)) continue;
    for (const file of walk(base)) {
      const r = rel(file);
      const text = fs.readFileSync(file, 'utf8');
      const lines = text.split('\n');
      const isSvgHeavy = /<svg|<stop|<path |<circle|<rect/.test(text);
      const paintOk = isSvgHeavy || allowlisted(r, PAINT_ALLOWLIST);

      for (let i = 0; i < lines.length; i++) {
        const l = lines[i];
        const n = i + 1;
        const trimmed = l.trim();
        if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) continue;

        if ((HEX_RE.test(l) || RAW_FN_RE.test(l)) && !paintOk) {
          findings['token-violation'].push({ file: r, line: n, text: trimmed.slice(0, 140) });
        }
        if (SCREAM_RE.test(l)) {
          findings['screaming-copy'].push({ file: r, line: n, text: trimmed.slice(0, 140) });
        }
        if (/Math\.random\s*\(/.test(l) && !allowlisted(r, RNG_ALLOWLIST)) {
          findings['rng-violation'].push({ file: r, line: n, text: trimmed.slice(0, 140) });
        }
        if (/\banimate-|transition(-|\s|"|')/.test(l) && !/motion-reduce/.test(l)) {
          findings['motion-violation'].push({ file: r, line: n, text: trimmed.slice(0, 140) });
        }
        if (FAKE_CHROME_RE.test(l)) {
          findings['fake-chrome'].push({ file: r, line: n, text: trimmed.slice(0, 140) });
        }
      }
    }
  }

  // Math.random scan extends to engine/ (RNG policy is engine-wide)
  for (const file of walk(path.join(SRC, 'engine'))) {
    const r = rel(file);
    if (allowlisted(r, RNG_ALLOWLIST)) continue;
    const lines = fs.readFileSync(file, 'utf8').split('\n');
    for (let i = 0; i < lines.length; i++)
      if (/Math\.random\s*\(/.test(lines[i])) findings['rng-violation'].push({ file: r, line: i + 1, text: lines[i].trim().slice(0, 140) });
  }

  const byFile = new Map();
  for (const [cls, rows] of Object.entries(findings))
    for (const row of rows) {
      if (!byFile.has(row.file)) byFile.set(row.file, []);
      byFile.get(row.file).push({ class: cls, line: row.line });
    }
  return { findings, filesAffected: byFile.size, byFile };
}

function main() {
  const { findings, filesAffected, byFile } = collectUiAudit();

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify({ findings, filesAffected }, null, 2));

  console.log('=== UI audit summary (classified) ===');
  for (const [cls, rows] of Object.entries(findings)) {
    const files = new Set(rows.map((x) => x.file));
    console.log(`${cls.padEnd(18)} ${String(rows.length).padStart(4)} hits in ${files.size} files`);
  }
  console.log('\nTop offenders:');
  const ranked = [...byFile.entries()].sort((a, b) => b[1].length - a[1].length).slice(0, 20);
  for (const [f, rows] of ranked) {
    const classes = [...new Set(rows.map((x) => x.class))].join(',');
    console.log(`  ${String(rows.length).padStart(3)}  ${f}  [${classes}]`);
  }
  console.log(`\nwrote ${rel(OUT_FILE)}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
