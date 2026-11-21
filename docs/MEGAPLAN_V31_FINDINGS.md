# MEGAPLAN V31 — Findings

**Plan:** `MEGAPLAN_V31_PLAN.md` · **Ledger:** `MEGAPLAN_V31_LEDGER.md` · **Claims register:** `docs/engineering/terrablood-canon-claims.md`

## §0 — Validation audit (pre-implementation, file:line verified)

Every structural claim in the draft plan was audited against the code before landing. Verdicts:

| Claim | Verdict | Evidence / correction |
| --- | --- | --- |
| V30 doc set at docs root → archive | ✅ Approved | All four `MEGAPLAN_V30_*.md` present at docs root pre-move |
| `ARCHIVED_DOCS` allowlist to extend | ✅ Approved | Literal array in `src/test/megaplan/megaplanDocLayout.guard.test.ts` |
| Claims register → `docs/engineering/` kebab-case | ✅ Approved | `docsLayout` guard: `DOCS_DIRS = {design, engineering, reports, manual, archive}`; "live audits" is engineering's remit; kebab-case spec enforced at `:96` |
| `test-audit-scan.mjs` regenerates runnerGroups/auditBaseline | ✅ Approved | Emits `src/test/_setup/runnerGroups.json` + `auditBaseline.json`; `vitest.config.ts:9-14` consumes runnerGroups — regen mandatory after adding specs |
| "`GUARD_REGISTRY` file" | ❌ Corrected | Const inside `src/test/testQualityAudit.test.ts:155-211`; new megaplan guards register `LIVE_RATCHET` (enforced at `:455`) |
| Damage-model entry `resolution/` | ❌ Corrected | BACKLOG V22-D3 marks `resolution/` stale; correct paths `src/engine/combat/mechanics/damageCalc.ts` + `mechanics/weaponArmor.ts` |
| `src/engine/strategy/` = rival plans | ❌ Corrected | Holds only `planBias.ts` + `tacticSuitability.ts`; rival plan generation lives in `src/engine/ai/plan/` (`tacticAdvisor.ts`, `phasePlanner.ts`, `rivalPlan.ts`, `coreGenerator/`, `strategyValidator.ts`, `levers.ts`) |
| Backlog §A scheduled-report candidates | ❌ Corrected | §A empty post-V30; both are §3 watch items (nightly GH006 push failure; `skillPathScan` CI red on gitignored paths) |
| V24-D5 Bloodgames "campaign-scale" | ⚠️ Strengthened | Standing deferral — "no engine surface exists to pin them to": archive material lands as backlog evidence only, never V31 scope |
| V22-D3 "non-balance-model pieces" | ⚠️ Strengthened | "Requires its own campaign with dedicated RED battery + soak verification" (V29 NO-GO reaffirmed): V31 folds formulas as evidence rows only |
| V24-F4 victor field | ⚠️ Promoted | "Needs a victor state field that does not exist" + "design decision" — seeded DECISION-NEEDED; blocks V24-F1's TV leg |
| V27-§5 knack surface | ✅ Trigger confirmed | "Revisit only on explicit canon push" — the archive's 0/5/10/15 luck-factor material is the push |
| Phase T discipline | ⚠️ Strengthened | V30 verbatim: "ALL specs/scanners/guards before ANY production edit"; `// V31 pin:` GREEN exception for preserved-behavior pins (needed — V31 re-checks shipped systems) |
| `type-check` | ⚠️ Note | `bunx tsr generate && tsc --build --force` — route codegen runs first; a failure may be codegen drift |
| Canon-test precedent | ✅ Asset | `src/test/engine/combat/tacticSuitability.canon.test.ts` exists — V31 specs adopt `*.canon.test.ts` |
| TP dominance watch (§3) | ✅ Context | 62→64.2% prior-adjudicated canon-accurate; archive agrees scum/TP is the metagame answer — reused at gate |

## §1 — Canon-claims audit

Register: `docs/engineering/terrablood-canon-claims.md` (28 claims: 7 C-family, 7 D-family, 7 S-family, 7 M-family).

