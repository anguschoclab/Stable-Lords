#!/usr/bin/env node
/**
 * orphan-report.mjs — PO-facing markdown companion to orphan-scan.mjs.
 *
 * Reads the orphan-scan report (passed in-process by the scanner, or loaded
 * from scripts/out/orphan-scan.json when run standalone), re-derives the
 * per-symbol classifications the scanner can't see (lazy imports, internal
 * use, test consumers, type-vs-code), renders curated ANNOTATIONS for known
 * items, and auto-surfaces any NEW flagged symbol as UNTRIAGED so the report
 * stays accurate as the codebase drifts.
 *
 * Output: scripts/out/orphan-report.md. Zero dependencies.
 * Run: `node scripts/orphan-report.mjs` (after orphan-scan has written its
 * JSON) — or it runs automatically at the end of `node scripts/orphan-scan.mjs`.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const OUT_DIR = path.join(ROOT, 'scripts', 'out');
const SCAN_JSON = path.join(OUT_DIR, 'orphan-scan.json');
const OUT_FILE = path.join(OUT_DIR, 'orphan-report.md');
const GUARD_TEST = path.join(ROOT, 'src', 'test', 'megaplan', 'orphanScan.guard.slow.test.ts');
const SOURCE_EXT = ['.ts', '.tsx', '.mts', '.cts'];

// ─── Curated triage annotations ─────────────────────────────────────────────
// Keyed `file::symbol`. Sections: A = decide (integrate/delete), B = unexport,
// KEEP = explained keep. Anything flagged by the scan but absent here lands in
// the UNTRIAGED section — that is the drift alarm. When you triage a new
// orphan, add its entry here; when a symbol leaves the scan, its entry becomes
// inert and can be pruned.

const UNIQ = {
  unique: '🟣 **UNIQUE**',
  uniqueTrivial: '🟣 **UNIQUE** *(trivial)*',
  uniqueSuperseded: '🟣 **UNIQUE** *(superseded semantics)*',
  passThrough: '⚪ **PASS-THROUGH**',
};

const ANNOTATIONS = {
  'src/engine/warrior/careerUpdate.ts::updateWarriorAfterBout': {
    section: 'A',
    uniq: UNIQ.uniqueSuperseded,
    title: 'legacy post-bout updater',
    body: [
      '**What it is:** A "legacy-compatible function matching the signature of the',
      'original `updateWarriorAfterBout`" (its own docstring). Wraps',
      '`calculateCareerUpdate` + `applyCareerUpdate` + `flashyFlair`.',
      '**Uniqueness:** not a pure duplicate — compared to the live',
      '`warriorStateUpdater.ts` twin (`wasKilled` = killer, fatigue resets for the',
      'killer, caller-computed fame deltas), this path treats `wasKilled` as the',
      '*victim* (`isVictim` → `status: \'Dead\'`, fatigue resets for the dead),',
      'auto-computes fame +1 win/+3 kill, rolls epithet for any non-victim, and',
      'overwrites `status` — semantics the current bout model deliberately moved',
      'out (death status lives in `mortalityHandler`).',
      '**Why orphaned:** production uses `warriorStateUpdater.ts` (via',
      '`recordHandler.ts`) and `updateWarriorFromBoutOutcome` for tournaments;',
      'only `src/test/engine/warrior/careerUpdate.test.ts` calls this wrapper.',
      '**Recommendation:** **delete** — two same-named functions with divergent',
      'semantics in neighboring modules is a footgun, not a fallback.',
    ].join('\n  '),
  },
  'src/utils/math.ts::clamp01': {
    section: 'A',
    uniq: UNIQ.uniqueTrivial,
    title: 'unused clamp-to-[0,1] helper',
    body: [
      '**Uniqueness:** sole *shared* implementation, but the behavior already',
      'exists inline at 3 production sites (`AudioManager.ts` ×2,',
      '`economy/weeklyBreakdown.ts`) using `Math.min(1, Math.max(0, …))`.',
      '**Recommendation:** **delete or integrate** — either drop it or migrate',
      'the 3 inline sites so it stops flagging.',
    ].join('\n  '),
  },
  'src/utils/math.ts::lerp': {
    section: 'A',
    uniq: UNIQ.uniqueTrivial,
    title: 'unused linear-interpolation helper',
    body: [
      '**Uniqueness:** the only `lerp` implementation — called solely by',
      '`mapRange` (also orphaned) and tests. **Recommendation:** **delete**',
      '(~15 lines + spec).',
    ].join('\n  '),
  },
  'src/utils/math.ts::mapRange': {
    section: 'A',
    uniq: UNIQ.uniqueTrivial,
    title: 'unused range-remap helper',
    body: [
      '**Uniqueness:** the only `mapRange` implementation — called solely by',
      'tests. **Recommendation:** **delete** (~15 lines + spec).',
    ].join('\n  '),
  },
  'src/engine/matchmaking/tournamentSelection.ts::TOURNAMENT_TIERS': {
    section: 'A',
    uniq: UNIQ.passThrough,
    title: 'redundant re-export',
    body: [
      '**Uniqueness:** zero code — a one-line re-export of the constant in',
      '`./tournamentSelection/core`; the real consumer',
      '(`engine/advisor/tournamentAdvisor.ts`) deep-imports from `core` anyway.',
      '**Recommendation:** **delete the re-export** (1 line) or route the',
      'advisor through it — either direction is cheap.',
    ].join('\n  '),
  },
  'src/data/arenas/index.ts::resetArenaRegistry': {
    section: 'KEEP',
    uniq: UNIQ.unique,
    title: 'test-only lifecycle hook',
    body: [
      'The only reset path for the arena data-registry singleton — product-dead',
      'but test-alive; deleting it breaks test isolation. **Recommendation:**',
      '**keep** (a `_test` suffix convention would document intent).',
    ].join('\n  '),
  },
  'src/engine/core/deathNotifier.ts::clearDeathHandlers': {
    section: 'KEEP',
    uniq: UNIQ.unique,
    title: 'test-only lifecycle hook',
    body: [
      'The only reset path for the `onWarriorDeath` listener registry —',
      'product-dead but test-alive. **Recommendation:** **keep**.',
    ].join('\n  '),
  },
  'src/engine/core/historyResolver.ts::clearHistoryResolverCaches': {
    section: 'KEEP',
    uniq: UNIQ.unique,
    title: 'test-only lifecycle hook',
    body: [
      'The only reset path for the name/stable resolution caches —',
      'product-dead but test-alive. **Recommendation:** **keep**.',
    ].join('\n  '),
  },
  'src/engine/storage/electronArchive.ts::ArchiveConflictError': {
    section: 'KEEP',
    uniq: UNIQ.passThrough,
    title: 'public error-class re-export',
    body: [
      'Re-export of `ArchiveConflictError` (declared in `./ArchiveConflictError`)',
      '— the thrown conflict type for the save-archive service, consumed by',
      '`scripts/nodeArchiveService.ts` and archive tests. The class itself is',
      'unique; this line is just its public doorway. **Recommendation:** **keep**',
      '— deleting forces consumers onto a deep import.',
    ].join('\n  '),
  },
  'src/engine/ai/plan/strategyLab.ts::RhythmBand': { section: 'B' },
  'src/engine/ai/plan/strategyLab.ts::bandOf': { section: 'B' },
  'src/engine/ai/plan/strategyLab.ts::cellKey': { section: 'B' },
  'src/engine/ai/plan/strategyLab.ts::StrategyTarget': { section: 'B' },
  'src/engine/warrior/designReview.ts::DesignReviewItem': { section: 'B' },
};

const SECTION_B_NOTES = {
  'src/engine/ai/plan/strategyLab.ts':
    'banding helpers for the strategy-memory grid — used by `recordPlanOutcome`, `pickStrategyTarget`',
  'src/engine/warrior/designReview.ts':
    'internal row type — used by `reviewWarriorDesign` (~22 uses)',
};

// ─── File collection (mirrors orphan-scan.mjs) ───────────────────────────────

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
      walk(p, out);
    } else out.push(p);
  }
  return out;
}

const SRC = path.join(ROOT, 'src');
const srcFiles = walk(SRC).filter((f) => SOURCE_EXT.includes(path.extname(f)));
const testFiles = srcFiles.filter(
  (f) =>
    f.includes('/test/') || /\.(test|spec)\.[tj]sx?$/.test(f) || f.includes('/_fixtures/')
);
const scriptFiles = walk(path.join(ROOT, 'scripts')).filter(
  (f) => SOURCE_EXT.includes(path.extname(f)) || /\.[cm]?js$/.test(f)
);
const e2eFiles = walk(path.join(ROOT, 'e2e')).filter((f) =>
  SOURCE_EXT.includes(path.extname(f))
);

const fileCode = new Map();
for (const f of [...srcFiles, ...scriptFiles, ...e2eFiles]) {
  try {
    fileCode.set(f, fs.readFileSync(f, 'utf8'));
  } catch {}
}

// ─── Classification helpers ─────────────────────────────────────────────────

const rel = (abs) => path.relative(ROOT, abs).split(path.sep).join('/');

function symbolRefs(symbol, files) {
  const re = new RegExp(`\\b${symbol.replace(/[$]/g, '\\$')}\\b`);
  return files.filter((f) => re.test(fileCode.get(f) || ''));
}

/** Top-level enclosing declaration per line (heuristic; matches triage pass). */
function internalCallers(fileAbs, symbol) {
  const code = fileCode.get(fileAbs);
  if (!code) return [];
  const lines = code.split('\n');
  const tops = [];
  let depth = 0;
  let cur = '(module top)';
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i].trim();
    const m = /^(?:export\s+)?(?:async\s+)?(?:function|const|class|interface|type)\s+([\w$]+)/.exec(l);
    if (depth === 0 && m) cur = m[1];
    tops[i] = cur;
    for (const ch of lines[i]) {
      if (ch === '{') depth++;
      else if (ch === '}') depth--;
    }
    if (depth === 0 && /^\}/.test(l)) cur = '(module top)';
  }
  const re = new RegExp(`\\b${symbol.replace(/[$]/g, '\\$')}\\b`);
  const users = new Set();
  lines.forEach((l, i) => {
    const t = l.trim();
    if (re.test(l) && !/^\s*export\s/.test(t) && !/^\s*\*/.test(t)) users.add(tops[i]);
  });
  users.delete(symbol);
  return [...users];
}

