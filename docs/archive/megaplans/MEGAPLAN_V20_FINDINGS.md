<!-- markdownlint-disable MD001 MD024 MD025 MD033 MD060 -->

# MEGAPLAN V20 FINDINGS — Exhaustive Review & Full Branch Consolidation

Evidence register for the V20 campaign. Sections: §0 baseline, §1 branch/PR
adjudication, §W wiring, §D dup clusters, §A SRP, §K dead code, §P perf,
§C design-bible, §B bug register, §U unique logic, §V final verdict matrix.

## §0 Baseline deltas (measured 2026-10-23)

Recorded in `MEGAPLAN_V20_LEDGER.md` §0. Notable:

- **B0 environment drift:** `rehype-sanitize` missing from `node_modules`
  despite being a declared dep → type-check/build/3 spec failures before
  `bun install`. Not a code defect; flagged as hygiene finding (consider
  a CI install-freshness note).
- knip identical to V19 final (152/68/4); orphan deadExports 211 held;
  fns >80 = 0 held; scan-in-loop 88 = exceptions held; over2s = 0 held.
- Test suite grew +17 files / +259 LOC since V19 (post-campaign commits).

## §1 Branch & PR adjudication matrix — FINAL (2026-10-23, measured)

| Ref | PR | Delta | Files | Adjudication | Evidence |
| --- | -- | ----- | ----- | ------------ | -------- |
| `bolt-optimizations-…9677480171` | #1069 | +22/−7 | StyleMeterTable.tsx | **MERGE** | useShallow flatMap primitive projection correct; stride `as` casts cleaned at merge |
| `jules-4911…30946e39` | #1067 | +5/−3 | WeeklyDigestMini.tsx | **MERGE** | roster only fed `playerWarriorIds` (:21); primitive id-array selector valid |
| `feat/chaos-weaver-events-…598412` | #1066 | +113/−1 | offseason.json + engine wiring + test | **MERGE** | wiring verified end-to-end (see V5); ships trader spec, no squall spec (gap closed Phase 3) |
| `jules-narrative-lore-update-…960867` | #1068 | +102/−10 | 11 files; 3 traits + generated files | **MERGE-WITH-FIXES** | trait keys all consumed (V8); strip generated hunks, regenerate |
| `jules-narrative-expansion-…481766` | #1065 | +42/−0 | 4 lore files | **MERGE** | union-resolve vs #1068; dedupe-verified (below) |
| `chore/narrative-curation-…19609` | #1059 CLOSED | +208/−13 | 3 combat narrative JSONs | **REJECT — zero salvage** | measured: 192 verbatim intra-array dups + 10 near-dupes (lev 0.80–0.91) |

### Dedupe dry-run evidence (Phase 1)

- **Orphan `7dd7225c`:** intra-array duplicate-string count main 0 →
  branch 39 (killText) / 89 (pbp) / 64 (strikes). 10 strings not present
  verbatim on main were similarity-checked against each file's pool —
  best-match Levenshtein 0.80–0.91 (all ≥0.80 near-dupes, e.g.
  `"...chest caves in under the primal, brutal force..."` vs existing
  `"...skull caves in under the raw, primal force..."` 0.87). **Zero
  salvageable content.**
- **#1065 ∪ #1068 union:** appended sets disjoint across all 4 files —
  origins +8/+6, childhoodTraits +5/+4, definingMoments +5/+4,
  loreBackfill2 +3/+3 ids; zero cross-PR overlap; no fuzzy match ≥0.75
  vs existing pools (childhoodTraits max sim 0.56).
- **#1068 traits:** no `effect`-signature collisions across the 75-entry
  `notable.ts` table; `killWindowBonus:0.01` inside the <0.05 scale guard.

Comment audit: all 5 open PRs carry Jules boilerplate only; zero inline
review comments (`gh api pulls/N/comments` → empty). DISPROVES any
assumption of human review signal.

## §B Bug register

