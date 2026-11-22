#!/usr/bin/env node
/**
 * canon-claims-scan.mjs — V31 canon-claims register coverage scanner.
 *
 * Parses docs/engineering/terrablood-canon-claims.md and asserts every claim
 * row is fully resolved: a legal verdict plus a non-pending status. A row
 * still marked DECISION-NEEDED / _pending_ / placeholder means an
 * adjudicated claim was added to the register without a ruling — exactly
 * the drift this ratchet exists to catch.
 *
 * Output: scripts/out/canon-claims-scan.json + stdout summary.
 * Zero dependencies. Run: `node scripts/canon-claims-scan.mjs` (or `bun`).
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const REGISTER = path.join(ROOT, 'docs', 'engineering', 'terrablood-canon-claims.md');
const OUT_DIR = path.join(ROOT, 'scripts', 'out');
const OUT_FILE = path.join(OUT_DIR, 'canon-claims-scan.json');

const VERDICTS = new Set(['implemented', 'missing', 'diverged', 'disputed']);
const PENDING_RE = /DECISION-NEEDED|_pending_|_rows filled|TBD/i;
const RESOLVED_RE = /^(resolved|ADJUDICATED:|evidence fold)/i;

function parseRows(md) {
  const rows = [];
  for (const [i, line] of md.split('\n').entries()) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('|')) continue;
    const cells = trimmed
      .split('|')
      .slice(1, -1)
      .map((c) => c.trim());
    if (cells.length < 5) continue;
    const [id, claim, verdict, evidence, status] = cells;
    if (id === 'ID' || /^-+$/.test(id)) continue; // header + separator
    rows.push({ line: i + 1, id, claim, verdict, evidence, status });
  }
  return rows;
}

const md = fs.existsSync(REGISTER) ? fs.readFileSync(REGISTER, 'utf8') : '';
const rows = parseRows(md);
const violations = [];
const warnings = [];

if (!fs.existsSync(REGISTER)) {
  violations.push('register missing: docs/engineering/terrablood-canon-claims.md');
}

for (const r of rows) {
  if (!r.id || r.id === '—') {
    if (PENDING_RE.test(r.claim)) continue; // schema placeholder row
    violations.push(`line ${r.line}: row with no claim id (${r.claim.slice(0, 60)}…)`);
    continue;
  }
  if (!VERDICTS.has(r.verdict)) {
    violations.push(
      `${r.id} (line ${r.line}): illegal verdict '${r.verdict}' — expected implemented|missing|diverged|disputed`
    );
  }
  if (PENDING_RE.test(r.status) || !RESOLVED_RE.test(r.status)) {
    violations.push(
      `${r.id} (line ${r.line}): unresolved status '${r.status}' — every claim needs resolved/ADJUDICATED/evidence-fold`
    );
  }
  if (!r.evidence || r.evidence === '—') {
    warnings.push(`${r.id} (line ${r.line}): no file:line evidence`);
  }
}

const report = {
  register: path.relative(ROOT, REGISTER),
  totalClaims: rows.length,
  violations,
  warnings,
  scannedAt: new Date().toISOString(),
};
fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(OUT_FILE, JSON.stringify(report, null, 2));

console.log(
  `canon-claims-scan: ${rows.length} claims · ${violations.length} violations · ${warnings.length} warnings`
);
for (const v of violations) console.log(`  VIOLATION ${v}`);
for (const w of warnings) console.log(`  warn      ${w}`);
process.exit(violations.length ? 1 : 0);