/** Files consumed via React.lazy / dynamic import — scanner sees the edge but
 * not the named consumer, so their exports false-positive as dead. */
function lazyConsumedFiles() {
  const lazy = new Set();
  const re = /import\(\s*['"]([^'"]+)['"]\s*\)/g;
  for (const [abs, code] of fileCode) {
    if (!rel(abs).startsWith('src/')) continue;
    let m;
    re.lastIndex = 0;
    while ((m = re.exec(code))) {
      const spec = m[1];
      let base = spec.startsWith('@/')
        ? path.join(SRC, spec.slice(2))
        : path.resolve(path.dirname(abs), spec);
      for (const ext of ['.tsx', '.ts', '/index.tsx', '/index.ts']) {
        if (fs.existsSync(base + ext)) {
          lazy.add(rel(base + ext));
          break;
        }
      }
      if (fs.existsSync(base)) lazy.add(rel(base));
    }
  }
  return lazy;
}

function isTypeExport(code, symbol) {
  return new RegExp(`export\\s+(?:interface|type)\\s+${symbol}\\b`).test(code);
}

function ownFileRefCount(code, symbol) {
  const re = new RegExp(`\\b${symbol.replace(/[$]/g, '\\$')}\\b`, 'g');
  return (code.match(re) || []).length;
}

