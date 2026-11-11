import { describe, it, expect } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

/**
 * Docs-layout guard — docs/ taxonomy ratchet (V28).
 *
 * Convention (AGENTS.md): docs/ is organized into fixed families —
 *   docs/design/       canon specs + UI-design docs (the in-game bible corpus)
 *   docs/engineering/  testing/RNG/pipeline/setup references + live audits
 *   docs/reports/      generated committed reports (daily sim, bard, orphan)
 *   docs/manual/       player-facing manual + images
 *   docs/archive/      frozen history: megaplans|audits|summaries|superpowers
 * docs/ root itself carries only INDEX.md + the megaplan protocol files
 * (MEGAPLAN_BACKLOG.md + the latest MEGAPLAN_V<N>_* set — megaplanDocLayout
 * owns the lineage-count invariant). Non-archive docs use kebab-case; protocol
 * names (README/AGENTS/INDEX/MEGAPLAN_*) are exempt. Repo root carries only
 * README.md + AGENTS.md — doc drift back to root fails here.
 *
 * Authored test-first in V28 Phase 1: RED on the pre-taxonomy layout, GREEN
 * after the Phase-3 moves + Phase-4 INDEX.md.
 */

const REPO = path.resolve(__dirname, '../../..');
const DOCS = path.join(REPO, 'docs');

const MEGAPLAN_RE = /^MEGAPLAN_V\d+_(PLAN|FINDINGS|LEDGER|DEFERRED)\.md$/;
const DOCS_ROOT_ALLOWLIST = new Set(['INDEX.md', 'MEGAPLAN_BACKLOG.md']);
const ROOT_MD_ALLOWLIST = new Set(['README.md', 'AGENTS.md']);
const DOCS_DIRS = new Set(['design', 'engineering', 'reports', 'manual', 'archive']);
const ARCHIVE_DIRS = new Set(['megaplans', 'audits', 'summaries', 'superpowers']);
const KEBAB_RE = /^[a-z0-9]+([-.][a-z0-9]+)*\.md$/;
const LINK_RE = /\]\(([^)\s]+)\)|\bsrc="([^"]+)"/g;
const SKIP_LINK_RE = /^(https?:|mailto:|#|~)/;
/** Only doc-to-doc/image/dir links are in scope — code-path pointers inside
 * docs (e.g. the master bible's lineage `](app.jsx)` references) can't always
 * resolve and aren't what this ratchet guards. */
const DOC_TARGET_RE = /\.(md|png|jpe?g|svg|gif|webp)$|\/$/;

/** All .md files under docs/, repo-relative posix paths. */
function docsMarkdown(dir = DOCS, rel = 'docs'): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    const r = `${rel}/${entry.name}`;
    if (entry.isDirectory()) out.push(...docsMarkdown(abs, r));
    else if (entry.name.endsWith('.md')) out.push(r);
  }
  return out;
}

const allDocs = docsMarkdown();
const nonArchiveDocs = allDocs.filter((f) => !f.startsWith('docs/archive/'));
/** docs/ files inside a subdirectory (excludes docs/ root .md). */
const nestedDocs = allDocs.filter((f) => f.split('/').length > 2);

describe('docs layout', () => {
  it('docs/ root .md ⊆ {INDEX.md, MEGAPLAN_BACKLOG.md, MEGAPLAN_V<N>_*}', () => {
    const violations = readdirSync(DOCS)
      .filter((f) => f.endsWith('.md'))
      .filter((f) => !DOCS_ROOT_ALLOWLIST.has(f) && !MEGAPLAN_RE.test(f));
    expect(
      violations,
      `stray .md at docs/ root — file under an approved dir: ${violations.join(', ')}`
    ).toEqual([]);
  });

  it('repo root carries only README.md + AGENTS.md — no doc drift back to root', () => {
    const violations = readdirSync(REPO)
      .filter((f) => f.endsWith('.md'))
      .filter((f) => !ROOT_MD_ALLOWLIST.has(f));
    expect(
      violations,
      `.md files at repo root — file under docs/: ${violations.join(', ')}`
    ).toEqual([]);
  });

  it('every docs/ .md lives in an approved dir family', () => {
    const violations = nestedDocs.filter((f) => !DOCS_DIRS.has(f.split('/')[1]!));
    expect(
      violations,
      `docs filed outside design|engineering|reports|manual|archive: ${violations.join(', ')}`
    ).toEqual([]);
  });

  it('docs/archive/ uses only registered archive families', () => {
    const violations = allDocs
      .filter((f) => f.startsWith('docs/archive/'))
      .filter((f) => !ARCHIVE_DIRS.has(f.split('/')[2]!));
    expect(
      violations,
      `archived docs outside megaplans|audits|summaries|superpowers: ${violations.join(', ')}`
    ).toEqual([]);
  });

  it('non-archive docs are kebab-case (protocol names exempt)', () => {
    const violations = nonArchiveDocs
      .filter((f) => f.split('/').length > 2)
      .filter((f) => !KEBAB_RE.test(path.basename(f)));
    expect(
      violations,
      `non-kebab filenames — rename per AGENTS.md convention: ${violations.join(', ')}`
    ).toEqual([]);
  });

  it('relative doc/image links in non-archive docs + root meta files resolve', () => {
    const violations: string[] = [];
    const sources = [...nonArchiveDocs.map((f) => f), 'README.md', 'AGENTS.md'];
    for (const rel of sources) {
      const abs = path.join(REPO, rel);
      if (!existsSync(abs)) continue;
      const content = readFileSync(abs, 'utf8');
      for (const m of content.matchAll(LINK_RE)) {
        const target = (m[1] ?? m[2] ?? '').split('#')[0]!.split('?')[0]!;
        if (!target || SKIP_LINK_RE.test(target) || !DOC_TARGET_RE.test(target)) continue;
        const resolved = path.resolve(path.dirname(abs), decodeURIComponent(target));
        if (!existsSync(resolved)) violations.push(`${rel} -> ${target}`);
      }
    }
    expect(
      violations,
      `broken relative links — repoint or restore the target: ${violations.join(', ')}`
    ).toEqual([]);
  });

  it('INDEX.md links every non-archive doc (freshness ratchet)', () => {
    const indexPath = path.join(DOCS, 'INDEX.md');
    expect(existsSync(indexPath), 'docs/INDEX.md missing — catalogue the taxonomy').toBe(true);
    const index = readFileSync(indexPath, 'utf8');
    const linked = new Set(
      [...index.matchAll(/\]\(([^)\s]+)\)/g)]
        .map((m) => m[1]!.split('#')[0]!.split('?')[0]!)
        .filter((t) => t && !SKIP_LINK_RE.test(t))
        .map((t) => path.resolve(DOCS, decodeURIComponent(t)))
    );
    const missing = nonArchiveDocs.filter(
      (f) => !linked.has(path.join(REPO, f)) && f !== 'docs/INDEX.md'
    );
    expect(
      missing,
      `docs not catalogued in INDEX.md — add a row: ${missing.join(', ')}`
    ).toEqual([]);
  });
});
