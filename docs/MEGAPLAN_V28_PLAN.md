# MEGAPLAN V28 — Docs Taxonomy, Bible-Corpus Boundary & Convention Ratchet

One-sentence summary: Reorganize `docs/` into a ratcheted subdirectory taxonomy (design corpus / engineering / reports / archive families), restore `README.md` + `AGENTS.md` to repo root, narrow the in-game bible glob to `docs/design/`, repoint every emitter/guard/skill/CI path at the new layout, harmonize filenames to kebab-case (protocol names exempt), and land the convention as a new `docsLayout` LIVE_RATCHET guard — closing the currently-red `megaplanDocLayout` suite and archiving the V27 lineage at close-out.

> **Validation status:** every claim below was audited against the code on the review pass (2026-11-11), including a live run of the failing guard. Phase 1 enforces strict test-first: the new layout spec lands and is observed RED before any file moves.

## Scope Decision (user-confirmed)

- **Framing — MEGAPLAN V28**: full ritual — `MEGAPLAN_V28_{PLAN,FINDINGS,LEDGER,DEFERRED}.md` at docs root, strict test-first for the new guard, close-out folds leftovers into `MEGAPLAN_BACKLOG.md`, and the V27 set archives to `docs/archive/megaplans/` per lineage rule.
- **Layout — subdirectory taxonomy**: `docs/{design,engineering,reports,manual,archive}/`; `docs/` root carries only `INDEX.md` + `MEGAPLAN_*` protocol files.
- **Meta files — restore to repo root**: `README.md` + `AGENTS.md` back to `/` (GitHub landing + agent auto-discovery); the agent-conventions content is rewritten for the new layout.
- **Megaplan home — `docs/` root**: honor the `54d856dd9` move; update `megaplanDocLayout.guard.test.ts` + `AGENTS.md` + backlog wording to match.
- **Bible corpus — `docs/design/` only**: narrows `bibleIndex.ts`'s eager glob from `docs/*.md` — engineering docs, reports, megaplans, and audits drop out of the in-game Help search and the app bundle.
- **Stale docs — archive, never delete**: `docs/archive/{audits,summaries,superpowers}/` mirroring the `archive/megaplans/` precedent.
- **Naming — full kebab-case** with protocol carve-outs: `MEGAPLAN_*`, `MEGAPLAN_BACKLOG.md`, `README.md`, `AGENTS.md`, `INDEX.md` keep their special names; archived lineage files stay verbatim (frozen history).

## Validated Findings (claim → verified state → treatment)

See `MEGAPLAN_V28_FINDINGS.md` for the full evidence table. Headline items:

1. `megaplanDocLayout.guard.test.ts` is RED since `54d856dd9` — it reads `readdirSync(REPO)` for `MEGAPLAN_V(\d+)_*` + `REPO/MEGAPLAN_BACKLOG.md`; both moved to `docs/`. `ci.yml` runs `bunx vitest run`, so CI is red on every push.
2. `bibleIndex.ts:31` `import.meta.glob('../../docs/*.md', {eager:true})` bundles every docs-root `.md` into the app for `Help.tsx` — the move added ~10 admin docs to the player-facing corpus and the bundle.
3. `daily_oracle.ts`/`daily_bard.ts` write reports to `process.cwd()` and the nightly workflows `git add` them at root — CI resurrects the moved files on the next scheduled run.
4. `docs/README.md:47` → `docs/USER_MANUAL.md` is broken (actual: `docs/manual/USER_MANUAL.md`).
5. Stale/superseded docs at root: `PIPELINE_TICK_IMPLEMENTATION_SUMMARY.md` (self-marked Superseded), `ai-behavior-audit{,-v2}.md` (v3 live), `ORPHAN_FEATURE_AUDIT{,_V2}.md` (superseded by generated `ORPHAN_REPORT.md`), `REFACTORING_SUMMARY.md`, `2026-04-15-combat-spatial-system.md` (landed superpowers impl plan), `docs/superpowers/` (35 files, June 2026).
6. Guard-pinned doc paths to repoint: `v14PipelineDocs` (2), `documentationParity` (2), `skillPathScan` refs in 2 SKILL.md files, `dailyBard.test.ts`/`workflow-config.test.ts` filename literals, `bibleIndex.ts` glob, plus ~10 comment refs.
7. Convention docs now lie: `AGENTS.md` + `MEGAPLAN_BACKLOG.md` still say the megaplan set lives "at repo root".