/** Is `symbol` only re-exported (no local declaration in this file)? */
function isPassThrough(code, symbol) {
  const localDecl = new RegExp(
    `(?:function|const|let|var|class|interface|type|enum)\\s+${symbol}\\b|export\\s+default\\s+function\\s+${symbol}\\b`
  ).test(code);
  return !localDecl;
}

/** Index: declared symbol name -> files that declare it (alternate-flow check).
 * Includes non-exported decls — an alternate flow need not be exported. */
function buildDeclNameIndex() {
  const index = new Map();
  const re1 =
    /(?:export\s+)?(?:default\s+)?(?:async\s+)?(?:function|const|let|var|class|interface|type|enum)\s+([\w$]+)/g;
  for (const [abs, code] of fileCode) {
    const r = rel(abs);
    // Production decls only — a test fixture sharing the name is not an
    // alternate production flow.
    if (!r.startsWith('src/') || r.includes('/test/') || /\.(test|spec)\.[tj]sx?$/.test(r))
      continue;
    let m;
    re1.lastIndex = 0;
    while ((m = re1.exec(code))) {
      if (!index.has(m[1])) index.set(m[1], new Set());
      index.get(m[1]).add(r);
    }
  }
  return index;
}

let DECL_INDEX = null;
function declIndex() {
  if (!DECL_INDEX) DECL_INDEX = buildDeclNameIndex();
  return DECL_INDEX;
}

