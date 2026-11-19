# MEGAPLAN V28 — Ledger

**Plan:** `MEGAPLAN_V28_PLAN.md`
**Findings:** `MEGAPLAN_V28_FINDINGS.md`

## Phase commits

| Phase | Description | Commit | Notes |
| --- | --- | --- | --- |
| 0 | V28 doc scaffold + V27 archive + megaplanDocLayout docs-home rewrite | — | un-reds the suite after `54d856dd9`'s move; guard 5/5 green post-rewrite |
| 1 | `docsLayout.guard.test.ts` authored RED + `GUARD_REGISTRY` + `runnerGroups.json` regen | — | 5/7 failed as designed on the pre-taxonomy layout; link check scoped to doc targets after the master bible's lineage code-refs proved unfixable |
| 2 | Root restore: README.md + AGENTS.md (convention rewrite) + CLAUDE.md ref | — | manual link fixed (`docs/manual/user-manual.md`); AGENTS.md gains the taxonomy table + kebab + INDEX + archive rules |
| 3 | Taxonomy moves — design 20 / engineering 11 / reports 3 / manual 1 / archive-audits 4 / archive-summaries 2 / superpowers 36 | — | all `git mv`; `images/manual/` flattened to `images/` + 35 refs rewritten; `src/test/.!39109!.DS_Store` removed |
| 4 | Pointer pass — glob, emitters, workflows, guards, skills, comments, links, INDEX.md | — | bibleIndex → `docs/design/` + corpus-purity spec; `REPORT_FILE`×2 + `git add`×2 + `orphan-report.mjs` → `docs/reports/`; ~30 refs repointed across src/scripts/e2e/skills; INDEX.md authored |
| 5 | Close-out battery + DEFERRED + backlog fold | — | fast suite 998/999 files (1 pre-existing flake, standalone-green); type-check + lint clean; skillPathScan + orphanScan slow guards green |

## Doc-layout changes (re-baseline triggers)

| Change | Surface affected | Direction |
| --- | --- | --- |
| bibleIndex glob `docs/*.md` → `docs/design/*.md` | Help page corpus + app bundle | 20-doc design corpus; ~15 admin/engineering docs leave the bundle |
| `REPORT_FILE` paths → `docs/reports/` | daily_sim/daily_bard nightly workflows | `git add` repointed — watch first scheduled run (backlog §2) |
| megaplan lineage home repo root → docs root | `megaplanDocLayout` guard | convention updated; V27 set archived |
| Kebab-case rename (non-archive docs) | all docs except `archive/` | protocol names exempt (`MEGAPLAN_*`, `README`, `AGENTS`, `INDEX`) |

## Verification record

- `megaplanDocLayout.guard.test.ts` — was RED 2/5 pre-change (`54d856dd9` fallout); GREEN 5/5 after Phase 0
- `docsLayout.guard.test.ts` — authored RED 5/7 on pre-taxonomy layout; GREEN 7/7 post-moves
- Touched-specs battery: `v14PipelineDocs`, `documentationParity`, `bibleIndex`, `dailyBard`, `workflow-config`, `testQualityAudit` — 93/93 green
- `bun run type-check` — clean · `bun run lint` — 0 errors (42 pre-existing warnings)
- `bun run test` — 998/999 files, 10768/10771 tests; sole failure `tacticDiscovery.parity` (suite-load flake — passes standalone; registered §2 watch)
- `bun run test:slow` (scoped): `skillPathScan` + `orphanScan` — 6/6 green; `node scripts/skill-path-scan.mjs` — 145/145 refs resolve
- `bun scripts/test-audit-scan.mjs` — `runnerGroups.json` + `auditBaseline.json` regenerated