## Kebab-case transform rule

`_`→`-`, lowercase, split internal CamelCase (`NONLOSSY`→`nonlossy`, `StableLordsNaming`→`stable-lords-naming`), preserve dots (`v1.0`→`v1.0`), drop `YYYY-MM-DD-` prefixes on *specs* (keep on superpowers plans — their convention), unversioned audits get explicit `-v1` for lineage clarity. Exempt: `MEGAPLAN_*`, `MEGAPLAN_BACKLOG.md`, `README.md`, `AGENTS.md`, `INDEX.md`, everything under `docs/archive/` (verbatim history).

## File move map (all `git mv`, history preserved)

**Repo root restore:** `docs/README.md`→`README.md` (+link fix), `docs/AGENTS.md`→`AGENTS.md` (+convention rewrite).

**`docs/design/` — 20 files (bible corpus):** all 16 `Stable_Lords_*` specs + `DESIGN_{BIBLE_UI,CONTROL_CENTER,PAGE_SYSTEM}_v1.0.md` + `2026-04-15-combat-spatial-system-design.md` — kebab-renamed per the transform rule (e.g. `Stable_Lords_Warrior_Potential_Spec_v1.0.md` → `design/stable-lords-warrior-potential-spec-v1.0.md`).

**`docs/engineering/` — 11 files:** `TESTING.md`→`testing.md`, `RNG_POLICY.md`→`rng-policy.md`, `MAC_SETUP.md`→`mac-setup.md`, `PIPELINE_{AUDIT,BASELINE,DEPENDENCY_MAP,PARALLELISM}.md`→`pipeline-*.md`, `BATCH_ADVANCE_PRODUCTION.md`→`batch-advance-production.md`, `combat-subsystems-2026-06.md`, `bard_engine_context.md`→`bard-engine-context.md`, `ai-behavior-audit-v3.md` (live audit).

**`docs/reports/` — 3 files:** `Daily_{Balance,Bard}_Report.md`→`daily-*-report.md`, `ORPHAN_REPORT.md`→`orphan-report.md`.

**`docs/manual/`:** `USER_MANUAL.md`→`user-manual.md` (+ optional `images/manual/`→`images/` flatten with ~32 ref updates).

**`docs/archive/`:** `ai-behavior-audit{,-v2}.md`→`archive/audits/ai-behavior-audit-v{1,2}.md`; `ORPHAN_FEATURE_AUDIT{,_V2}.md`→`archive/audits/orphan-feature-audit-v{1,2}.md`; `REFACTORING_SUMMARY.md` + `PIPELINE_TICK_IMPLEMENTATION_SUMMARY.md`→`archive/summaries/`; `2026-04-15-combat-spatial-system.md`→`archive/superpowers/plans/`; `docs/superpowers/`→`docs/archive/superpowers/` (35 files verbatim); `MEGAPLAN_V27_*`→`archive/megaplans/` (Phase 0).

## Implementation steps (strict test-first for the new guard)

### Phase 0 — V28 scaffold + V27 archive (un-reds the suite)
- Land `docs/MEGAPLAN_V28_{PLAN,FINDINGS,LEDGER}.md`.
- `git mv docs/MEGAPLAN_V27_*.md docs/archive/megaplans/` — atomic with the guard update so the exactly-one-lineage invariant never breaks.
- `megaplanDocLayout.guard.test.ts`: `REPO`→`DOCS` for lineage + `BACKLOG` reads; `ARCHIVED_DOCS` += 4 V27 files; `ARCHIVED_VERSIONS` += 27; docstring rewrite ("latest set lives at **docs/ root**").
- `MEGAPLAN_BACKLOG.md`: "Current latest" → V28; §6 V27 row → archived; "repo root" → "docs/ root" wording.

