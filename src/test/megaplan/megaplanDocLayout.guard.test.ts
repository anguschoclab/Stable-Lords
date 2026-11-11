import { describe, it, expect } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

/**
 * Megaplan doc-layout guard — lineage filing ratchet (V28 docs-home).
 *
 * Convention (AGENTS.md): the latest megaplan's {PLAN,FINDINGS,LEDGER,
 * DEFERRED} set lives at **docs/ root** alongside MEGAPLAN_BACKLOG.md; every
 * older version's docs archive under docs/archive/megaplans/; stale session
 * plans sweep to .devin/plans/archive/. This spec pins the layout so a stray
 * MEGAPLAN_V<N>_* landing at docs/ root — or an archived doc escaping the
 * archive — fails the suite instead of silently re-fragmenting the register.
 */

const REPO = path.resolve(__dirname, '../../..');
const DOCS = path.join(REPO, 'docs');
const ARCHIVE_DIR = path.join(DOCS, 'archive/megaplans');
const BACKLOG = path.join(DOCS, 'MEGAPLAN_BACKLOG.md');
const SESSION_PLANS = path.join(REPO, '.devin/plans');

const VERSIONED_RE = /^MEGAPLAN_V(\d+)_(PLAN|FINDINGS|LEDGER|DEFERRED)\.md$/;
const RETIRED_ROOT_RE =
  /^(MEGAPLAN_(FINDINGS|LEDGER)\.md|CONSOLIDATION_|TEST_SUITE_AUDIT_|TEST_AUDIT_FINDINGS\.md)/;

/** Every doc retired from root in the 2026-11 archive pass. */
const ARCHIVED_DOCS = [
  'MEGAPLAN_FINDINGS.md',
  'MEGAPLAN_LEDGER.md',
  ...[9, 10, 11, 12].flatMap((n) => [
    `MEGAPLAN_V${n}_FINDINGS.md`,
    `MEGAPLAN_V${n}_LEDGER.md`,
  ]),
  'MEGAPLAN_V14_LEDGER.md',
  ...[15, 16].flatMap((n) => [
    `MEGAPLAN_V${n}_FINDINGS.md`,
    `MEGAPLAN_V${n}_LEDGER.md`,
    `MEGAPLAN_V${n}_PLAN.md`,
  ]),
  'MEGAPLAN_V17_FINDINGS.md',
  'MEGAPLAN_V17_LEDGER.md',
  ...[18, 19, 20, 21].flatMap((n) => [
    `MEGAPLAN_V${n}_FINDINGS.md`,
    `MEGAPLAN_V${n}_LEDGER.md`,
    `MEGAPLAN_V${n}_PLAN.md`,
  ]),
  ...[22].flatMap((n) => [
    `MEGAPLAN_V${n}_DEFERRED.md`,
    `MEGAPLAN_V${n}_FINDINGS.md`,
    `MEGAPLAN_V${n}_LEDGER.md`,
    `MEGAPLAN_V${n}_PLAN.md`,
  ]),
  // V23 never shipped a DEFERRED register — its deferrals live in V22_DEFERRED.
  ...[23].flatMap((n) => [
    `MEGAPLAN_V${n}_FINDINGS.md`,
    `MEGAPLAN_V${n}_LEDGER.md`,
    `MEGAPLAN_V${n}_PLAN.md`,
  ]),
  ...[24, 25, 26, 27].flatMap((n) => [
    `MEGAPLAN_V${n}_DEFERRED.md`,
    `MEGAPLAN_V${n}_FINDINGS.md`,
    `MEGAPLAN_V${n}_LEDGER.md`,
    `MEGAPLAN_V${n}_PLAN.md`,
  ]),
  'CONSOLIDATION_FINDINGS_V5.md',
  'CONSOLIDATION_FINDINGS_V6.md',
  'CONSOLIDATION_FINDINGS_V7.md',
  'CONSOLIDATION_V5_LEDGER.md',
  'CONSOLIDATION_V7_LEDGER.md',
  'TEST_SUITE_AUDIT_PLAN.md',
  'TEST_SUITE_AUDIT_LEDGER.md',
  'TEST_AUDIT_FINDINGS.md',
];

/** Versions whose docs must be indexed in MEGAPLAN_BACKLOG.md. */
const ARCHIVED_VERSIONS = [
  9, 10, 11, 12, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27,
];

const docsRootFiles = (): string[] => readdirSync(DOCS);

describe('megaplan doc layout', () => {
  it('docs/ root carries exactly one MEGAPLAN_V<N>_ lineage + MEGAPLAN_BACKLOG.md', () => {
    const files = docsRootFiles();
    const versions = new Set(
      files.map((f) => VERSIONED_RE.exec(f)?.[1]).filter(Boolean)
    );
    expect(
      versions.size,
      `multiple megaplan lineages at docs/ root: ${[...versions].join(', ')} — archive the older set`
    ).toBe(1);
    expect(existsSync(BACKLOG), 'MEGAPLAN_BACKLOG.md missing at docs/ root').toBe(true);
  });

  it('retired doc families never reappear at docs/ root or repo root', () => {
    const violations = [...docsRootFiles(), ...readdirSync(REPO)].filter((f) =>
      RETIRED_ROOT_RE.test(f)
    );
    expect(
      violations,
      `retired docs outside docs/archive/megaplans/: ${violations.join(', ')}`
    ).toEqual([]);
  });

  it('every archived doc lives in docs/archive/megaplans/', () => {
    const present = existsSync(ARCHIVE_DIR) ? readdirSync(ARCHIVE_DIR) : [];
    const missing = ARCHIVED_DOCS.filter((f) => !present.includes(f));
    expect(
      missing,
      `expected archived docs missing from docs/archive/megaplans/: ${missing.join(', ')}`
    ).toEqual([]);
    // Ratchet: unknown lineage files in the archive are as suspicious as
    // missing ones — add deliberately, not by accident.
    const stray = present.filter(
      (f) =>
        /^(MEGAPLAN_|CONSOLIDATION_|TEST_SUITE_AUDIT_|TEST_AUDIT_)/.test(f) &&
        !ARCHIVED_DOCS.includes(f)
    );
    expect(
      stray,
      `unregistered lineage files in archive — extend ARCHIVED_DOCS if intentional: ${stray.join(', ')}`
    ).toEqual([]);
  });

  it('MEGAPLAN_BACKLOG.md indexes every archived version', () => {
    const backlog = existsSync(BACKLOG) ? readFileSync(BACKLOG, 'utf8') : '';
    const missing = ARCHIVED_VERSIONS.filter(
      (n) => !backlog.includes(`MEGAPLAN_V${n}`) && !backlog.includes(`MEGAPLAN V${n}`)
    );
    expect(
      missing,
      `archived versions missing from backlog index: ${missing.join(', ')}`
    ).toEqual([]);
  });

  it('.devin/plans top level holds no megaplan-* drafts (normalize to MEGAPLAN_V<N>_PLAN.md)', () => {
    const topLevel = existsSync(SESSION_PLANS)
      ? readdirSync(SESSION_PLANS, { withFileTypes: true })
          .filter((d) => d.isFile())
          .map((d) => d.name)
      : [];
    const violations = topLevel.filter((f) => /^megaplan-/.test(f));
    expect(
      violations,
      `megaplan drafts in .devin/plans — landed plans are MEGAPLAN_V<N>_PLAN.md at root: ${violations.join(', ')}`
    ).toEqual([]);
  });
});