/** Extract a symbol's declaration body (decl start → balanced close / `;`). */
function extractDeclBody(code, symbol) {
  const re = new RegExp(
    `(?:export\\s+)?(?:default\\s+)?(?:async\\s+)?(?:function|const|let|var|class|interface|type|enum)\\s+${symbol}\\b`
  );
  const m = re.exec(code);
  if (!m) return null;
  let i = m.index;
  const braceAt = code.indexOf('{', i);
  const semiAt = code.indexOf(';', i);
  if (semiAt !== -1 && (braceAt === -1 || semiAt < braceAt)) {
    return code.slice(i, semiAt + 1); // value/type decl — ends at first ;
  }
  if (braceAt === -1) return code.slice(i, i + 400);
  let depth = 0;
  for (let j = braceAt; j < code.length; j++) {
    if (code[j] === '{') depth++;
    else if (code[j] === '}') {
      depth--;
      if (depth === 0) return code.slice(i, j + 1);
    }
  }
  return code.slice(i);
}

/** Token-multiset Jaccard similarity in [0,1] between two code bodies. */
function bodySimilarity(a, b) {
  const tok = (s) =>
    (s || '')
      .replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, ' ')
      .replace(/\s+/g, ' ')
      .split(/[^\w$]+/)
      .filter(Boolean);
  const count = (arr) => {
    const m = new Map();
    for (const t of arr) m.set(t, (m.get(t) || 0) + 1);
    return m;
  };
  const A = count(tok(a));
  const B = count(tok(b));
  if (!A.size && !B.size) return 0;
  let inter = 0;
  let union = 0;
  for (const [t, n] of A) {
    const bN = B.get(t) || 0;
    inter += Math.min(n, bN);
    union += Math.max(n, bN);
  }
  for (const [t, n] of B) if (!A.has(t)) union += n;
  return union ? inter / union : 0;
}

/** For a symbol also declared elsewhere: compare bodies → alternate-flow list. */
function alternateFlows(file, symbol) {
  const code = fileCode.get(path.join(ROOT, file)) || '';
  const own = extractDeclBody(code, symbol);
  const flows = [];
  const declFiles = [...(declIndex().get(symbol) || [])].filter((f) => f !== file);
  for (const other of declFiles) {
    const otherBody = extractDeclBody(fileCode.get(path.join(ROOT, other)) || '', symbol);
    const sim = own && otherBody ? bodySimilarity(own, otherBody) : 0;
    flows.push({
      file: other,
      similarity: Number(sim.toFixed(2)),
      verdict: sim >= 0.9 ? 'identical' : sim >= 0.3 ? 'divergent' : 'distinct',
    });
  }
  return flows;
}

// ─── Domain grouping for Section C ──────────────────────────────────────────

function domainOf(file) {
  if (file.startsWith('src/engine/ai/')) return 'AI decisioning';
  if (file.startsWith('src/engine/combat/') || file.startsWith('src/engine/bout/'))
    return 'Combat & bout';
  if (
    file.startsWith('src/engine/warrior/') ||
    file.startsWith('src/engine/training/') ||
    file.startsWith('src/engine/owner/')
  )
    return 'Warrior & training';
  if (
    file.startsWith('src/engine/matchmaking/') ||
    file.startsWith('src/engine/championship/') ||
    file.startsWith('src/engine/promoters/') ||
    file.startsWith('src/engine/scouting/') ||
    file.startsWith('src/engine/stable/')
  )
    return 'Matchmaking, scouting & reputation';
  if (file.startsWith('src/engine/')) return 'Engine core & services';
  if (file.startsWith('src/data/') || file.startsWith('src/schemas/'))
    return 'Data & schemas';
  return 'UI, hooks & state';
}

