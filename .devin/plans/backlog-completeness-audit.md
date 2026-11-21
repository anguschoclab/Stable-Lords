# Backlog Completeness Audit — Fold Missing Deferred Work into MEGAPLAN_BACKLOG.md

Audited all ~120 `docs/archive/` files against `docs/MEGAPLAN_BACKLOG.md` and live code; found 9+ deferred items never registered, one missed watch-item fold, and verified CI breakage. This edit registers everything valid from all sources (user directive: "include everything and anything valid from all sources") and folds in the verified CI findings. Only `docs/MEGAPLAN_BACKLOG.md` is modified.

## §1 additions — open deferred register

Keep the existing column shape `Prov | Item | Severity | Entry points | Status`. New provenance tags: `V24-F<n>` = V24 FINDINGS deferred register (never had ticket ids; distinct from V24_DEFERRED's D1–D5), `V28`, `V16-scope`, `SP-*` = superpowers session plans.

| Prov | Item | Entry points | Status note |
| --- | --- | --- | --- |
| V24-F1 | **Ordered challenge resolution** — canon ordering BF→TV→first→second→random. Partial: bloodfeud fast-path + `challengeCounts`/`CHALLENGE_BONUS` landed V24 Phase 8; the strict ordering itself never built (TV leg also blocked on F4). | `src/engine/promoters/offerMatchmaking.ts` (`findBestOpponent` :165+), `src/engine/matchmaking/bloodfeud.ts` | Open — feature work |
| V24-F2 | **Expanded per-weapon armor matrix** — canon per-weapon armor interactions beyond the dagger row. | `WEAPON_ARMOR_OVERRIDES` (`src/constants/combat/combat/balance.ts:222`) still `dagger:{scale_mail,chain_mail}` only; consumed by `applyArmorTypeMod` (`src/engine/combat/mechanics/weaponArmor.ts:51`) | Open — canon expansion |
| V24-F3 | **Armor-code renames** — canon letter codes (ALE/ARM/ASH/APA-F family) vs descriptive ids. | `src/data/equipment/armor.ts` ids: `padded/leather/studded_leather/ring_mail/scale_mail/chain_mail/plate_mail/plate_armor` | Open — naming; touches every armor-id consumer + saved displays |
| V24-F4 | **TV challenge priority** — tournament-victor state field for challenge ordering; "inventing one exceeds scope" per V24. | No `victor`/`tournamentVictor` field anywhere in `src/types/` or tournamentSelection | Open — design decision + state field |
| V28 | **markdownlint CI adoption** — vestigial `markdownlint-disable` comments in BACKLOG + master bible; no `.markdownlint*` config, no md lint step. `docsLayout` is the natural gate if adopted. | `src/test/megaplan/docsLayout.guard.test.ts` | Standing deferral — revisit only if markdown linting adopted |
| V16-scope | **AI fuzzy-evaluation of scouted opponents** — deferred to "V17" which had no plan/scope for it. | `intelWorker.ts:279` consumes dossier `observedTells` + `PerceptionSnapshot` at scout-quality weight; `possiblyMaskedPlan` decoy uncertainty; `processIntel` jitter | **RESOLVED (verified 2026-11-21)** — dossier/perception machinery covers intent |
| SP-boundary | **`as unknown as` typed-boundary casts** — out-of-scope note from combat-type-boundary plan (2026-06-16). | `src/engine/bout/reportingHandler.ts:69-70` (`stableId`), `src/engine/bout/mortalityHandler.ts:149` (`FightSummary`), `src/engine/bout/warriorRouting.ts:19` | Open — V30 W3/W9 already touches these files; natural fold-in or standalone |
| SP-virt | **StableRankings / RivalStableList virtualization** — deferred "optional" rows from list-virtualization plan (2026-06-22). | `src/components/world/StableRankings.tsx`, `src/components/scouting/RivalStableList.tsx` (~50 rows each, unvirtualized); `@tanstack/react-virtual` already used in `VirtualizedFallenGrid`/`WarriorLeaderboard` | Open — perf polish, low priority |
| SP-spine | **Progression-spine multi-tier escalating arc** — deferred MVP Option 3 (2026-06-22 plan). | No engine surface | Design deferral — revisit on explicit canon/product push |
| SP-bailout | **Player bailout/receivership economy** — declared non-goal in world-sim-decouple plan (2026-06-21). | `evaluateStopConditions` unchanged; broke player climbs out via promoter offers | Scope boundary — standing deferral |
| SP-reveal | **prefight-advisor `revealLevel`** — style-only (no exact stats) forecast for partially-scouted opponents. | `buildFightForecast` | Conditional — only if product wants partial-reveal tier |

## §2 additions/updates — watch items

- **Add — `fileBudget` ratchet-creep (V29)**: promised §2 fold never happened. Watch: UI merges pushing spec files over the 80-line budget (19→20 rows at V29's CoachOverlay merge).
- **Update — daily_sim/daily_bard post-V28**: status → **VERIFIED FAILING 2026-11-21**. Both workflows run green then die at `git push`: `GH006` protected-branch rejection (main requires 4 status checks; token can't bypass). No report commits since `0bd4fe52a` (2026-03-21). Latent bug: bard ran MOCK without `GEMINI_API_KEY` and committed mock templates — fix push path must also gate the dry-run commit.
- **Add — nightly `skillPathScan` red (AUDIT-2026-11-21)**: `skillPathScan.guard.slow.test.ts` fails on clean CI — sim-diagnostics `SKILL.md` references gitignored generated paths `scripts/out/jscpd/` + `scripts/out/knip-report.json` absent in fresh checkout. Fix = allowlist generated-output paths in the scanner or adjust skill-doc references.
- **Add — ai-behavior-audit-v2 residual watches** (borderline, user: include everything): `displaced` share of reign endings reflects stable churn more than title mechanics; `counterOfferRate` counts only standing offers — re-measure post future soaks.

## §3 addition — adjudicated keep

- **`docs/archive/` kebab-case exemption** — archived lineage filenames stay verbatim (frozen audit records; pinned literally by `ARCHIVED_DOCS` in `megaplanDocLayout.guard.test.ts`).

## Header update

- `Compiled:` → 2026-11-21; note this fold-completeness pass: the V24 FINDINGS deferred register was never assigned ids nor folded, V29's fileBudget fold was promised but missed, V16's scope note orphaned when V17's plan never materialized; statuses re-verified against code.

## Verified resolved during audit (no row needed)

- V28 bible-corpus e2e: `e2e/v25-archetypes.spec.ts` visits `/help` + asserts codex content; `bibleIndex.test.ts` pins boundary → resolve in-place or omit.
- KNOCKDOWN events emitted + narrated (`enumSources.ts:317`, `handlers.ts:612`) — pbp-canon gap closed.
- `CommandLayout`/`OpsLayout`/`StableLayout` deleted (pinned `src/test/routes/rootCleanup.test.ts`); `images/manual/` flattened (V28 ledger); `snap.json` adjudicated KEEP.
- V11/V12 dup-cluster deferrals → governed by `duplication.guard` ledger/exempt registrations.
- CONSOLIDATION F-cycle (type relocation "deliberately retained"), F-howler/F-type1 resolved.
- V14 deferred trio — cloneObject RESOLVED V29, matchup memoization REJECTED V15, engine pool already in §1.
- All 7 DEFERRED docs + V9/V10/V11/V15/V18/V19/V27 ledgers — fully covered by existing §1/§5.

## Implementation steps

1. Edit `docs/MEGAPLAN_BACKLOG.md`: header date + fold note; insert §1 rows; append §2 bullets; append §3 bullet. Match existing markdown table/bullet style; keep the `markdownlint-disable` comment at top.
2. Verify: `bun x vitest run src/test/megaplan/` (doc-layout + audit guards), `bun run lint` on md-adjacent tooling — no code changes, so fast-suite spot run suffices.

## Risks

- Provenance naming: `V24-F*` invented for this fold — document the tag meaning in the row text so future readers don't hunt for a `V24-F` doc.
- SP-* items are pre-megaplan session plans — mark their provenance plainly so the lineage story stays honest.
