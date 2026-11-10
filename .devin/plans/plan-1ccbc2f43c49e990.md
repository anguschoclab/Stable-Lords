# Megaplan archive + harmonized backlog (validated)

Archive 58 root-level megaplan/audit docs (all versions except V27) to docs/archive/megaplans/, normalize V26/V27 plan filenames, sweep 16 stale session plans, and create MEGAPLAN_BACKLOG.md — one living register of open deferred items, watch items, and house divergences. Strict test-first: a new megaplanDocLayout guard spec is authored and observed RED before any file moves, registered in GUARD_REGISTRY, and turns GREEN at close-out.

## Validation summary (2026-11-10, full claim audit against code)

Every draft claim re-verified. Verdicts: **APPROVED** / **CORRECTED** / **DISPROVED**.

| # | Draft claim | Verdict | Evidence |
|---|---|---|---|
| 1 | 58 files archive (V27 set stays) | **APPROVED** | 57 matching root files excl. V27's 3 (`ls` count) + normalized `MEGAPLAN_V26_PLAN.md` = 58 |
| 2 | V26-D1 favorites UI lacks `discovered.tactic` row — open | **APPROVED** | Zero `tactic` refs under `src/components/warrior/favorites/` |
| 3 | V26-D2 `processTierProgression` dead call — open | **APPROVED + deepened** | `tierProgression.ts:64` early-returns when `newSeason === state.season`; `SystemPass.ts:53` passes `state.season`. Verified the rng-hazard too: L66–67 `resolveRng(rng, hashStr(createdAt) + state.week)` would seed from wall-clock `meta.createdAt` if it ever fired without rng |
| 4 | V26-D3 `meta.createdAt` wall-clock — open | **APPROVED** | `gameStateFactory.ts:109` `createdAt: string = new Date().toISOString()` |
| 5 | V26-D4 gazette `t()` crypto fallback — open | **APPROVED** | `gazetteTemplateHelpers.ts:61–66` — `new SeededRNG(cryptoRandomInt(...))` when no rng passed |
| 6 | V22-D3 Pagan literal damage model — open | **APPROVED** | `damageCalc.ts:21–24` still `(damageClass+4) × locMult × variance` — same shape, not the literal ST+class-var+weapon-var model |
| 7 | V22-D4 ADM/graduation tier — open | **APPROVED** | `ATTRIBUTE_MAX = 25` (`types/shared.types`) is the only cap; no graduation tier exists |
| 8 | V24-D5 Bloodgames/Primus/PP out of scope | **APPROVED** | No engine surface exists for these modes |
| 9 | V21-B3 WEATHER_STATS stamina-token ambiguity — open | **APPROVED** | `weatherStats.ts:61` 'Chaos Storm' displays "STAMINA DRAIN 125%" while `weatherEffects/table.ts:419` sets `staminaMult: 0.8` (drains *slower*); sibling 'Cursed Eclipse' (`table.ts:142`, 1.25) uses direct-mult convention — contradiction still live |
| 10 | V16-A11 weather bid-priority one week stale — open | **APPROVED** | `RivalStrategyPass/offers.ts:46` passes `state.weather` (current week) into `generateBoutBids`; bouts resolve a week later under next week's weather |
| 11 | V27-§5 design deferrals absent | **APPROVED** | `TOURNAMENT_CLASSES` (`classes.ts:26`) has rookies/apprentices/initiates/… — no `novices`; no scout/intel file references `luckfactor`/`bloodlust` (knack stays hidden) |
| 12 | V15 deferred items (cloneObject residual, engine-pool shard) | **APPROVED** | Carried as last-recorded status — deferred-again/documented-only per V15 findings §3 |
| 13 | V21-B6 KD zero-differential — open | **APPROVED + scoped** | Spec exists: `src/test/engine/economy/balance.slow.test.ts:308` `highKD.killRate > lowKD.killRate`. Pass/fail undeterminable statically → carried as **re-verify** row |
| 14 | Resolved items landed | **APPROVED** | `offhandAttack.ts` + `OFFHAND_ATTACK` (V22-D1); `skillBurn.ts`/`burnedSkills` wired through attributeTraining/freeAgents (V22-D2); `STYLE_POSITIVE_LUCK_POOLS` balance.ts:27 (V24-D1); `dagger-style-fit` designReview.ts:1010 (V24-D2); `LEARN_PER_SKILL_CAP=20`/`LEARN_CAREER_CAP=120` learn.ts:28,33 (V24-D3); `rhythmAlwaysOn.test.ts` exists (V25); `worldMatchmaking.ts:167–176` lexicographic comparator (V26-D6); probe scripts exist (`livingworld-seed-probe.ts`, `probe-liveness-seed.ts`) |
| 15 | No test/script reads moved files | **APPROVED** | `fileBudget`/`paramBudget` scan `src/` only; `markdownSanitize` reads `MarkdownReader.tsx`; `skillPathScan` covers `.claude/.devin/.agents` skills — only refs are `docs/TESTING.md` + `docs/DESIGN_BIBLE_UI_v1.0.md` (both stay); `documentationParity`/`v14PipelineDocs` read `docs/` files that stay; `workflow-config`/`dailyBard` touch only `Daily_*` (stay at root). All other refs are comments |
| 16 | `docs/archive/megaplans/` destination | **APPROVED** | `docs/archive/` does not exist yet; `git check-ignore` clean. NB: `archives/` (plural) **is gitignored** (`:73` "Script-generated archives") — the rejected option would have silently untracked the docs |
| 17 | Sweep stale `plan-*.md` | **CORRECTED** | 16 stale session plans (not 17 — `plan-1ccbc2f43c49e990.md` is this session's, untracked). `git mv` on untracked files errors → move the 16 tracked files explicitly |
| 18 | `MEGAPLAN_V23_DEFERRED.md` | **CORRECTED** | **Never existed** — V23 plan proposed a "new register" but none was written; V23 deferrals live in `MEGAPLAN_V22_DEFERRED.md` update note + V23 findings §G. Archive index must not list it |
| 19 | Restore tags for index | **CORRECTED** | `pre-megaplan-v25` is the newest tag — V26/V27 are untagged; index marks them so |
| 20 | Pointer fixes scope | **APPROVED + deepened** | `docs/TESTING.md:112` is the only functional doc link (`TEST_SUITE_AUDIT_LEDGER.md` → `archive/megaplans/…`). V27's 3 root docs reference `.devin/plans/megaplan-v27-tourney-classes.md` (DEFERRED:3, FINDINGS:3, LEDGER:3). V26 docs contain **zero** `.devin/plans` refs. V26/V27 plan files self-reference their own doc sets by bare name — resolve correctly post-move. `AGENTS.md:5,12–13` needs convention update. Stale comment refs (`testSuiteAudit.guard.test.ts`, `v*Dedup/Srp` headers, `state.types.ts`, `designDoctrine.ts`, `dup-scan.mjs`, `srp-census.mjs`) left as historical |
| 21 | New guard spec can go in `src/test/megaplan/` | **APPROVED + deepened** | `'megaplan'` ∈ `NON_MIRROR_DIRS`; zero-prod-import specs exempt from category-conformance. **Mandatory:** register filename in `GUARD_REGISTRY` (`testQualityAudit.test.ts:155–199`, enforced L450) or suite fails; run `bun scripts/test-audit-scan.mjs` to regen `runnerGroups.json` (`src/test/_setup/` tracked; `scripts/out/` ignored) |
| 22 | `.devin/plans` tracked | **APPROVED** | All 16 stale plans + 2 megaplan plans tracked → `git mv` valid; session plan untracked → excluded |
| 23 | `docs/archive/` contents | — | `docs/` has no index/registry to update |

## Objective

Root carries ~58 planning docs spanning the unversioned megaplan (V8-era) through V26 plus CONSOLIDATION V5–V7 and the TEST_SUITE_AUDIT wave. Archive everything except the V27 set into `docs/archive/megaplans/`, normalize V26/V27 plan filenames to the `MEGAPLAN_V<N>_PLAN.md` root convention, sweep stale session plans to `.devin/plans/archive/`, and create `MEGAPLAN_BACKLOG.md` — the single harmonized register of open deferred items, watch items, and adjudicated house divergences.

**Test-first mandate (binding):** the only code in this change is a new layout guard spec. It is authored, registered, and observed **RED** before any file moves — it must fail on the current layout (V9–V26 at root, no BACKLOG, no archive dir) — then implementation proceeds and the spec must go **GREEN**. Close-out runs the full fast suite + type-check + lint (a `.ts` file is added).

## Open-items inventory (validated; input to the backlog)

| Prov | Item | Severity | Entry points | Status |
|---|---|---|---|---|
| V22-D3 | Pagan literal damage model (ST+class-var+weapon-var; soak = weight+12+type-bonus) | Own pass | `damageCalc.ts`, `resolution/weaponArmor.ts` | Open — current model `(class+4)×loc×var` confirmed |
| V22-D4 | ADM/graduation tier | Feature | `ATTRIBUTE_MAX`, `potential.ts`, training passes | Open — caps 3–25, no tier |
| V24-D5 | Bloodgames / Primus-ADM / PP modes | Scope boundary | No engine surface | Standing deferral |
| V15 | `cloneObject` residual ~2–3% churn | Perf, low | pass-boundary spreads | Deferred-again |
| V15 | Engine-pool persistent shard state | Perf, doc-only | `poolSize=1` | Documented-only |
| V16-A11 | Weather bid-priority one week stale | Low | `RivalStrategyPass/offers.ts:46` | Open |
| V21-B3 | WEATHER_STATS vs `staminaMult` semantics | Docs decision | `weatherStats.ts`, `weatherEffects/table.ts` | Open — decide convention, fix display or effect |
| V21-B6 | KD zero kill-rate differential | Re-verify | `economy/balance.slow.test.ts:308` | Registered pre-existing; confirm still failing |
| V26-D1 | `discovered.tactic` UI row missing | Low | `src/components/warrior/favorites/` | Open — verified |
| V26-D2 | `processTierProgression` dead call | Medium | `SystemPass.ts:53`, `tierProgression.ts:64–67` | Open — wire `computeNextSeason` or delete |
| V26-D3 | `meta.createdAt` wall-clock in seeded state | Low | `gameStateFactory.ts:109` | Open — stamp `weekToTimestamp(0)` or derive from seed |
| V26-D4 | Gazette `t()` crypto fallback | Low | `gazetteTemplateHelpers.ts:61–66` | Open — thread pass rng at deterministic callers |
| V27-§5 | Knack scout-rumor surface; Duel2 Novices class; freeze deeper than T−2; FTF social systems | Intentional | scout/intel surface; `TOURNAMENT_CLASSES` | Design deferrals |

**Watch items:** TP world dominance 62→64.2% (canon-adjudicated; log at each re-baseline); world kill 4.78–4.85% post-V26 vs ~8% design floor; LU floor / PR band edge (re-check next world-diag); slow-suite flakes under load (pass standalone).

**House divergences (consolidated keeps):** rolled-base+14 creation + editable SZ; `ENC_TABLE` (`terrabloodCharts.ts:174`) over article formula — divergent cells documented; numeric skills in dossier; rhythm always-on (landed V25 — supersedes V22 keep); learn caps 20/120; V26 §B intentional asymmetries (`AI_TRAINING_EFFECTIVENESS=0.8`, player-only/AI-only surfaces).

**Engineering rules carried forward:** lexicographic comparator chains only in sim sorts (`worldMatchmaking.ts:167–176` precedent — V8/JSC divergence hazard); re-baseline discipline with honest denominators; retained probe scripts; DEFERRED→BACKLOG fold convention at each close-out.

## Phase 0 — RED-first guard spec (before ANY moves)

**0.1** Author `src/test/megaplan/megaplanDocLayout.guard.test.ts` — pure `node:fs`/`node:path` (fast tier; `documentationParity` precedent, no `@vitest-environment` pragma needed). Contract:

```ts
// Invariants:
// it 1 — root carries exactly one MEGAPLAN_V<N>_ lineage + BACKLOG
//   readdir(root): files matching /^MEGAPLAN_V(\d+)_/ share a single N;
//   MEGAPLAN_BACKLOG.md exists; no unversioned MEGAPLAN_{FINDINGS,LEDGER}.md;
//   no CONSOLIDATION_*, TEST_SUITE_AUDIT_*, TEST_AUDIT_FINDINGS at root.
// it 2 — docs/archive/megaplans/ holds the archived lineage
//   readdir(dir): contains the explicit 58-name allowlist (one const — the
//   ratchet: additions are conscious). At minimum asserts FINDINGS/LEDGER
//   presence per archived version N ∈ {9,10,11,12,14,15,16,17,18,19,20,21,
//   22,23,24,25,26} + unversioned + consolidation + test-audit families.
// it 3 — backlog indexes every archived version
//   MEGAPLAN_BACKLOG.md mentions each archived V<N>.
// it 4 — .devin/plans top level holds no megaplan-* plan files
//   (normalized: megaplan plans are MEGAPLAN_V<N>_PLAN.md; archive/ exempt)
```

**0.2** Register `'megaplanDocLayout.guard.test.ts': 'LIVE_RATCHET'` in `GUARD_REGISTRY` (`src/test/testQualityAudit.test.ts:155`, alphabetical).

**0.3** Run `bunx vitest run src/test/megaplan/megaplanDocLayout.guard.test.ts` — **must observe RED** (assertion failures, not import errors): multiple MEGAPLAN versions at root, BACKLOG missing, archive dir missing.

## Phase 1 — Implementation (only after RED observed)

**1.1 Normalize V26/V27 plan filenames**
- `git mv .devin/plans/megaplan-v26-npcai-parity.md MEGAPLAN_V26_PLAN.md`
- `git mv .devin/plans/megaplan-v27-tourney-classes.md MEGAPLAN_V27_PLAN.md`

**1.2 Archive older lineage → `docs/archive/megaplans/`** (`mkdir -p` first). `git mv` these 58 files:
- `MEGAPLAN_FINDINGS.md`, `MEGAPLAN_LEDGER.md`
- `MEGAPLAN_V{9,10,11,12}_{FINDINGS,LEDGER}.md`
- `MEGAPLAN_V14_LEDGER.md`
- `MEGAPLAN_V{15,16}_{FINDINGS,LEDGER,PLAN}.md`
- `MEGAPLAN_V17_{FINDINGS,LEDGER}.md`
- `MEGAPLAN_V{18,19,20,21}_{FINDINGS,LEDGER,PLAN}.md`
- `MEGAPLAN_V22_{DEFERRED,FINDINGS,LEDGER,PLAN}.md`
- `MEGAPLAN_V23_{FINDINGS,LEDGER,PLAN}.md` (no DEFERRED — never existed)
- `MEGAPLAN_V{24,25}_{DEFERRED,FINDINGS,LEDGER,PLAN}.md`
- `MEGAPLAN_V26_{DEFERRED,FINDINGS,LEDGER,PLAN}.md`
- `CONSOLIDATION_FINDINGS_{V5,V6,V7}.md`, `CONSOLIDATION_{V5,V7}_LEDGER.md`
- `TEST_SUITE_AUDIT_{PLAN,LEDGER}.md`, `TEST_AUDIT_FINDINGS.md`

Stays at root: `MEGAPLAN_V27_{PLAN,FINDINGS,LEDGER,DEFERRED}.md`, `MEGAPLAN_BACKLOG.md`, `AGENTS.md`, `README.md`, `MAC_SETUP.md`, `Daily_*_Report.md` (generated; `workflow-config.test.ts` asserts `Daily_Balance_Report.md` is not gitignored — do not move or ignore).

**1.3 Sweep 16 stale session plans** — `mkdir -p .devin/plans/archive`, then `git mv` each tracked `plan-*.md` **except** `plan-1ccbc2f43c49e990.md` (this session's, untracked):
```bash
for f in .devin/plans/plan-*.md; do
  [ "$f" = ".devin/plans/plan-1ccbc2f43c49e990.md" ] || git mv "$f" .devin/plans/archive/
done
```

**1.4 Create `MEGAPLAN_BACKLOG.md`** — `<!-- markdownlint-disable MD001 MD024 MD025 MD033 MD060 -->` header (DEFERRED-file convention). Sections:
1. Purpose & convention (living register; close-outs fold open items here; per-version docs are immutable audit records in `docs/archive/megaplans/`; latest version's set stays at root)
2. Open deferred register — the validated table above (provenance | item | severity | entry points | status)
3. Watch items — the four listed above
4. House divergences — consolidated keeps listed above
5. Engineering rules — comparator discipline, re-baseline discipline, probe scripts, fold convention
6. Resolved index — one line per family → archive pointer (V9 traitDedup; V22 D1/D2→V23; V24 D1–D4; V25 all; V27 all)
7. Archive index — version → theme → restore-tag table (unversioned/V8 → V27; V26/V27 marked untagged; V23 noted as no-DEFERRED); archived filenames link into `docs/archive/megaplans/`

**1.5 Pointer & convention fixes**
- `docs/TESTING.md:112` — `` `TEST_SUITE_AUDIT_LEDGER.md` `` → `` `archive/megaplans/TEST_SUITE_AUDIT_LEDGER.md` ``
- `MEGAPLAN_V27_{FINDINGS,LEDGER,DEFERRED}.md` headers — `.devin/plans/megaplan-v27-tourney-classes.md` → `MEGAPLAN_V27_PLAN.md`
- `AGENTS.md` — rewrite the plan-files section: session plans + megaplan drafts live in `.devin/plans/`; stale session plans sweep to `.devin/plans/archive/`; landed megaplans normalize to `MEGAPLAN_V<N>_{PLAN,FINDINGS,LEDGER,DEFERRED}.md` at root; when a newer megaplan closes, the prior set moves to `docs/archive/megaplans/`; `MEGAPLAN_BACKLOG.md` is the living deferred/watch register.
- Leave comment refs in test/scanner headers (historical pointers, not functional).

## Phase 2 — Verification (GREEN gate)

- `bunx vitest run src/test/megaplan/megaplanDocLayout.guard.test.ts` — GREEN
- `bunx vitest run src/test/megaplan src/test/scripts` — guard + scripts tiers green
- `bun scripts/test-audit-scan.mjs` — regen `runnerGroups.json`; commit `src/test/_setup/` changes if the file changed
- `bun run test` — full fast suite green (default gate per CLAUDE.md)
- `bun run type-check` + `bun run lint` — clean (new `.ts` spec)
- `git status` — renames tracked; root `ls` shows only V27 set + `MEGAPLAN_BACKLOG.md`
- `grep -rn "devin/plans/megaplan-v2" .` — zero hits; `grep` root *.md for moved filenames — only archive-internal refs
- Slow suite **not required** (no sim/pipeline/determinism/subprocess paths touched; `skillPathScan` unaffected — skill docs reference only `docs/TESTING.md` + `docs/DESIGN_BIBLE_UI_v1.0.md`, both unmoved). e2e **not required** (no UI).
- Commit: `docs: archive megaplan lineage + land MEGAPLAN_BACKLOG harmonized register` (direct to `main` per house convention; the guard spec + registry entry ride the same commit so the suite is never red on main).

## Risks / considerations

- **Guard RED window on main:** the spec must not land ahead of the moves — single commit keeps main green throughout.
- **Allowlist brittleness:** the archive allowlist in the guard is the intended ratchet — future archive additions consciously update it (same pattern as `GUARD_REGISTRY`).
- **`git mv` on untracked file:** the session plan is untracked — excluded explicitly in the loop; do not glob `git mv .devin/plans/plan-*.md` (it would error).
- **Judgment calls:** V21-B6 carried as re-verify (spec exists, current pass/fail undetermined without running the slow tier); V22 §2 rhythm-keep superseded by V25's always-on — backlog records final state.
- **Session-plan links rot:** archived session plans reference root docs by bare name — accepted historical rot; the convention update makes future links path-aware.
