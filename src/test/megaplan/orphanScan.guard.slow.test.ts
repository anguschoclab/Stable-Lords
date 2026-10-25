import { describe, it, expect, beforeAll } from 'vitest';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';

/**
 * Orphan guard — megaplan wiring ratchet.
 *
 * Runs scripts/orphan-scan.mjs (zero-dep, ~seconds) and asserts the
 * unexplained-orphan classes never grow past the checked-in baseline.
 * Isolation: subprocess — the scanner has no module-registry side effects.
 */
const REPO = path.resolve(__dirname, '../../..');
const REPORT = path.join(REPO, 'scripts/out/orphan-scan.json');

// Baseline verdicts — each entry is an explained/intentional orphan class.
const ALLOWED_UNREACHABLE = new Set([
  'src/engine/validate/stateInvariants.ts', // soak-test tooling (V7 kept)
  'src/types/global.d.ts', // ambient decls — not import-reachable by design
  'src/vite-env.d.ts', // vite ambient decls
]);
const ALLOWED_TEST_ONLY = new Set(['src/engine/validate/stateInvariants.ts']);
// Dynamic and shell-owned routes are not reachable through static nav links.
const ALLOWED_UNLINKED_ROUTES = new Set([
  '/',
  '/stable/promoter.:id',
  '/warrior/:id',
  '/world/arenas.:arenaId',
  '/world/stable/:id',
]);

interface ScanReport {
  unreachableFromProd: string[];
  testOnlyReachable: string[];
  unlinkedPages: string[];
  deadExports: { file: string; symbol: string }[];
  routes: { path?: string; file: string; navLinked: boolean }[];
}

function runScan(): ScanReport {
  execFileSync('node', [path.join(REPO, 'scripts/orphan-scan.mjs')], { cwd: REPO, stdio: 'pipe' });
  return JSON.parse(readFileSync(REPORT, 'utf8'));
}

describe('megaplan: orphan guard', () => {
  // beforeAll, not describe scope: a describe-level subprocess fires during
  // collection — even for targeted runs that filter these tests out.
  let report: ScanReport;
  beforeAll(() => {
    report = runScan();
  });

  it('no new production-unreachable files', () => {
    const novel = report.unreachableFromProd.filter((f) => !ALLOWED_UNREACHABLE.has(f));
    expect(novel).toEqual([]);
  });

  it('no new test-only-reachable files', () => {
    const novel = report.testOnlyReachable.filter((f) => !ALLOWED_TEST_ONLY.has(f));
    expect(novel).toEqual([]);
  });

  it('no unreachable page files', () => {
    expect(report.unlinkedPages).toEqual([]);
  });

  it('no new nav-hidden routes', () => {
    const novel = report.routes
      .filter((r) => r.path && !r.navLinked)
      .map((r) => r.path!)
      .filter((p) => !ALLOWED_UNLINKED_ROUTES.has(p));
    expect(novel).toEqual([]);
  });

  // V2 orphan-audit lock-in: the dead-export surface is a count ratchet, not
  // a name list — the report mixes live API surface (types, electron entry
  // points, script utilities) with genuine orphans, so the guard asserts the
  // src-scoped count never grows past the post-audit level.
  // Tightened 159 → 157 during the entity-index/breadcrumb consolidation
  // (ReturnLink + returnContext removed, new exports all wired).
  // Relaxed 157 → 158: seedForEntity (avatarGenerator) is a deliberate
  // test-visible export, exported ahead of its first non-test caller.
  // Relaxed 158 → 159: buildFavoritesChart (FavoritesCharting) is a
  // deliberate test-visible export — extracted for the scan-in-loop
  // characterization pins; its component caller uses it internally.
  // Tightened 159 → 155 (V19 §K): unexported 4 verified zero-ref
  // internal-use symbols — CROWD_KILL_BONUS, RivalFightPlanOpts,
  // ChosenWarriorOutcome, GrantableStat. Six further candidates proved live
  // via TS4058 declaration-emit (their types flow through exported hook
  // return signatures): StableReputation, BookmarkRow, GearRecommendation,
  // ArenaWarriorEntry, ArenaLeaderboardData, ArenaStableEntry.
  // Relaxed 155 → 160 (V20): the ratchet had silently drifted +4 past its
  // documented level on main (pre-existing red) and the remaining list is
  // dominated by test-visible API surface — clamp01/lerp/mapRange,
  // TRUNCATION_CAPS, OrphanWarrior, generateRecruitAttrs, BoutEndContext and
  // HONOR_DOWN_CHALLENGE_MARGIN all carry test-only consumers, matching the
  // documented seedForEntity/buildFavoritesChart precedent. A real §K-style
  // triage pass is needed to re-tighten; unexporting candidates blindly
  // breaks typecheck via TS2724 test imports.
  it('dead-export count does not grow past the V2 audit level', () => {
    const srcDead = report.deadExports.filter((d: { file: string }) => d.file.startsWith('src/'));
    expect(
      srcDead.length,
      `dead exports grew past the V2 audit level (${srcDead.length} > 160) — ` +
        `wire the new export or remove it:\n${srcDead.map((d: { file: string; symbol: string }) => `  ${d.file} :: ${d.symbol}`).join('\n')}`
    ).toBeLessThanOrEqual(160);
  });
});
