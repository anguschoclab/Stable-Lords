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
 *   radius-violation  rounded-(xs|sm|md|lg|xl|2xl|3xl) utilities, bare `rounded`,
 *                     or `*:rounded` prose modifiers — bible mandates 0px
 *                     structural radius (rounded-none/rounded-full exempt).
 *   undefined-class   glow-/text-glow- tokens never defined in index.css, or
 *                     animate- tokens defined in neither index.css, tailwind
 *                     config, builtins, nor the animate plugin — silently dead.
 *   italic-tabular    `italic` combined with `tabular-nums` — the bible's
 *                     "numbers are never italic" legibility rule.
 *   tracking-overflow tracking-[Nem] wider than 0.15em — past the small-caps
 *                     legibility ceiling.
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
  /components\/crest\//, // heraldic metal/color palette is data
  /components\/arena\//, // bout-viewer canvas/SVG paints
  /components\/ui\/chart\.tsx/, // recharts internals: hexes are CSS attribute selectors
  /StaminaCurve/, // semantic chart colors
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
// screaming-copy: UPPER_SNAKE as *display copy* only — a JSX text child
// (`>FOO_BAR<`) or a display-attribute string (label/title/placeholder/
// aria-label/subtitle/eyebrow/description). Quoted enum literals in code
// positions (`value=`, `=== 'X_Y'`, `case 'X_Y'`, `key: 'X_Y'`) are constants,
// not copy — the loose `(['"\`>])` trigger also caught `>` from `=>`/`>=`.
const SCREAM_TOKEN = /\b[A-Z]{2,}_[A-Z0-9_]{2,}\b/;
const SCREAM_JSX_TEXT_RE = />[^<>{}]*\b[A-Z]{2,}_[A-Z0-9_]{2,}\b[^<>{}]*</;
const SCREAM_ATTR_RE =
  /\b(?:label|title|placeholder|aria-label|subtitle|eyebrow|description|tooltip|message)\s*=\s*['"`{][^'"`}]*\b[A-Z]{2,}_[A-Z0-9_]{2,}\b/;
const isScreamingCopy = (l) =>
  SCREAM_JSX_TEXT_RE.test(l) || (SCREAM_ATTR_RE.test(l) && SCREAM_TOKEN.test(l));
// fake-chrome: decorative sci-fi chrome or status claims that can't map to real
// state. 'Override'/'telemetry' excluded — both are real game features here.
const FAKE_CHROME_UPPER_RE = /\b(SECTOR|SECURE|UPLINK|ENCRYPTED|CLASSIFIED|PROTOCOL)\b/;
const FAKE_CHROME_COPY_RE =
  /\b(Scouts at work|host connection|lock-on|deep scan|SCAN COMPLETED|LIVE ARENA FEED)\b/i;
const isFakeChrome = (l) => FAKE_CHROME_UPPER_RE.test(l) || FAKE_CHROME_COPY_RE.test(l);

// radius-violation: `rounded-<size>` utility tokens are unambiguously classes
// (can't occur in prose). Bare `rounded` / `*:rounded` modifiers only count on
// lines that also carry a class-bearing attribute or class list, so English
// prose like "rounded shoulders" stays exempt.
const RADIUS_SIZE_RE = /\brounded-(?:xs|sm|md|lg|xl|2xl|3xl)\b/;
const RADIUS_BARE_RE = /(?:^|[\s'"`{:=])rounded(?=$|[\s'"`},;)])/;
const CLASS_CONTEXT_RE = /\bclass(?:Name)?\s*=|ClassName\s*=|particleClassName|extraClass|className:/;
const isRadiusViolation = (l) =>
  RADIUS_SIZE_RE.test(l) || (RADIUS_BARE_RE.test(l) && CLASS_CONTEXT_RE.test(l));

// italic-tabular + tracking-overflow: same class-context gate.
const isItalicTabular = (l) => /\bitalic\b/.test(l) && /tabular-nums/.test(l);
const TRACKING_RE = /\btracking-\[(\d*\.?\d+)em\]/g;
const trackingOverflows = (l) => {
  for (const m of l.matchAll(TRACKING_RE)) if (parseFloat(m[1]) > 0.15) return true;
  return false;
};

// undefined-class: project-prefixed class tokens must resolve. Defined set is
// parsed once from index.css class selectors + tailwind.config animation keys
// + builtin/plugin animate vocabulary.
// Lookbehind keeps `--gold-glow-rgb` var names and longer identifiers out.
const PROJECT_CLASS_RE =
  /(?<![a-zA-Z0-9_-])(?:text-glow|glow|animate)-[a-z][a-z0-9-]*(?:\/\d+)?\b/g;
const ANIMATE_BUILTINS = new Set([
  'animate-none', 'animate-spin', 'animate-ping', 'animate-pulse', 'animate-bounce',
]);
const ANIMATE_PLUGIN_RE =
  /^animate-(?:in|out|fade(?:-in|-out)?(?:-\d+)?|zoom-(?:in|out)(?:-\d+)?|spin-(?:in|out)(?:-\d+)?|slide-in-from-\S+|slide-out-to-\S+|accordion-(?:down|up))$/;
function definedProjectClasses() {
  const defined = new Set();
  const cssPath = path.join(ROOT, 'src', 'index.css');
  if (fs.existsSync(cssPath)) {
    const css = fs.readFileSync(cssPath, 'utf8');
    for (const m of css.matchAll(/\.((?:text-glow|glow|animate)-[a-z][a-z0-9-]*)\b/g))
      defined.add(m[1]);
  }
  const cfgPath = path.join(ROOT, 'tailwind.config.ts');
  if (fs.existsSync(cfgPath)) {
    const cfg = fs.readFileSync(cfgPath, 'utf8');
    const animBlock = cfg.match(/animation:\s*\{([\s\S]*?)\},?\s*\n\s*\}/);
    if (animBlock)
      for (const m of animBlock[1].matchAll(/'([a-z][a-z0-9-]*)'\s*:/g))
        defined.add(`animate-${m[1]}`);
  }
  return defined;
}
const isUndefinedClass = (token, defined) =>
  token.includes('/') || // opacity modifier on a non-utility custom class
  (!defined.has(token) && !ANIMATE_BUILTINS.has(token) && !ANIMATE_PLUGIN_RE.test(token));

// dead-keyframe: an @keyframes block unreferenced by css animation props,
// .animate-* classes, tailwind config, or TSX animation strings is dead CSS.
function deadKeyframes() {
  const cssPath = path.join(ROOT, 'src', 'index.css');
  if (!fs.existsSync(cssPath)) return new Set();
  const css = fs.readFileSync(cssPath, 'utf8');
  const names = new Set();
  for (const m of css.matchAll(/@keyframes\s+([a-zA-Z0-9_-]+)/g)) names.add(m[1]);
  const live = new Set();
  for (const m of css.matchAll(/animation(?:-name)?:\s*([^;}]+)/g))
    for (const id of m[1].matchAll(/[a-zA-Z][a-zA-Z0-9_-]*/g)) live.add(id[0]);
  for (const m of css.matchAll(/\.animate-([a-zA-Z0-9_-]+)/g)) live.add(m[1]);
  const cfgPath = path.join(ROOT, 'tailwind.config.ts');
  const cfg = fs.existsSync(cfgPath) ? fs.readFileSync(cfgPath, 'utf8') : '';
  for (const file of walk(SRC)) {
    const r = rel(file);
    if (/\/test\//.test(r)) continue;
    const text = fs.readFileSync(file, 'utf8');
    for (const m of text.matchAll(/animation(?:-name)?:\s*['"`]([^'"`}]+)['"`]/g))
      for (const id of m[1].matchAll(/[a-zA-Z][a-zA-Z0-9_-]*/g)) live.add(id[0]);
    for (const m of text.matchAll(/animation(?:Name)?:\s*['"`]([^'"`}]+)['"`]/g))
      for (const id of m[1].matchAll(/[a-zA-Z][a-zA-Z0-9_-]*/g)) live.add(id[0]);
    // `animate-<kf>` class tokens count as live refs — the class binds it.
    for (const m of text.matchAll(/animate-([a-z][a-z0-9-]*)/g)) live.add(m[1]);
  }
  for (const name of names)
    if (live.has(name) || cfg.includes(`'${name}'`) || cfg.includes(`"${name}"`))
      names.delete(name);
  return names;
}

/** Collect classified UI violations. Returns { findings, filesAffected }. */
export function collectUiAudit() {
  const findings = {
    'token-violation': [],
    'screaming-copy': [],
    'rng-violation': [],
    'motion-violation': [],
    'fake-chrome': [],
    'radius-violation': [],
    'undefined-class': [],
    'italic-tabular': [],
    'tracking-overflow': [],
    'dead-keyframe': [],
  };
  const defined = definedProjectClasses();

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
        if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*'))
          continue;

        if ((HEX_RE.test(l) || RAW_FN_RE.test(l)) && !paintOk) {
          findings['token-violation'].push({ file: r, line: n, text: trimmed.slice(0, 140) });
        }
        if (isScreamingCopy(l)) {
          findings['screaming-copy'].push({ file: r, line: n, text: trimmed.slice(0, 140) });
        }
        if (/Math\.random\s*\(/.test(l) && !allowlisted(r, RNG_ALLOWLIST)) {
          findings['rng-violation'].push({ file: r, line: n, text: trimmed.slice(0, 140) });
        }
        if (/\banimate-|transition(-|\s|"|')/.test(l) && !/motion-reduce/.test(l)) {
          findings['motion-violation'].push({ file: r, line: n, text: trimmed.slice(0, 140) });
        }
        if (isFakeChrome(l)) {
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
      if (/Math\.random\s*\(/.test(lines[i]))
        findings['rng-violation'].push({
          file: r,
          line: i + 1,
          text: lines[i].trim().slice(0, 140),
        });
  }

  // bible-structure rules sweep all of src/ minus tests — radius, dead-class
  // and legibility violations aren't confined to components/pages/hooks.
  for (const file of walk(SRC)) {
    const r = rel(file);
    if (/\/test\//.test(r) || /\/_[^/]*\//.test(r)) continue;
    const lines = fs.readFileSync(file, 'utf8').split('\n');
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i];
      const n = i + 1;
      const trimmed = l.trim();
      if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*'))
        continue;
      if (isRadiusViolation(l))
        findings['radius-violation'].push({ file: r, line: n, text: trimmed.slice(0, 140) });
      if (isItalicTabular(l))
        findings['italic-tabular'].push({ file: r, line: n, text: trimmed.slice(0, 140) });
      if (trackingOverflows(l))
        findings['tracking-overflow'].push({ file: r, line: n, text: trimmed.slice(0, 140) });
      for (const m of l.matchAll(PROJECT_CLASS_RE))
        if (isUndefinedClass(m[0], defined))
          findings['undefined-class'].push({ file: r, line: n, text: trimmed.slice(0, 140) });
    }
  }

  for (const name of deadKeyframes())
    findings['dead-keyframe'].push({ file: 'src/index.css', line: 0, text: name });

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
