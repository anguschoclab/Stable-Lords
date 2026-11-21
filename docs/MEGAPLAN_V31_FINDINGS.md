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

_Filled in Phase F._ One verdict row per register claim — see `docs/engineering/terrablood-canon-claims.md` for the live register.

## §2 — DECISION-NEEDED register

_User-adjudication gate._ Every `diverged`/`disputed` claim and seeded conflict lands here with adjudication options (canon wins / keep house / hybrid).

| ID | Claim / conflict | Options | Ruling |
| --- | --- | --- | --- |
| — | _filled in Phase F_ | — | — |

**Seeded items (from plan validation):**
- **DN-V24-F4** — tournament-victor precedence requires a `victor`/`tournamentVictor` state field that does not exist (BACKLOG: "inventing one exceeds scope" per V24). Options: invent the field (unblocks V24-F1 TV leg) / implement ordering without TV leg / defer both.
- **DN-V27-§5** — knack (`luckfactor`/`bloodlust` hidden) scout-rumor surface. Options: land a rumor surface (canon push delivered) / keep hidden (intentional design deferral stands).
