# MEGAPLAN V31 — Terrablood Canon Harvest

Plan for the V31 ritual: audit the pasted Duel II community archive (Terrablood's PBM Archives — style guides, Hoser Report #1–#15, weapon/armor/stat charts, tournament & Bloodgames material) against live code, commit a distilled canon-claims register, escalate every canon-vs-code conflict to the user, then implement adjudicated items test-first.

## Summary

The user supplied the full Terrablood Duel II strategy archive and asked to "add it to the mix of ideas" as a full V31 megaplan. All four idea families are in scope (combat canon, design heuristics, strategy & AI depth, meta systems). Per user direction: conflicts are **flagged for user adjudication** (not resolved by sim evidence or fiat), and the corpus is committed **only as a distilled claims register** — no raw archive text.

## Validation status (this draft audited against code 2026-11)

| Draft claim                                                  | Verdict              | Evidence / correction                                                                                                                                                                                                                                                                                   |
| ------------------------------------------------------------ | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| V30 doc set at docs root → `git mv` to archive               | ✅ Approved          | `docs/MEGAPLAN_V30_{PLAN,FINDINGS,LEDGER,DEFERRED}.md` all present                                                                                                                                                                                                                                      |
| `ARCHIVED_DOCS` allowlist to extend                          | ✅ Approved          | literal array in `src/test/megaplan/megaplanDocLayout.guard.test.ts`                                                                                                                                                                                                                                    |
| Claims register → `docs/engineering/` kebab-case             | ✅ Approved          | `docsLayout` guard: `DOCS_DIRS = {design, engineering, reports, manual, archive}`; "live audits" is engineering's remit; kebab-case spec enforced at :96                                                                                                                                                |
| `test-audit-scan.mjs` regenerates runnerGroups/auditBaseline | ✅ Approved          | emits `src/test/_setup/runnerGroups.json` + `auditBaseline.json`; `vitest.config.ts:9-14` consumes runnerGroups — regen is mandatory after adding specs                                                                                                                                                 |
| `GUARD_REGISTRY file`                                        | ❌ Corrected         | it is a `const` inside `src/test/testQualityAudit.test.ts` (:155-211); new megaplan guards register a `LIVE_RATCHET` disposition there — enforced by spec at :455                                                                                                                                       |
| Damage-model entry `resolution/...damage.ts`                 | ❌ Corrected         | BACKLOG V22-D3 marks `resolution/` stale; correct paths `src/engine/combat/mechanics/damageCalc.ts` + `mechanics/weaponArmor.ts`                                                                                                                                                                        |
| `src/engine/strategy/` = rival plans                         | ❌ Corrected         | holds only `planBias.ts` + `tacticSuitability.ts`; rival plan generation lives in `src/engine/ai/plan/` (`tacticAdvisor.ts`, `phasePlanner.ts`, `rivalPlan.ts`, `coreGenerator/`, `strategyValidator.ts`, `levers.ts`)                                                                                  |
| Backlog §A: scheduled-reports/skillPathScan candidates       | ❌ Corrected         | §A is empty post-V30; both are §3 watch items (nightly GH006 push failure; skillPathScan CI red on gitignored paths) — pre-existing, unrelated to V31                                                                                                                                                   |
| V24-D5 Bloodgames = "campaign-scale"                         | ⚠️ Strengthened      | status is **standing deferral — "no engine surface exists to pin them to"**: archive material can only land as backlog evidence, never V31 implementation scope                                                                                                                                         |
| V22-D3 damage model — V31 lands "non-balance-model pieces"   | ⚠️ Strengthened      | backlog says "requires its own campaign with a dedicated RED battery + soak verification" (V29 NO-GO reaffirmed): V31 folds the archive's damage/HP/endurance formulas as **evidence rows only**, never implementation                                                                                  |
| V24-F4 victor field                                          | ⚠️ Promoted          | "needs a victor state field that does not exist" + "design decision" — becomes an explicit DECISION-NEEDED item at the adjudication gate; V24-F1's TV leg blocked on it                                                                                                                                 |
| V27-§5 knack surface                                         | ✅ Trigger confirmed | status "revisit only on explicit canon push" — the archive's 0/5/10/15 luck-factor material **is** the canon push; V31 legitimately re-opens it                                                                                                                                                         |
| Phase T discipline                                           | ⚠️ Strengthened      | adopt V30 verbatim: "Phase T commits ALL specs/scanners/guards before ANY production edit. RED = failing assertion or missing-symbol import failure, logged in LEDGER" — plus the `// pin:` exception (GREEN on old and new) for preserved behavior, needed since V31 re-checks already-shipped systems |
| `type-check` command                                         | ⚠️ Note              | `bun run type-check` = `bunx tsr generate && tsc --build --force` — route codegen runs first; a type-check failure may be codegen drift, not a type error                                                                                                                                               |
| Existing canon-test precedent                                | ✅ Asset             | `src/test/engine/combat/tacticSuitability.canon.test.ts` already exists — V31 canon specs follow the same naming (`*.canon.test.ts`)                                                                                                                                                                    |
| TP dominance watch (§3)                                      | ✅ Context           | 62→64.2% world climb previously "adjudicated canon-accurate" — the archive supports scum/TP as the dominant metagame answer; cite this when adjudicating S-family matchup claims                                                                                                                        |

## Backlog couplings (verified statuses)

| Item                                                                               | Status                                                                                                                                                                                    | V31 relationship                                                                                                                                                           |
| ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **V24-F4** TV challenge priority                                                   | Open — design decision + missing `victor`/`tournamentVictor` state field                                                                                                                  | DECISION-NEEDED at gate (state-field design); prerequisite for V24-F1's TV leg                                                                                             |
| **V24-F1** Ordered challenge resolution (bloodfeud → TV → first → second → random) | Open — bloodfeud fast-path + `challengeCounts`/`CHALLENGE_BONUS` landed; strict ordering unbuilt. Entry: `promoters/offerMatchmaking.ts` (`findBestOpponent`), `matchmaking/bloodfeud.ts` | Hoser #9 challenge-system article is direct canon; prime V31 implementation candidate pending F4 adjudication                                                              |
| **V22-D3** Pagan literal damage model                                              | Open — own campaign (V29 NO-GO reaffirmed). Entry: `mechanics/damageCalc.ts`, `mechanics/weaponArmor.ts`                                                                                  | Evidence fold only: archive's damage/HP (`3.75·CN+SZ+WL/2`), endurance (`CN·WL+ST/10`; `ST+CN+WT/2+WL`), coordination (`SP+DF` bands) formulas appended to the backlog row |
| **V22-D4** ADM/graduation tier                                                     | Open — design-level feature, own campaign. Entry: `ATTRIBUTE_MAX` (`types/shared/attributes.ts:40`), `warrior/potential.ts`                                                               | Evidence fold only (archive's ADM class/breakpoint material)                                                                                                               |
| **V24-D5** Game modes (Bloodgames, Primus, PP)                                     | Standing deferral — no engine surface                                                                                                                                                     | Evidence fold only; never V31 scope                                                                                                                                        |
| **V27-§5** Knack/`luckfactor`/`bloodlust` surface                                  | Design deferral — "revisit on explicit canon push"                                                                                                                                        | Canon push delivered → DECISION-NEEDED (scout-rumor surface design); `TOURNAMENT_CLASSES` at `matchmaking/tournamentSelection/classes.ts:26` is the class-surface entry    |

## Implementation steps

### Phase 0 — Scaffold (ritual, matches V30)

1. `git tag pre-megaplan-v31` for restore.
2. `git mv docs/MEGAPLAN_V30_{PLAN,FINDINGS,LEDGER,DEFERRED}.md docs/archive/megaplans/`; append the four filenames to `ARCHIVED_DOCS` in `src/test/megaplan/megaplanDocLayout.guard.test.ts`; verify `megaplanDocLayout` spec green.
3. Create `docs/MEGAPLAN_V31_{PLAN,FINDINGS,LEDGER,DEFERRED}.md` at docs root (PLAN = this document evolved; LEDGER initialized with §3 RED log).
4. Update `docs/INDEX.md` for the new set + claims register.

### Phase F — Canon-claims register + FINDINGS audit

5. Write `docs/engineering/terrablood-canon-claims.md` — distilled register, one row per claim: `id | family (C/D/S/M) | claim (paraphrase, article cited) | verdict (implemented / missing / diverged / disputed) | evidence (file:line) | status`. Provenance note: community strategy lore, internally contradictory — `disputed` rows keep conflicting claims per-article, never flattened.
6. Populate verdicts by auditing live code per family:
   - **C — Combat canon**: weapon stat requirements (Hoser #1 ST/SZ/WT/DF table) vs `src/data/equipment/` suitability; weapon×armor cells (Hoser #12 + Jessie Jest basher notes) vs `constants/combat/weaponArmorMatrix.ts` + `mechanics/weaponArmor.ts`; damage bands by ST+SZ vs `mechanics/damageCalc.ts`/`combatDamage.ts` (evidence only — V22-D3); HP/endurance/coordination formulas vs health/endurance constants (evidence only — V22-D3); weapon breakage (QS/GA/GS); death mechanics — vitals roll → death intent → death roll, infirmary roll at HP floor — vs `mechanics/deathRolls.ts`; KD-vs-death semantics; two-weapon DF requirements; reach/size interplay.
   - **D — Design heuristics**: per-style stat ranges & odd-breakpoint bonuses (13/15/17/21; DF-21 "double attack" rumor; SP+DF=21 coordination) vs `warrior/skillCalc.ts`, `warriorFactory`, recruit generators; Triplett + WT+WL+DF≥49/35 eval thresholds vs `warrior/designReview.ts`; ambidexterity; skill-base/NEX tables.
   - **S — Strategy & AI depth**: canon default plans per style (OE/AL/KD minute curves, tactics, targeting, armor) vs `ai/plan/` (`coreGenerator/`, `phasePlanner.ts`, `tacticAdvisor.ts`) + `defaultPlan` + `strategy/tacticSuitability.ts` (existing `tacticSuitability.canon.test.ts` is the precedent/naming convention); favorite-rhythm distributions vs `favorites/favorites.ts` (`STYLE_RHYTHM_RANGES`, `FAVORITE_TACTIC_POOLS`); Hoser #9 style-vs-style records vs `constants/combat/matchup.ts`; protect-location conventions (`protectShield.ts`, hit-location weights).
   - **M — Meta systems**: challenge ordering (V24-F1/F4 above); knack surface (V27-§5); Bloodgames/ADM/FE classes (evidence fold only); skill-rank ladder (E/AE/M/AM/GM/ARCH = 16/20/26/34/44/56); selective-training rules (stat trains burn skill capacity; no skills from CN); stat-bump↔skill-learn tradeoff.
7. **FINDINGS.md** — audit table results; every `diverged`/`disputed` row becomes a **`DECISION-NEEDED`** entry with 2–3 adjudication options (canon wins / keep house / hybrid). Known DECISION-NEEDED seeds from this validation: V24-F4 victor state field; V27-§5 knack-surface design.
8. **User-adjudication gate** — present DECISION-NEEDED list via `ask_user_question` (batched, ≤4/call); record verdicts in FINDINGS + register. No implementation phase starts until the gate clears.

### Phase T — Specs before ANY production edit (V30 protocol verbatim)

**Phase T commits ALL specs/scanners/guards before ANY production edit.** RED = failing assertion or missing-symbol import failure, logged in LEDGER §3. Documented exception: characterization pins (`// V31 pin:`) asserting preserved behavior — GREEN on old and new code, the no-regression net for already-shipped canon (favorites, rhythm ranges, weapon×armor matrix, tactic suitability).

9. For every item adjudicated "implement": author spec under matching `src/test/<domain>/` (canon specs use `*.canon.test.ts` naming per existing precedent; `*.slow.test.ts` when sim-heavy).
10. Author the `canonClaims` coverage guard: `scripts/canon-claims-scan.mjs` (zero-dep scanner → `scripts/out/` report) + `src/test/megaplan/canonClaims.guard.test.ts` asserting every register row resolves to implemented/open/deferred; register `'canonClaims.guard.test.ts': 'LIVE_RATCHET'` in `GUARD_REGISTRY` (`testQualityAudit.test.ts:155`).
11. `bun scripts/test-audit-scan.mjs` → regen `src/test/_setup/runnerGroups.json` + `auditBaseline.json` (consumed by `vitest.config.ts:9-14`); `testQualityAudit` + `testSuiteAudit` green.
12. Observe every new spec RED; log in LEDGER §3. Pins observed GREEN and marked `// V31 pin:`.

### Phase I — Implementation workstreams (order set by adjudication)

- **WS-A Combat canon** — weapon stat-requirement table; armor-cell adjudication; breakage rates; death-roll shape. (`combat-balance` + `combat-domain` skills mandatory; V22-D3 stays untouched.)
- **WS-B Design heuristics** — recruit/archetype stat distributions, breakpoint bonuses, eval thresholds into `designReview`/scout hints.
- **WS-C Strategy & AI** — rival default plans/tactic picks in `ai/plan/`, matchup priors, protect conventions.
- **WS-D Meta** — V24-F1 challenge ordering (if F4 adjudicated), knack-rumor surface, skill-rank naming.

### Phase 6 — Close-out

13. Balance probes (style-probe, balance-lab, daily-oracle digest) for combat-touching changes; batched seeded re-baselines for RNG-stream shifts (one phase, V30 precedent); DEFERRED + BACKLOG fold (archive evidence rows land in the coupled backlog items); ledger final.

## Files to create / modify

- `.devin/plans/v31-canon-harvest-plan.md` — this plan (repo-authoritative).
- `docs/MEGAPLAN_V31_{PLAN,FINDINGS,LEDGER,DEFERRED}.md` — new doc set.
- `docs/engineering/terrablood-canon-claims.md` — distilled claims register.
- `docs/INDEX.md` — catalog new docs.
- `src/test/megaplan/megaplanDocLayout.guard.test.ts` — `ARCHIVED_DOCS` += V30 set.
- `docs/archive/megaplans/` — receives V30 set via `git mv`.
- `scripts/canon-claims-scan.mjs`, `src/test/megaplan/canonClaims.guard.test.ts` — new guard.
- `src/test/testQualityAudit.test.ts` — `GUARD_REGISTRY` += canonClaims `LIVE_RATCHET`.
- `src/test/_setup/runnerGroups.json`, `auditBaseline.json` — regenerated.
- Implementation-phase files: set by adjudication (candidates: `src/data/equipment/*`, `src/constants/combat/*`, `src/engine/ai/plan/*`, `src/engine/favorites/*`, `src/engine/matchmaking/*`, `src/engine/promoters/offerMatchmaking.ts`).

## Verification

- [ ] `bun run test` + `bun run type-check` + `bun run lint` at every phase (`type-check` includes `tsr generate` — check codegen drift first on failure).
- [ ] **Phase T gate: every spec/scanner/guard observed RED (or GREEN + `// V31 pin:`) and ledger-logged before ANY production edit** — the user's strict test-first mandate.
- [ ] `bun run test:slow` for combat/balance/pipeline-touching workstreams.
- [ ] Seeded-parity probe for any seeded-stream change; single batched re-baseline.
- [ ] `testQualityAudit` green — specs filed under matching `src/test/<domain>/`, `canonClaims` registered.
- [ ] `megaplanDocLayout` + `docsLayout` guards green after doc moves; `docs/INDEX.md` fresh.
- [ ] `verify-implementation` pass before claiming V31 done; `combat-balance`/`combat-domain` for WS-A, `guard-ratchet` for the claims guard, `determinism-debug` for seed shifts, `sim-diagnostics` for probes.

## Risks / considerations

- **Corpus size & internal contradiction**: archive is huge and managers disagree (AB deftness "must be 21" vs "works at 17"; speed "useless" vs key). Register keeps claims per-article; contradictions → `disputed`, never silently picked.
- **Anecdotal canon**: community lore, not developer rules — the DECISION-NEEDED gate is where bad canon gets rejected.
- **Scope creep**: hard couplings enforced — V22-D3/V22-D4/V24-D5 get evidence rows only (V24-D5 has no engine surface at all); V31 never absorbs them.
- **Determinism**: rival-plan/archetype changes re-roll seeded streams — batch into one re-baseline phase.
- **Pre-existing broken nightly (§3 watch)**: GH006 push rejection + `skillPathScan` CI red on gitignored paths — unrelated to V31; note in LEDGER if it persists, don't let it block Phase 0.
- **TP dominance context (§3 watch)**: archive agrees scum/TP is the documented dominant metagame answer — reuse that prior adjudication when S-family matchup claims reach the gate.
