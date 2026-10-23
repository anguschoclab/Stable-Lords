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

## §1 Branch & PR adjudication matrix

| Ref | PR | Delta | Files | Adjudication | Evidence |
| --- | -- | ----- | ----- | ------------ | -------- |
| `bolt-optimizations-…9677480171` | #1069 | +22/−7 | StyleMeterTable.tsx | MERGE | useShallow flatMap primitive projection correct; stride `as` casts cleaned at merge |
| `jules-4911…30946e39` | #1067 | +5/−3 | WeeklyDigestMini.tsx | MERGE | roster only fed `playerWarriorIds` (:21); primitive id-array selector valid |
| `feat/chaos-weaver-events-…598412` | #1066 | +113/−1 | offseason.json + engine wiring + test | MERGE | wiring verified end-to-end (see V5); ships trader spec, no squall spec (gap closed Phase 3) |
| `jules-narrative-lore-update-…960867` | #1068 | +102/−10 | 11 files; 3 traits + generated files | MERGE-WITH-FIXES | trait keys all consumed (V8); strip generated hunks, regenerate |
| `jules-narrative-expansion-…481766` | #1065 | +42/−0 | 4 lore files | MERGE | union-resolve vs #1068; dedupe-verify |
| `chore/narrative-curation-…19609` | #1059 CLOSED | +208/−13 | 3 combat narrative JSONs | REJECT (pending Phase-1 dry-run) | verbatim intra-array duplication visible in diff |

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

(Placeholder — every adjudication + finding gets APPROVED / DISPROVED /
CORRECTED with `file:line` evidence at Phase 7.)
