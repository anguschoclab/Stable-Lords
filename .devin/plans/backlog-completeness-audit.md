# Backlog Completeness Audit — Fold Missing Deferred Work into MEGAPLAN_BACKLOG.md

Audited all ~120 `docs/archive/` files (megaplan FINDINGS/PLAN/LEDGER/DEFERRED, CONSOLIDATION V5–V7, TEST_SUITE_AUDIT, audits/, summaries/, superpowers/) against `docs/MEGAPLAN_BACKLOG.md` and live code; found ~8 deferred items that never folded into the register, plus one watch item whose fold was promised but missed, plus newly-verified CI breakage to record.

## Gaps found (verified against code, 2026-11-21)

### A. §1 register — deferred work still open, absent from backlog

| # | Prov | Item | Evidence it's still open |
|---|------|------|--------------------------|
| A1 | V24-FINDINGS deferred register | **Ordered challenge resolution** (BF→TV→first→second→random) | Partially landed: V24 Phase 8 shipped bloodfeud fast-path + `challengeCounts` scaling (`offerMatchmaking.ts:234-238`); the canon ordering sequence itself was never built |
| A2 | V24-FINDINGS deferred register | **Expanded per-weapon armor matrix** | `WEAPON_ARMOR_OVERRIDES` (`constants/combat/combat/balance.ts:222`) still holds only `dagger: {scale_mail:0.7, chain_mail:0.7}` |
| A3 | V24-FINDINGS deferred register | **Armor-code renames** (ALE/ARM/ASH/APA-F canon codes) | `src/data/equipment/armor.ts` ids remain descriptive (`padded`, `ring_mail`, `scale_mail`, `chain_mail`, `plate_mail`, `plate_armor`) — canon codes never adopted |
| A4 | V24-FINDINGS deferred register | **TV challenge priority** | No tournament-victor state field exists (grep `victor` in types/tournamentSelection → none); needs design decision + state field |
| A5 | V28_DEFERRED | **markdownlint CI adoption** | Still true: no `.markdownlint*` config, no md lint step; conditional standing deferral (same shape as V24-D5) |
| A6 | V28_DEFERRED | **docs/archive kebab-case rename** | Adjudicated exemption (frozen audit records pinned literally in `megaplanDocLayout.guard.test.ts` ARCHIVED_DOCS); not open work — candidate for §3 divergence note or explicit "adjudicated keep" row |
| A7 | V16_PLAN §out-of-scope | **AI fuzzy-evaluation of scouted opponents** | Deferred to "V17" which had no PLAN and was a PR-adjudication campaign; dossier/decoy/perception machinery (`intelWorker` blends `observedTells` at scout-quality weight, `possiblyMaskedPlan`, `processIntel` jitter) likely covers intent — needs one final verification pass, then register resolved or open |

### B. §2 watch items — missing / stale

| # | Item | Status |
|---|------|--------|
| B1 | **`fileBudget` ratchet-creep watch** (V29_DEFERRED) | V29_DEFERRED header claims "open rows folded into §2" — this row never arrived. Add: watch for fileBudget ratchet-creep on future UI merges (19→20 at V29 merge) |
| B2 | **daily_sim/daily_bard post-V28** | VERIFIED BROKEN today: both workflows run then fail `git push` — `GH006` protected-branch rejection (main requires 4 status checks). No report commits since `0bd4fe52a` (2026-03-21). Bard additionally ran MOCK (no `GEMINI_API_KEY`) and committed mock templates — latent pollution once push works. Update watch row to verified-failing |
| B3 | **Nightly `skillPathScan` red** (new finding) | `skillPathScan.guard.slow.test.ts` fails on clean CI: sim-diagnostics `SKILL.md` references gitignored generated paths `scripts/out/jscpd/` + `scripts/out/knip-report.json`. Register as new watch/finding row (Prov: AUDIT-2026-11-21) |
| B4 | ai-behavior-audit-v2 residual watches | `displaced` share reflects stable churn; `counterOfferRate` metric only counts standing offers — borderline optional adds |