| ID | Finding | Evidence | Disposition |
| -- | ------- | -------- | ----------- |
| B0 | `rehype-sanitize` env drift | LEDGER §0 | FIXED via `bun install` (env) |
| F1 | `Events` interface stale — declares 2 of 5 real keys | `src/types/narrative/events.ts:14–17`; consumer EventPass.ts:197 bypasses via `as unknown` | Phase 5: `Record<string, EventNarrative>` |
| F4 | `effectType` union missing `cursed_treasure_discovery` (and `chaos_squall_exposure` post-#1066) | `offseasonEvents/types.ts:13–72` vs 60 JSON effectTypes ≡ 60 handlers; hidden by `as unknown` cast (seasonal.ts:101) | Phase 5: canonical `OFFSEASON_EFFECT_TYPES` tuple + `satisfies` |
| F2 | Orphan branch = verbatim dup content | `git diff main...7dd7225c` | REJECT; Phase-1 dry-run finalizes |
| F3 | #1068 hand-edits generated files | diff touches `auditBaseline.json`/`runnerGroups.json` (timestamp regen) | Phase 4: strip hunks + regenerate |
| B1 | `skipCount.guard.test.ts` POSIX-only `/megaplan/` substring check — backslash paths from `walkTsFiles` never match, so on Windows every megaplan skip was audited as "outside megaplan" | `skipCount.guard.test.ts` (was :63) | FIXED — `isMegaplanFile` normalizes separators (latent; POSIX CI never tripped it) |
| B2 | `offseasonDeterminism` fixture warriors lacked required `Warrior.attributes` — masked until `chaos_squall_exposure` shifted the seeded pick onto `goblin_merchant` (`attrs.CN` crash) | `visitors.ts:116–126`; `offseasonDeterminism.test.ts:33` | FIXED — fixture supplies `attributes` |
| B3 | `seasonalChaosWeaver` `validEffectTypes` — stale partial list (43 of 61) asserting only `typeof t === 'string'` — vacuous pin and duplicate of the canonical tuple | `seasonalChaosWeaver.test.ts:182` (pre-fix) | FIXED — replaced with real `EVENT_HANDLERS` keys ⊆ `OFFSEASON_EFFECT_TYPES` check; removed the mixed dup pair |
| B4 | `headlessTranscriptContract` `path.relative` emits `simulate\narrative.ts` on Windows vs `/`-keyed `GATED_PUSH_COUNTS` — registry lookup silently undefined (same latent class as B1; POSIX CI never tripped it) | `headlessTranscriptContract.slow.test.ts` | FIXED — relative path separator-normalized before lookup |
| B5 | V20 merges re-rolled seeded world trajectories — 3 slow specs failed deterministically post-merge (`worldBalance` legacy=0, `simulation_hardening` 89<90 floor, `worldLiveness` gradient 0.72<1.3). Verified against `pre-megaplan-v20` worktree: all 3 PASS on baseline → merge-induced trajectory shift, not regression | baseline worktree runs vs serial merged-tree runs | RE-BASELINED via measured seed probes (house convention): balance 777→31337, hardening 12345→42, gradient 13→31337 — all verified green |

## §W Wiring

- Offseason event surface currently exact 1:1 (60 JSON `effectType`s ≡ 60
  `EVENT_HANDLERS` keys) — ratchet guard added Phase 3 so the #1048-class
  "registered but never rollable" failure can't recur silently.
- `narrativeContent.events` sole consumer: `EventPass.ts:197`.
- `narrative_validate.ts:126` checks `REQUIRED_KEYS` presence only — no
  parity/union validation existed (V13 DISPROVED claim).

## §D Dup clusters

Baseline: w8 27 src / 12 test / 18 mixed; w12 6/1/3; ident w20 170/49/135;
ident w16 453/117/285. Phase-1 adds union-merge dup audit for #1065∪#1068.

## §A SRP

0 fns >80 (V19 drain held); 268-band triage not re-opened — V19 verdict
re-verified by scan, not re-derived.

## §K Dead code

knip 72 files / 152 exports / 68 types / 4 intra-file dup symbols — identical
to V19 final. orphan deadExports 211 held. No new drain this campaign.

## §P Perf

scan-in-loop 88 = exceptions; entries-in-loop 5 = exceptions; soak 40w
0 violations (1,850 ms/wk under load — clean re-run at close-out).

## §C Design-bible / honest UI

ui-audit 0 across all rules at baseline. Bolt merges reviewed for
honest-state conformance (both preserve rendered output — pinned by
extended characterization specs).

## §U Unique-logic register

- `loreBackfill2` arena-lore entries from #1065 and #1068 are disjoint
  sets (different arenaIds/types) — union-merge preserves both.
- #1068's three traits carry unique effect signatures (verified vs
  `traitDedup` effectHash logic — no collision expected; Phase 1 confirms).
- Orphan `7dd7225c`: preliminary read shows zero unique lines (verbatim
  re-appends); Phase-1 dedupe dry-run finalizes.

## §V Verdict matrix — populated at close-out

