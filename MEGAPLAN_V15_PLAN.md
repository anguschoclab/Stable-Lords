# MEGAPLAN V15 — Implementation Plan (as executed)

Exhaustive repository review + consolidation of all 23 open PRs, with a
fresh audit of prior-campaign claims. Zero save-file/backwards-compat
constraints. Slow suite skipped per user directive (adhoc/nightly tier).

## Phase 0 — Safety & baseline

- Restore tag `pre-megaplan-v15` pushed; `refs/megaplan/v15/*` backups
  of all 23 PR heads; working branch `megaplan/v15`.
- Full gate + scanner battery recorded in `MEGAPLAN_V15_LEDGER.md`.

## Phase 1 — PR inventory & adjudication

- All 23 PRs inventoried: mergeability, CI status, file diffs, comments.
- Every PR's single comment was Jules boilerplate — zero substantive
  review feedback existed (assumption DISPROVED).
- Adjudication matrix in `MEGAPLAN_V15_FINDINGS.md` §1.

## Phase 2 — Fresh re-audit

- Prior V5–V14 claims re-verified as claims, not truth.
- Root-caused the `retrieveHotStatePlausibility` shared-worker flake
  (third recurrence): module-level mock reset by sibling lifecycle.
- Confirmed #1048's "hooked up for random play" claim FALSIFIED —
  missed 5 of ~10 registration surfaces; never rollable.
- Identified fixture-vs-union drift as the real guard gap (fixture
  could silently diverge from the `WeatherType` union).

## Phase 3 — best-of-cluster adjudication

- Narrative cluster split into two disjoint subclusters:
  traits/lore TS files (#1044/#1049/#1038/#1051) and combat narrative
  JSON pools (#1046/#1053/#1036/#1050/#1035/#1045).
- Union-merge for compatible content; line-level salvage where a PR
  mixed good content with defects; explicit rejection for
  schema-invalid / gate-loosening / near-dupe-padding content.

## Phase 4 — test-first (commit `242bfd4d`)

All contract/guard tests authored and committed RED before production
changes: weather fixture-union guard, IconTabStrip a11y contract,
cosmicAnomaly unconditional count, flake isolation marker.

## Phase 5 — merge & fix

- 12 merge commits; JSON conflicts resolved by union; `.jules/*.md`
  bot artifacts stripped inside merge commits.
- #1048 completed: WEATHER_VISUALS, WEATHER_STATS, Fall seasonal pool
  (weight 1), fixture — CI TS2741 fixed.
- `OFFSEASON_WEATHER_TYPES` allowlist formalizes the 11 event-only
  weather types; guard asserts WEATHER_TYPES ≡ SEASONABLE ∪ OFFSEASON.
- Salvages: #1033 tests (gate loosenings rejected), #1032 (3 traits,
  gate loosenings rejected), #1050/#1035/#1045 (line-level),
  #1034 (schema-fixed), #1047 (archetype-fixed), #1040/#1031 findings.
- 11 union-merge dupes caught by dup-guard and removed.
- IconTabStrip dangling `aria-controls`/`id` removed.

## Phase 6 — final battery

All gates green; fast suite 801 files / 8,860 tests / 0 failures;
scanners within ceilings; 40w soak 267.1 ms/wk 0 violations; e2e
3 pass + 2 flaky-on-retry. Slow suite intentionally not run.

## Phase 7 — cleanup

- Consolidation PR `megaplan/v15` → `main` (protected branch: required
  checks lint/build/type-check/test).
- All 23 PRs dispositioned on GitHub with reasons; remote branches
  deleted; post-campaign tag `post-megaplan-v15`.
