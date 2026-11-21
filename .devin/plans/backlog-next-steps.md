# Backlog Triage — What to Tackle Next

Survey of `docs/MEGAPLAN_BACKLOG.md` open register + watch items, verified against live repo/CI state; recommendation: fix the broken scheduled-report workflows first, then queue V15 pool sharding or the knack rumor surface ahead of the V22-D3/D4 campaigns.

## Context verified 2026-11-21

- **V30 is mid-flight**: Phase 0 scaffold committed (`b19e54567`); Phase T begun — `src/test/engine/warrior/stableHealth.test.ts` exists untracked + RED (spec #1 of 15). V30 plan explicitly excludes the open backlog register.
- **Watch item check — daily reports are BROKEN, not just unverified**:
  - `Daily Simulation` run 44713554364 (Nov 20): sim runs 11m OK, then `git push` rejected — `GH006: Protected branch update failed … 4 of 4 required status checks`. Direct push to protected `main`.
  - `Daily Bard` run 44700873362 (Nov 20): same push rejection. Worse: ran MOCK (no `GEMINI_API_KEY`) and **committed 11 files of mock-generated templates** — latent content pollution if push is ever fixed without the key.
  - No bot report commits since `0bd4fe52a` (2026-03-21); reports predate V28.
- **Bonus CI red — Nightly** run 44757730218 (Nov 20): `skillPathScan.guard.slow.test.ts` fails — sim-diagnostics `SKILL.md` references `scripts/out/jscpd/` + `scripts/out/knip-report.json`, which are gitignored generated paths absent in a clean checkout.

## Candidate items (ranked)

| #   | Item                                                   | Size                  | Risk                             | Why                                                                                                                                                                                                                                                                |
| --- | ------------------------------------------------------ | --------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | **Fix scheduled-report workflows + skillPathScan**     | Small (session-scale) | Low                              | Clears the V28 watch item, un-reds nightly CI, fixes live breakage. Workflow fix = push to branch + PR/auto-merge (branch protection blocks direct push); also gate bard MOCK so dry-run can't commit; allowlist generated `scripts/out/` paths in skill-path-scan |
| 2   | **Pre-Phase-3 baseline probes**                        | Cheap (compute only)  | None                             | Run world-diag + daily-oracle + style-probe BEFORE V30 Phase 3 lands `AI_TRAINING_EFFECTIVENESS` 0.8→1.0 — gives Phase 6 an honest pre/post and refreshes §2 watch metrics (TP 64.2%, kill ~4.8%, LU/PR edges)                                                     |
| 3   | **V15 persistent worker-pool sharding** (`poolSize>1`) | Medium                | Determinism-critical             | Only pure-engineering register item; 0.33× parallel bench → relieves `killDeathDivergence` 900s-cap pressure. Ordered-merge determinism must be proven (shardContract already exists)                                                                              |
| 4   | **Knack scout-rumor surface** (V27-§5)                 | Small-Medium feature  | Canon sign-off needed            | `luckfactor`/`bloodlust` exist but hidden; surface via scout rumors. Adjudicated deferral — needs explicit user canon push                                                                                                                                         |
| 5   | **V22-D3 Pagan literal damage model**                  | Own megaplan          | Invalidates ALL combat baselines | NO-GO'd V22 + V29; needs dedicated RED battery + soak verification + world re-baseline. If pursued, schedule adjacent to V30 close-out so re-baselines cluster                                                                                                     |
| 6   | **V22-D4 ADM / graduation tier**                       | Own megaplan          | Design-level                     | Attribute caps 3–25 already in place; graduation tier is net-new advancement design                                                                                                                                                                                |
| 7   | **V24-D5 game modes** (Bloodgames/Primus/PP)           | Scope boundary        | —                                | Standing deferral; only if user wants new modes built                                                                                                                                                                                                              |

## Open decision

Which item to detail into an implementation plan, and whether the work runs as a side-quest alongside V30 Phase T or queues after V30 completes.
