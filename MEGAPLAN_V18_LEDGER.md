<!-- markdownlint-disable MD001 MD024 MD025 MD033 MD060 -->

# MEGAPLAN V18 LEDGER — Exhaustive SRP/DRY Audit & Refactor

## Baseline

- **Branch:** `main` (direct commits per house convention — no consolidation
  PR) · **Start HEAD:** `83efd41b` · **Safety:** tag `pre-megaplan-v18`
- **Constraints:** zero save-file/backcompat (`SAVE_STATE_VERSION` `'3.0.0'`
  free to bump); strict test-first (Phase 2 RED before any production
  change); slow suite deferred to covered-path gates (adhoc tier).
- **Findings:** `MEGAPLAN_V18_FINDINGS.md` · **Plan:** `MEGAPLAN_V18_PLAN.md`

## Phase 0 — baseline gate matrix (at `83efd41b`, 2026-10-21)

| Gate | Result | Notes |
| ---- | ------ | ----- |
| `test` (fast vitest) | ✅ 854 files / 9,252 tests | 2 skipped (standing baseline, cond-skips) · 66.3s |
| `type-check` | ✅ 0 errors | `tsr generate` + `tsc --build --force` |
| `lint` | ✅ 0 errors | |
| `build` | ✅ OK 6.48s | 6.58 MB precache |
| `narrative-validate` | ✅ clean | |
| dup-scan exact w8 | ✅ 27 src↔src (all registered) · 150 test↔test · 27 mixed | src↔src is the standing gate |
| dup-scan exact w12 | 7 src↔src · 18 test↔test · 4 mixed | secondary tier |
| dup-scan ident w20 | 181 src↔src · 50 test↔test · 139 mixed | audit queue — triage before ledger |
| dup-scan ident w16 | 484 src↔src · 125 test↔test · 286 mixed | deep tier — staged after w20 |
| dup-scan ident w8 | 13,926 src↔src | import-preamble noise — unusable raw, never a gate |
| function-length | 19 fns >80 · 0 >120 · 0 >200 | 293 fns in the 60–80 band |
| param-count | ✅ 0 violations | `PARAM_LIMIT`=5 |
| orphan-scan | ✅ 0 unreachable | |
| entries-in-loop | ✅ 5 = KNOWN_EXCEPTIONS | V12/V15 allowlist, all live |
| ui-audit | ✅ 0 hits all classes | |
| data-array-dup-scan | ✅ no dup entries | |
| `dead-code` (knip) | report-only | 144 exports / 68 types / 4 dup — baseline drift, not gating |
| `dupes` (jscpd) | report-only | 115 clones / 0.69% dup lines over `src scripts e2e electron` |
| 40w soak (seed 20260919) | ✅ 0 invariant violations | 514.2 ms/week |
| determinismAudit | ✅ pass | runs in fast suite (`src/test/engine/determinismAudit.test.ts`) |

## Retroactive record — landed V18 dedup history

V18 numbering formalizes work already on `main` so the ledger is honest
(FINDINGS §0b):

| Commit | Credit |
| ------ | ------ |
| `66a8a5a0` | Split dup ledger 36 → 27 `EXEMPT_PAIRS` + 9 `DEBT_PAIRS` (per-pair validated) |
| `4ac89484` | `statGrantOutcome` + `makeMinorInjury` extracted — 7 offseason debt pairs drained |
| `8529759f` | `DriftParticles` extracted across 5 weather effect files |
| `5f82051f` | `rivalFightPlan` extracted across the 3 plan builders |
| `3245263b` | `DEBT_PAIRS` empty → src↔src baseline ratcheted 36 → 27 |
| `e6dcc447`, `672e4045` | Stale phase-pending docblocks retired; skip registry drained to zero |
| `d9488e8e` | Inline markdownlint directives (no filename exemption exists) |
| `83efd41b` | V18 PLAN + seeded FINDINGS authored |

## Disposition Ledger

| Commit | Phase | Batch | Outcome |
| ------ | ----- | ----- | ------- |
| `5934e2f9` | 0 | tag + LEDGER + baseline matrix | all gates green at `83efd41b` |
| `b2308ac2` | 1 | `srp-census.mjs` + FINDINGS §A/§D/§U | 142-candidate census; 150 test pairs → 4 EXEMPT/146 DEBT (D1–D14); mixed 27 EXEMPT; ident-w20 src 181 EXEMPT; §U1–U10 registered |
| _next_ | 2 | test inventory RED | 34 S + 14 D parked contracts; live-ledger ×3; U-preservation live |