### C. Verified resolved during audit (no row needed, or resolved-status row)

- **V28 bible-corpus e2e click-through** — effectively covered: `e2e/v25-archetypes.spec.ts` does `gotoInApp(page,'/help')` + asserts codex content; `bibleIndex.test.ts` pins corpus boundary. Register resolved-with-evidence or drop.
- KNOCKDOWN events — emitted (`enumSources.ts:317`) + narrated (`handlers.ts:612`) — superpowers pbp-canon gap closed.
- `CommandLayout`/`OpsLayout`/`StableLayout` cleanup — done; pinned by `src/test/routes/rootCleanup.test.ts`.
- `images/manual/` flatten — done (V28 ledger phase 3).
- `snap.json` — adjudicated KEEP (V29_DEFERRED).
- V11/V12 dup-cluster deferrals (KDD↔simulation.slow, economy↔economyScaling, tail clusters) — governed by `duplication.guard` ledger + exempt registrations; not open backlog work.
- CONSOLIDATION F-cycle type relocation — "deliberately retained" per V5 §9; F-howler/F-type1 resolved in follow-up commits.
- V14 deferred trio — cloneObject (RESOLVED V29), matchup memoization (REJECTED V15), engine pool (in §1 as V15 row ✓).
- All 7 DEFERRED docs + V9/V10/V11/V15/V18/V19/V27 ledgers — fully covered by existing §1/§5.

### D. Scope question — superpowers session plans

`docs/archive/superpowers/plans/` (38 pre-megaplan session plans, Apr–Jun 2026) flagged these still-open follow-ups; not megaplan lineage — include or exclude:

| Item | State |
|------|-------|
| `as unknown as` boundary casts | STILL LIVE: `bout/reportingHandler.ts:69-70` (`stableId`), `mortalityHandler.ts:149` (`FightSummary`), `warriorRouting.ts:19` — V30 W3/W9 already touches these files |
| `StableRankings`/`RivalStableList` virtualization | Both exist unvirtualized (~50 rows each); `@tanstack/react-virtual` already used in `VirtualizedFallenGrid`/`WarriorLeaderboard` |
| Progression-spine multi-tier escalating arc | Deferred MVP option; no engine surface exists |
| Player bailout/receivership economy | Declared non-goal in its own plan; feature boundary |
| prefight-advisor `revealLevel` | Conditional extension for partially-scouted opponents |

## Implementation steps

1. Rewrite `docs/MEGAPLAN_BACKLOG.md` §1 table: add rows A1–A7 with provenance tags (`V24-F` for the findings-register items, `V28`, `V16-scope`); keep existing column shape (Prov/Item/Severity/Entry points/Status).
2. Update §2: add fileBudget watch (B1); update daily_sim/daily_bard row → verified-failing with GH006 evidence + bard-MOCK latent bug (B2); add skillPathScan nightly row (B3); optionally B4 watches.
3. Add kebab-case exemption to §3 adjudicated keeps (A6) if desired.
4. Header: bump "Compiled" date to 2026-11-21 and note the fold-completeness pass (V24-FINDINGS register had never been folded; V29 fileBudget fold missed).
5. Optionally register superpowers stragglers (D) under a `SP-` provenance — pending user decision.
6. Verify: `bun x vitest run src/test/megaplan/docsLayout.guard.test.ts src/test/megaplan/megaplanDocLayout.guard.test.ts` + `testQualityAudit` stay green; markdown formatting consistent with existing table style.

## Files

- `docs/MEGAPLAN_BACKLOG.md` — only file modified.

## Risks

- Kept-out items must stay documented — the archive docs are immutable, so "verified resolved" verdicts only live in the backlog; be conservative about what gets a row vs. a resolution note.
- `INDEX.md` doesn't enumerate backlog rows — no INDEX update needed.