// ─── Ratchet limit from the guard test ──────────────────────────────────────

function ratchetLimit() {
  try {
    const code = fs.readFileSync(GUARD_TEST, 'utf8');
    const m = /toBeLessThanOrEqual\((\d+)\)/.exec(code);
    return m ? Number(m[1]) : null;
  } catch {
    return null;
  }
}

// ─── Triage analysis (the unique-code measure) ──────────────────────────────
// Mutates report.deadExports entries with a `triage` object and returns the
// render buckets + summary that gets embedded in the JSON as `triageSummary`.
// uniqueness values: 'unique' | 'unique-trivial' | 'unique-superseded' |
// 'pass-through' | 'duplicate-name' | 'library-surface' | 'unassessed'.

export function analyzeOrphans(report) {
  const lazyFiles = lazyConsumedFiles();

  const buckets = {
    sectionA: [],
    sectionB: [],
    keepHooks: [],
    lazyDead: [],
    uiKit: [],
    sectionC: new Map(),
    untriaged: [],
  };

  for (const d of report.deadExports) {
    if (!d.file.startsWith('src/')) {
      d.triage = { class: 'tooling', uniqueness: 'tooling-surface', unique: false, triaged: true };
      continue;
    }
    const key = `${d.file}::${d.symbol}`;
    const abs = path.join(ROOT, d.file);
    const code = fileCode.get(abs) || '';
    const ann = ANNOTATIONS[key];

    // Duplication measure — alternate production flows sharing this name.
    const flows = alternateFlows(d.file, d.symbol);
    const hasAlternateFlow = flows.length > 0;
    const worstVerdict = flows.find((f) => f.verdict === 'identical')
      ? 'identical'
      : flows.find((f) => f.verdict === 'divergent')
        ? 'divergent'
        : hasAlternateFlow
          ? 'distinct'
          : null;
    const duplication = { hasAlternateFlow, worstVerdict, alternateFlows: flows };

    const base = {
      duplicateName: hasAlternateFlow,
      duplication,
      liveVia: '',
      evidence: '',
      triaged: true,
      uniqueness: 'unique',
      unique: true,
    };

    // Curated verdicts win over structural classification — a KEEP/A/B
    // annotation is stronger evidence than path or lazy-import heuristics.
    if (ann?.section === 'KEEP') {
      d.triage = { ...base, class: 'keep', uniqueness: 'unique' };
      buckets.keepHooks.push({ d, ann });
      continue;
    }
    if (ann?.section === 'A') {
      d.triage = {
        ...base,
        class: 'A',
        uniqueness: ann.uniq.includes('PASS-THROUGH')
          ? 'pass-through'
          : ann.uniq.includes('superseded')
            ? 'unique-superseded'
            : ann.uniq.includes('trivial')
              ? 'unique-trivial'
              : 'unique',
      };
      sectionAEntry(buckets, d, ann);
      continue;
    }
    if (ann?.section === 'B') {
      d.triage = { ...base, class: 'B', uniqueness: 'unique' };
      buckets.sectionB.push({ d, ann });
      continue;
    }
    if (d.file.startsWith('src/components/ui/')) {
      d.triage = { ...base, class: 'D-uikit', uniqueness: 'library-surface', unique: false };
      buckets.uiKit.push(d);
      continue;
    }
    if (lazyFiles.has(d.file)) {
      d.triage = { ...base, class: 'D-lazy', evidence: 'lazy-imported' };
      buckets.lazyDead.push(d);
      continue;
    }

    // Unannotated: classify by usage evidence.
    const tests = symbolRefs(d.symbol, testFiles).length;
    const scripts = symbolRefs(d.symbol, scriptFiles).length;
    const own = ownFileRefCount(code, d.symbol);
    const type = isTypeExport(code, d.symbol);
    const callers = internalCallers(abs, d.symbol);
    const via = callers.filter((c) => c !== '(module top)').join(', ') || 'module scope';

    if (isPassThrough(code, d.symbol) && !type) {
      d.triage = {
        ...base,
        class: 'untriaged',
        uniqueness: 'pass-through',
        unique: false,
        triaged: false,
        evidence: 're-export with no local declaration — add ANNOTATIONS verdict',
      };
      buckets.untriaged.push(d);
    } else if (own <= 1 && tests === 0 && scripts === 0 && !type) {
      d.triage = {
        ...base,
        class: 'untriaged',
        uniqueness: 'unassessed',
        unique: null,
        triaged: false,
        evidence: 'zero-ref code — dead even inside its own file',
      };
      buckets.untriaged.push(d);
    } else if (own <= 1 && tests > 0) {
      d.triage = {
        ...base,
        class: 'untriaged',
        uniqueness: 'unassessed',
        unique: null,
        triaged: false,
        evidence: 'test-only symbol with no internal use — lifecycle hook?',
      };
      buckets.untriaged.push(d);
    } else if (tests === 0 && scripts === 0 && callers.length === 0) {
      d.triage = {
        ...base,
        class: 'untriaged',
        uniqueness: worstVerdict === 'identical' ? 'duplicate-name' : 'unassessed',
        unique: worstVerdict === 'identical' ? false : null,
        triaged: false,
        evidence: 'zero external refs — likely over-export',
      };
      buckets.untriaged.push(d);
    } else {
      const domain = domainOf(d.file);
      if (!buckets.sectionC.has(domain)) buckets.sectionC.set(domain, []);
      const row = {
        file: d.file,
        symbol: d.symbol + (type ? ' *(type)*' : ''),
        via,
        dup: worstVerdict,
      };
      buckets.sectionC.get(domain).push(row);
      d.triage = {
        ...base,
        class: 'C',
        uniqueness: worstVerdict === 'identical' ? 'duplicate-name' : 'unique',
        unique: worstVerdict !== 'identical',
        liveVia: via,
        evidence: `tests:${tests}${scripts ? ` scripts:${scripts}` : ''}${type ? ' type' : ''}`,
      };
      if (hasAlternateFlow)
        d.triage.evidence += ` | alt-flow(${worstVerdict}): ${flows.map((f) => `${f.file}@${f.similarity}`).join(', ')}`;
    }
  }

  const summary = {
    generatedAt: new Date().toISOString(),
    byClass: countClasses(report.deadExports),
    uniqueCodeCount: report.deadExports.filter((d) => d.triage?.unique === true).length,
    alternateFlowCount: report.deadExports.filter(
      (d) => d.triage?.duplication?.hasAlternateFlow
    ).length,
    alternateFlows: report.deadExports
      .filter((d) => d.triage?.duplication?.hasAlternateFlow)
      .map((d) => ({
        file: d.file,
        symbol: d.symbol,
        class: d.triage.class,
        worstVerdict: d.triage.duplication.worstVerdict,
        flows: d.triage.duplication.alternateFlows,
      })),
    untriaged: buckets.untriaged.map((d) => `${d.file}::${d.symbol}`),
  };
  return { summary, buckets };
}