### Phase 1 — `docsLayout.guard.test.ts` authored RED
- New spec: docs-root allowlist; repo-root `.md` ⊆ `{README.md, AGENTS.md}`; approved docs dirs; kebab ratchet on `design|engineering|reports|manual`; relative-link integrity for non-archive docs + root README/AGENTS; INDEX freshness coverage.
- Register `'docsLayout.guard.test.ts': 'LIVE_RATCHET'` in `GUARD_REGISTRY` (`testQualityAudit.test.ts`); regen `runnerGroups.json` via `bun scripts/test-audit-scan.mjs`.
- Observe RED → commit spec alone.

### Phase 2 — Root restore
- `git mv` README + AGENTS to root; fix manual link; rewrite `AGENTS.md` conventions (megaplan home = docs/ root, kebab rule + exemptions, INDEX rule, archive families, `archives/`≠`docs/archive/`).
- `.claude/CLAUDE.md`: `docs/TESTING.md` → `docs/engineering/testing.md`.

### Phase 3 — Taxonomy moves
- All `git mv` per the move map; optional `images/manual/`→`images/` flatten; `git rm src/test/.!39109!.DS_Store`.

### Phase 4 — Pointer pass
- `bibleIndex.ts` glob → `docs/design/*.md`; `bibleIndex.test.ts` corpus-purity assertion.
- Guards: `v14PipelineDocs` + `documentationParity` paths.
- Emitters: `daily_bard.ts`/`daily_oracle.ts` `REPORT_FILE`; `orphan-report.mjs` `OUT_FILE` + header.
- Workflows: `daily_sim.yml` + `daily_bard.yml` `git add` lines.
- Skills: `guard-ratchet` + `ui-honesty-audit` doc refs.
- Test literals: `dailyBard.test.ts`, `workflow-config.test.ts`.
- Comments: `nameGenerator.ts`, `potential.ts`, `stylePresets.ts`, `pipeline.perf.slow.test.ts`, `rivalStrategyPass.perf.slow.test.ts`, `testQualityAudit.test.ts`, `ui-audit-scan.mjs`, `orphan-scan.mjs`, `test-audit-scan.mjs`.
- Doc cross-links: DESIGN_* internals, `mac-setup.md`, `testing.md`; write `docs/INDEX.md`.

### Phase 5 — Close-out
- `bun run test` + `type-check` + `lint` green; `node scripts/skill-path-scan.mjs` clean; `test:slow` for docs-path-sensitive specs (skillPathScan, orphanScan).
- `bun run dev` → Help bible search spot-check (design docs only).
- `MEGAPLAN_V28_DEFERRED.md` + ledger completion; fold leftovers into `MEGAPLAN_BACKLOG.md`.

## Verification

- [ ] `bun run test` green — incl. `megaplanDocLayout` (docs-home) + `docsLayout` LIVE_RATCHET
- [ ] `bun run type-check` + `bun run lint` clean
- [ ] `bun scripts/test-audit-scan.mjs` → `runnerGroups.json` regenerated and committed
- [ ] `node scripts/skill-path-scan.mjs` — all skill refs resolve
- [ ] `bun run test:slow` — `skillPathScan` + `orphanScan`
- [ ] `bun run dev` → Help "Search the design bible" returns design docs only
- [ ] `git log --follow` spot-check on renamed files — history preserved
- [ ] First post-merge daily CI run lands reports at `docs/reports/`

## Risks / considerations

- **V27-archive atomicity**: the guard asserts exactly one megaplan lineage — V27 must archive in the same commit the V28 set lands.
- **CI emitter re-pathing**: `daily_*.yml` `git add` changes can't be verified until the next scheduled run — flagged in the ledger as a post-merge watch item.
- **Bible corpus narrowing** is user-facing (search results shrink to the 20 design docs) — intended; the Help placeholder stays accurate.
- **Kebab renames break external deep links** — accepted; all in-repo references updated.
- **Guard discipline**: `testQualityAudit` fails on an unregistered guard — `GUARD_REGISTRY` entry + `runnerGroups.json` regen are mandatory.
- **Archive is exempt** from kebab/link checks (frozen audit records).
- **`archives/` (gitignored) vs `docs/archive/`** — keep singular spelling everywhere; never create `docs/archives/`.
