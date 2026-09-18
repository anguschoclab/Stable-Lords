# V5 Consolidation Ledger (working file — folded into CONSOLIDATION_FINDINGS_V5.md at end)

## Baseline metrics (Phase 0)

| Metric | Value | Notes |
|--------|-------|-------|
| type-check (tracked files) | 0 errors | after fixing glob import in accessibilityMotionReduce.test.ts (bug B1). Untracked scratch scripts (scripts/build-fight.ts, run-fight.ts) error — user WIP, not repo state |
| lint | TBD | |
| vitest fast suite | TBD | |
| vitest all (incl. slow) | TBD | |
| build | TBD | |
| electron:compile | TBD | |
| narrative-validate | PASS | |
| git fsck | CLEAN | after pack repair |

## Environment repairs (Phase 0)

| Issue | Root cause | Fix |
|-------|-----------|-----|
| All 4 git packs truncated ("early EOF") | Interrupted repack (mtimes predate session) | Quarantined packs to `.git/corrupt-packs-quarantine/`, `git fetch origin --refetch`, rebuilt commit-graph. fsck clean, all 11 branches resolve |
| TS7 tsc ENOEXEC crash | `@typescript/typescript-darwin-arm64/lib/tsc` was 0-byte (disk corruption) | Replaced from npm tarball — Mach-O arm64 binary restored |
| ~500 TS7016 lucide-react errors | node_modules had hand-patched lucide-react@1.44.0 with added `exports` field (no types condition); both lockfiles stale vs package.json (dependabot bumped manifest only) | `npm install` resynced node_modules to package.json (bun install stalled on registry — see finding) |
| bun.lock stale | package.json requires lucide 1.44.0/react 19.3.0 etc; bun.lock pins 1.34.0/19.2.8 | FINDING F-lock — regenerate bun.lock (bun install currently stalls on artifactory) or document |
| package-lock.json untracked+gitignored | "# npm lockfile (project uses bun)" | npm ci artifact only — no commit needed |
| Untracked scratch files | scripts/{build-fight,run-fight}.ts, stubs/, .build/ | USER WIP (appeared mid-session) — excluded from commits; tsc errors therein are not repo state |

## Findings log

| id | file:line | category | severity | evidence | verdict | commit |
|----|-----------|----------|----------|----------|---------|--------|
| B1 | src/test/ui/accessibilityMotionReduce.test.ts:8 | bug | medium | imports transitive `glob` w/o types → tsc red on main | FIXED (fs.readdirSync walk; removes @types/glob temptation) | pending |
| F-lock | bun.lock vs package.json | repo hygiene | high | bun.lock pins lucide@1.34.0, package.json wants 1.44.0 | regenerate bun.lock or document | pending |
| F-scratch | scripts/*.ts untracked | env | low | concurrent WIP session | leave untracked, exclude from commits | — |

## Read checklist (Phase 1 sweeps)

| Sweep | Scope | Files | Read | Findings |
|-------|-------|-------|------|----------|
| 1 | types+schemas+constants+data | 85 | 0 | |
| 2 | engine: combat/pipeline/bout/core/simulate | 118 | 0 | |
| 3 | engine remainder | 189 | 0 | |
| 4 | state+hooks+lib+utils | 67 | 0 | |
| 5 | components | 366 | 0 | |
| 6 | pages+routes+App+main | ~94 | 0 | |
| 7 | lore+scripts+electron+configs | ~25 | 0 | |
| 8 | test | 579 | 0 | |

## Test-first tracker

| Change item | Required tests | Test file | Test commit | Impl commit |
|-------------|----------------|-----------|-------------|-------------|
| #959 deadWarriors | populated-graveyard resolution | src/test/components/ResolutionReveal.test.tsx | | |
| #965 mentors | ranking characterization | src/test/components/stable/LegacyMentorsTab.test.tsx | | |
| #960 stances | pure-function classes | src/test/components/arena/useFighterStyles.test.ts | | |
| #962 tooltip | tooltip content | src/test/components/boutViewer/BoutControls.test.tsx | | |
| #967 boundary | crash UI + message hidden | src/test/components/ErrorBoundary.test.tsx | | |
| #963 traits | count bump + trait resolution | src/test/engine/traits/traitDedup.test.ts | | |
| narrative curation | suite + validate | existing narrativeContent* | | |