function sectionAEntry(buckets, d, ann) {
  buckets.sectionA.push({ d, ann });
}

function countClasses(deadExports) {
  const counts = {};
  for (const d of deadExports) {
    const c = d.triage?.class || 'unclassified';
    counts[c] = (counts[c] || 0) + 1;
  }
  return counts;
}

// ─── Render ─────────────────────────────────────────────────────────────────

export function generateOrphanReport(report, bucketsArg) {
  const buckets = bucketsArg || analyzeOrphans(report).buckets;
  const { sectionA, sectionB, keepHooks, lazyDead, uiKit, sectionC, untriaged } =
    buckets;
  const dead = report.deadExports.filter((d) => d.file.startsWith('src/'));
  const limit = ratchetLimit();
  const L = [];
  const push = (...ls) => L.push(...ls);
  const table = (hdrs, rows) => {
    push(
      `| ${hdrs.join(' | ')} |`,
      `| ${hdrs.map(() => '---').join(' | ')} |`,
      ...rows.map((r) => `| ${r.join(' | ')} |`),
      ''
    );
  };

  const status =
    limit == null
      ? 'ratchet limit unreadable'
      : dead.length > limit
        ? `⚠️ **over the ${limit} ratchet by ${dead.length - limit}** — the guard is red`
        : `under the ${limit} ratchet — guard green`;

  push('# Orphan Report — Stable Lords', '');
  push(
    `**Generated:** ${new Date().toISOString().slice(0, 10)} · **Source:** \`scripts/orphan-scan.mjs\` + this generator (\`scripts/orphan-report.mjs\`)`,
    '**Scope:** all flagged `src/` exports + unreachable files + nav-hidden routes',
    '**Purpose:** product-owner triage — decide **integrate** (wire it in), **delete**, or **keep** per orphan.',
    ''
  );
  push(
    `> **Ratchet status:** ${dead.length} src-scoped dead exports — ${status}.`,
    ''
  );

  push('## Uniqueness tags', '');
  push(
    '- 🟣 **UNIQUE** — the only implementation of this behavior in the repo; deleting permanently removes capability (or a pinned spec of it).',
    '- 🔵 **DUPLICATE** — functionally equivalent logic ships elsewhere.',
    '- ⚪ **PASS-THROUGH** — pure re-export/config surface; contains no logic.',
    ''
  );

  if (untriaged.length) {
    push('## ⚠️ UNTRIAGED — new orphans since last annotation pass', '');
    push(
      'Flagged by the latest scan with no curated entry in `orphan-report.mjs` `ANNOTATIONS`. Triage these first, then record the verdict there.',
      ''
    );
    table(
      ['Symbol', 'File', 'Evidence'],
      untriaged.map((u) => [`\`${u.symbol}\``, u.file, u.triage?.evidence || 'unassessed'])
    );
  }

  // Alternate flows — same-named production decls elsewhere, with similarity.
  const flowRows = dead
    .filter((d) => d.triage?.duplication?.hasAlternateFlow)
    .map((d) => [
      `\`${d.symbol}\``,
      `\`${d.file}\``,
      d.triage.class,
      d.triage.duplication.alternateFlows
        .map((f) => `\`${f.file}\` @${f.similarity} **${f.verdict}**`)
        .join('<br>'),
    ]);
  if (flowRows.length) {
    push('## Duplication — alternate flows sharing an orphan\'s name', '');
    push(
      'The same symbol name is declared in other production files. `@score` is token-level body similarity: **identical** ≥0.9 (true duplicate — delete loses nothing), **divergent** 0.3–0.9 (alternate flow — the orphan carries its own semantics), **distinct** <0.3 (name collision only).',
      ''
    );
    table(['Symbol', 'Orphan file', 'Class', 'Alternate flow(s)'], flowRows);
  }

  push('## Section A — Genuine orphans: integrate or delete', '');
  if (!sectionA.length) push('*None flagged.*', '');
  for (const { d, ann } of sectionA) {
    push(`### \`${d.symbol}\` — ${ann.title} ${ann.uniq}`, '');
    push(`- **File:** \`${d.file}\``, `- ${ann.body}`, '');
  }

  if (keepHooks.length) {
    push('### Test-only lifecycle hooks 🟣 **UNIQUE** *(test infra — keep)*', '');
    push(
      'The only reset paths for module-level state between tests — product-dead but test-alive; deleting them breaks test isolation.',
      ''
    );
    table(
      ['Symbol', 'File', 'Verdict'],
      keepHooks.map(({ d, ann }) => [`\`${d.symbol}\``, `\`${d.file}\``, ann.body])
    );
  }

  push('## Section B — Over-exports: zero external references (unexport candidates)', '');
  push(
    'All 🟣 **unique code that is already live** — used inside its own module by live siblings — but no file outside references it, not even tests. The code stays; only the `export` keyword goes. (Typecheck after; TS4058 may force a keep on types in live signatures.)',
    ''
  );
  if (!sectionB.length) push('*None flagged.*', '');
  else
    table(
      ['Symbol(s)', 'File', 'Notes'],
      sectionB.map(({ d }) => [
        `\`${d.symbol}\``,
        `\`${d.file}\``,
        SECTION_B_NOTES[d.file] || 'internal-use over-export',
      ])
    );

  push('## Section C — Test-visible exports: live code, no action needed', '');
  push(
    'Every symbol below **runs in production** — called inside its own module by a live sibling. The `export` exists so unit/guard tests can pin internals directly (documented house pattern — see the ratchet comments in `orphanScan.guard.slow.test.ts`).',
    ''
  );
  for (const [domain, rows] of sectionC) {
    push(`### ${domain} (${rows.length})`, '');
    table(
      ['Symbol(s)', 'File', 'Live via (internal caller)', 'Alt-flow'],
      rows.map((r) => [`\`${r.symbol}\``, `\`${r.file}\``, r.via, r.dup || '—'])
    );
  }

  push('## Section D — Scanner blind spots: live, no action', '');
  if (lazyDead.length) {
    push('### D1. Lazy-loaded modules — false positives', '');
    push(
      'Consumed via `React.lazy(() => import(...))`; the scanner sees the file edge but cannot attribute a named consumer.',
      ''
    );
    table(
      ['Export', 'File'],
      lazyDead.map((d) => [`\`${d.symbol}\``, `\`${d.file}\``])
    );
  }
  push('### D2. Ambient declaration files', '');
  for (const f of report.unreachableFromProd.filter((f) => f.endsWith('.d.ts')))
    push(`- \`${f}\` — global/ambient types; never imported *by design* (allowlisted in the guard).`);
  push('');
  if (uiKit.length) {
    push('### D3. shadcn/ui component-library surface', '');
    push(
      'Generated-library exports — the components ship their full part API even when parts are unused. Not product features.',
      ''
    );
    table(
      ['Export', 'File'],
      uiKit.map((d) => [`\`${d.symbol}\``, `\`${d.file}\``])
    );
  }
  push('### D4. Nav-hidden routes — intentional deep links', '');
  for (const r of (report.routes || []).filter((x) => x.path && !x.navLinked))
    push(`- \`${r.path}\` (\`${r.file}\`) — detail page reached by in-game navigation, not static nav.`);
  push('');

  push('## Decision summary', '');
  table(
    ['Decision', 'Items', 'Unique code at stake'],
    [
      [
        '**Delete / integrate**',
        `${sectionA.length} curated item(s)` + (untriaged.length ? ` + **${untriaged.length} UNTRIAGED**` : ''),
        'see per-item tags above',
      ],
      ['**Unexport**', `${sectionB.length} export(s)`, '🟣 stays — code is live, only `export` goes'],
      [
        '**Keep**',
        `${keepHooks.length} test-reset hook(s); ${[...sectionC.values()].reduce((n, r) => n + r.length, 0)} test-visible export(s); ${lazyDead.length + uiKit.length} blind spots`,
        'all unique, all live-or-test-infra',
      ],
      ['**Guard hygiene**', `ratchet: ${dead.length}${limit ? ` / ${limit}` : ''}`, '—'],
      [
        '**Duplication**',
        `${flowRows.length} orphan(s) with same-name alternate flow(s)`,
        `${dead.filter((d) => d.triage?.duplication?.worstVerdict === 'identical').length} identical · ${dead.filter((d) => d.triage?.duplication?.worstVerdict === 'divergent').length} divergent · ${dead.filter((d) => d.triage?.duplication?.worstVerdict === 'distinct').length} distinct`,
      ],
    ]
  );
  push(
    '*Regenerate with `node scripts/orphan-scan.mjs` (or `node scripts/orphan-report.mjs` against the last JSON). Curated verdicts live in `ANNOTATIONS` at the top of `scripts/orphan-report.mjs`.*',
    ''
  );

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT_FILE, L.join('\n'));
  return OUT_FILE;
}

// Standalone: load the last scan JSON.
if (import.meta.url === `file://${process.argv[1]}`) {
  if (!fs.existsSync(SCAN_JSON)) {
    console.error('No scan output — run `node scripts/orphan-scan.mjs` first.');
    process.exit(1);
  }
  const report = JSON.parse(fs.readFileSync(SCAN_JSON, 'utf8'));
  const out = generateOrphanReport(report);
  console.log(`Orphan report: ${path.relative(ROOT, out)}`);
}