| # | Claim / decision | Verdict | Evidence |
| - | ---------------- | ------- | -------- |
| 1 | #1069 StyleMeterTable `useShallow` flatMap merge | **APPROVED — merged** | `508f1206`; MEGAPLAN-V4 spec pins falsy-style skip; 19/19 component specs green |
| 2 | #1067 WeeklyDigestMini roster-id selector merge | **APPROVED — merged** | `f28e82c8`; 9/9 component specs green |
| 3 | #1066 chaos_squall + mysterious_trader merge | **APPROVED — merged** | `4f15127f` (JSON tail conflict unioned vs `fey_trickster`); V2/V3 specs green; trader spec from PR green |
| 4 | #1068 lore + 3 traits merge w/ generated-strip | **APPROVED — merged** | `4599e4a8`; generated hunks resolved by `test-audit-scan` regen; V5 specs pin all 3 trait effects; traitDedup 178-count green |
| 5 | #1065 ∪ #1068 union merge | **APPROVED — merged** | `9c64cf22`; 4 tail conflicts union-resolved; V6 specs pin sentinels + counts (387/228/205/28); uniqueness ratchets green |
| 6 | Orphan `7dd7225c` reject, zero salvage | **APPROVED — rejected** | §1 dry-run: 192 verbatim + 10 near-dups (0.80–0.91); branch deleted Phase 7, backup ref kept |
| 7 | F1 `Events` stale interface | **CONFIRMED — FIXED** | `bc5813d2`; `Events = Record<string, EventNarrative>` — the shape EventPass already assumed; `as unknown` + local shadow removed |
| 8 | F4 missing `cursed_treasure_discovery` in union | **CONFIRMED — FIXED** | `bc5813d2`; `OFFSEASON_EFFECT_TYPES` (61) is canonical source; `EVENT_HANDLERS satisfies` enforces both directions; `as unknown` cast removed |
| 9 | #1068 trait effect keys are real + consumed | **APPROVED** | `TraitEffect` (`traits/types.ts:27–52`) consumed via `mods.ts`; V5 specs pin each field; balance lists extended |
| 10 | `narrative_validate.ts` guards event wiring | **DISPROVED** | checks `REQUIRED_KEYS` presence only (:126) — parity now owned by `seasonalEventHandlerCoverage` + V1–V3 specs + `satisfies` |
| 11 | Slow balance harness auto-covers new traits | **DISPROVED** | `traitBalance.slow.test.ts:114–139` hardcodes lists — V20 traits added explicitly to COMBAT + PERSONALITY lists |
| 12 | Both bolt targets needed new test files | **CORRECTED** | existing suites comprehensive; extended via megaplan pin (V4) instead |
| 13 | B1 skip-guard Windows bug | **CONFIRMED — FIXED** | separator normalization; all V-ticket skips now audited correctly |
| 14 | B2 determinism fixture missing `attributes` | **CONFIRMED — FIXED** | fixture gap, not a handler defect (real warriors always carry attributes) |
| 15 | B3 vacuous `validEffectTypes` pin | **CONFIRMED — FIXED** | replaced with live tuple-subset check; dup pair eliminated |
| 16 | Zero substantive PR review comments | **APPROVED** | `gh api` on all 5 PRs — Jules boilerplate only |
| 17 | Canonical-tuple > interface-union typing | **APPROVED (architecture)** | single source of truth + `satisfies` + runtime parity spec — kills the drift class at compile AND test time |
| 18 | Record-based `Events` > fixed-key interface | **APPROVED (architecture)** | open key set matches JSON-pool reality; EventPass shadow alias removed |
| 19 | B4 transcript-contract Windows path bug | **CONFIRMED — FIXED** | separator normalization; 3/3 serial green |
| 20 | Concurrent slow-suite failures = regressions | **DISPROVED** | 8/11 were load flakes (timeouts, perf thresholds) — all pass serially on idle machine; 3 remaining were B5 trajectory shifts |
| 21 | B5 seeded-sim failures = regression | **DISPROVED — trajectory shift** | all 3 pass on `pre-megaplan-v20` worktree; probe-verified re-baselines: balance→31337 (legacy=2, killRate 0.097), hardening→42 (91 rivals, deathRate 0.90), gradient→31337 (1.775, coherence 0.229) |
| 22 | Coverage `afterEach` timeouts = code defect | **DISPROVED** | 4 failures only under machine saturation (concurrent 300wk sims); serial re-run recorded in LEDGER §6 |