**Verdict histogram:** 18 `implemented` · 7 `missing` · 1 `diverged` · 4 `disputed` (2 resolved via adopted model — C4 chart-formulas, D7 luckfactor-model — and D1/S6 carried to the gate).

**Coverage limitation:** the original archive paste exceeded context capacity — the register covers the surviving claim set (AB concept list, Bloodgames article, archive TOC, plan-carried formulas). Article bodies that exist only as titles in the truncated TOC may hold additional unregistered claims; if the user re-supplies the corpus the register extends.

**Headline finding — the V22-era canon layer already absorbed most of this archive.** `src/data/terrabloodCharts.ts` + ~18 `*.canon.test.ts` specs already pin: Terrablood measured charts (HP/damage/endurance/encumbrance), skill breakpoints, coordination/activity ratings, weapon stat reqs, weapon×armor matrix, tactic suitability, KD presets, learn cap + burn, favorite tactics/rhythms, archetypes + statements, bloodfeud entitlement + challenge bonus, canon targeting, offhand grid + VHC/ambi, and per-style design-review + plan-doctrine intelligence with article citations embedded in `designReview.ts` and `ai/plan/coreGenerator/doctrine.ts`. The genuine deltas remaining are concentrated in the M family plus a few bounded C/D/S items — all carried to §2.

## §2 — DECISION-NEEDED register

_User-adjudication gate._ Every `missing`/`diverged`/`disputed` claim with implementation consequence lands here. Options and rulings:

| ID | Claim / conflict | Options | Ruling |
| --- | --- | --- | --- |
| DN-V24-F4 | Tournament-victor challenge precedence requires a `victor`/`tournamentVictor` state field that does not exist ("inventing one exceeds scope" per V24). Blocks V24-F1's TV leg. | invent field + full ordering / ordering minus TV leg / defer both | DEFER both — evidence fold into V24-F1/F4 backlog rows (Hoser #9 canon text) |
| DN-V24-F1 | Canon challenge ordering (DA → bloodfeud → TV → first → second → random); bloodfeud fast-path landed, strict ordering unbuilt | implement strict ordering / defer | DEFER (with F4) — evidence fold |
| DN-V27-§5 | Knack (`luckfactor`/`bloodlust` hidden) scout-rumor surface — canon push delivered by the archive's luck-factor material | land rumor surface / keep hidden | IMPLEMENT — land scout-rumor/intel surface for luckfactor/bloodlust (vague hints, not exact values) |
| DN-M4 | Skill-rank ladder: code stops at Advanced Master (34) per Consortium Q&A; archive adds Grandmaster (44)/Archmaster (56) | extend ladder / keep Q&A canon | IMPLEMENT — extend SKILL_TIER_LABELS: Grandmaster (44), Archmaster (56) |
| DN-C8 | Weapon breakage folklore (QS/GA/GS "break a lot") — no mechanic exists | implement breakage / house deferral | IMPLEMENT — per-weapon break chance on hard contacts (combat-domain + balance + determinism review) |
| DN-S2 | Defensive AB exhaust-then-strike template — `ripostingHybrid` exists, no explicit curve | add AB exhaust template / keep archetype fit | IMPLEMENT — AB exhaust-then-strike plan curve in ai/plan generation |
| DN-S6 | Style-vs-style arena records (Hoser #9) vs tuned `MATCHUP_MATRIX` — retune toward records or keep house tuning (TP dominance already adjudicated canon-accurate) | retune probe / keep matrix | PROBE — style-probe vs archive pairings; retune only cells contradicting BOTH sim evidence and archive (two-source agreement) |
| DN-D3 | WT+WL+DF ≥ 49 "Primus-bound" / ≥ 35 viable eval thresholds into `designReview` | add eval notes / skip | IMPLEMENT — WT+WL+DF ≥49/≥35 composite eval notes in designReview |

**Evidence-fold items (no ruling needed — land in coupled backlog rows):** C4 archive formulas (chart wins), D5 + S7 + M2 + M7 Bloodgames material (→ V24-D5), M6 ADM (→ V22-D4), D7 luckfactor model (±4 adopted).
