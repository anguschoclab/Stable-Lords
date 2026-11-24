# MEGAPLAN V31 — Terrablood Canon Harvest

One-sentence summary: audit the pasted Duel II community archive (Terrablood's PBM Archives — style guides, Hoser Report #1–#15, weapon/armor/stat charts, tournament & Bloodgames material) against live code, commit a distilled canon-claims register, escalate every canon-vs-code conflict to the user, then implement adjudicated items test-first.

> **Validation status:** every structural claim in this plan was audited against the code before landing (verdicts below and in `MEGAPLAN_V31_FINDINGS.md` §0). Phase T enforces strict test-first: every spec, pin, and new guard is authored, committed, and observed RED before its implementation phase.

## Scope decision (user-confirmed)

- **Framing — MEGAPLAN V31**: full ritual — `MEGAPLAN_V31_{PLAN,FINDINGS,LEDGER,DEFERRED}.md` at docs/ root, `pre-megaplan-v31` restore tag, per-commit ledger, BACKLOG fold at close-out, V30 set archives atomically with the V31 scaffold.
- **Idea families — all four in scope**: **C** combat canon, **D** design heuristics, **S** strategy & AI depth, **M** meta systems.
- **Adjudication — flag for user**: every canon-vs-code conflict becomes a `DECISION-NEEDED` entry in FINDINGS; user rules before implementation. No sim-evidence fiat, no canon fiat.
- **Corpus — distilled register only**: `docs/engineering/terrablood-canon-claims.md` carries one row per claim (article cited, verdict, evidence). Raw archive text is NOT committed — it is community lore, not developer canon.
- **New guards — one**: `canonClaims` (register coverage). Registers `LIVE_RATCHET` in `GUARD_REGISTRY`.

## Validation audit summary (pre-implementation, file:line verified)

Full table lives in FINDINGS §0. Key corrections vs the draft:

- `GUARD_REGISTRY` is a const in `src/test/testQualityAudit.test.ts:155`, not a registry file — new guards register `LIVE_RATCHET` (enforced at `:455`).
- V22-D3's correct damage-model entry points are `mechanics/damageCalc.ts` + `mechanics/weaponArmor.ts`; `resolution/` paths are stale per BACKLOG.
- Rival plan generation lives in `src/engine/ai/plan/` (`tacticAdvisor.ts`, `phasePlanner.ts`, `rivalPlan.ts`, `coreGenerator/`, `strategyValidator.ts`); `src/engine/strategy/` holds only `planBias.ts` + `tacticSuitability.ts`.
- Backlog §A is empty post-V30; the scheduled-report/`skillPathScan` breakage lives in §3 (watch items), pre-existing and unrelated to V31.
- V24-D5 (Bloodgames/modes) is a standing deferral with **no engine surface** — the archive's Bloodgames material can only land as backlog evidence, never V31 scope.
- V22-D3 / V22-D4 are each "own campaign" (V29 NO-GO reaffirmed) — V31 folds the archive's formulas as evidence rows only.
- V24-F4's missing `victor` state field + design decision is a seeded DECISION-NEEDED item; it blocks V24-F1's TV leg.
- V27-§5 knack surface is a "revisit on explicit canon push" deferral — the archive's luck-factor material **is** the push, so it legitimately re-opens.
- Existing `src/test/engine/combat/tacticSuitability.canon.test.ts` is the naming precedent — V31 canon specs use `*.canon.test.ts`.
- Prior §3 adjudication holds TP dominance canon-accurate (scum/TP metagame answer); the archive agrees — reused at the adjudication gate.

## Verified backlog couplings

| Item                                              | Status                                                                                                                           | V31 relationship                                                                                                |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| **V24-F4** TV challenge priority                  | Open — design decision + missing `victor`/`tournamentVictor` state                                                               | DECISION-NEEDED; blocks V24-F1's TV leg                                                                         |
| **V24-F1** Ordered challenge resolution           | Open — bloodfeud fast-path landed; strict ordering unbuilt. Entries: `promoters/offerMatchmaking.ts`, `matchmaking/bloodfeud.ts` | Prime implementation candidate pending F4                                                                       |
| **V22-D3** Pagan literal damage model             | Open — own campaign (V29 NO-GO)                                                                                                  | Evidence fold only: HP `3.75·CN+SZ+WL/2`, endurance `CN·WL+ST/10` / `ST+CN+WT/2+WL`, coordination `SP+DF` bands |
| **V22-D4** ADM/graduation tier                    | Open — own campaign                                                                                                              | Evidence fold only; `ATTRIBUTE_MAX` at `types/shared/attributes.ts:40`                                          |
| **V24-D5** Game modes                             | Standing deferral — no engine surface                                                                                            | Evidence fold only                                                                                              |
| **V27-§5** Knack/`luckfactor`/`bloodlust` surface | Design deferral — revisit on canon push                                                                                          | Canon push delivered → DECISION-NEEDED                                                                          |

## Phases

- **Phase 0** — scaffold (done at V31 open): tag, archive V30 set, `ARCHIVED_DOCS`, V31 doc set, `INDEX.md`.
- **Phase F** — canon-claims register + findings audit; `disputed` rows keep per-article conflicts.
- **Gate** — DECISION-NEEDED items presented to user via `ask_user_question`; verdicts recorded.
- **Phase T** — ALL specs/scanners/guards authored + RED-verified + LEDGER §3-logged **before ANY production edit**; `// V31 pin:` GREEN exception for preserved-behavior characterization pins.
- **Phase I** — implementation workstreams ordered by adjudication: **WS-A** combat canon (`combat-balance`/`combat-domain`; V22-D3 untouched) · **WS-B** design heuristics · **WS-C** strategy/AI (`ai/plan/`) · **WS-D** meta (V24-F1 pending F4, knack surface, skill-rank ladder).
- **Phase 6** — balance probes, batched seeded re-baseline, DEFERRED + BACKLOG fold.

## Verification matrix

`bun run test` + `type-check` + `lint` every phase (`type-check` includes `tsr generate` — check codegen drift first on failure); **Phase T gate = every spec observed RED (or pin-GREEN) before any production edit**; `bun run test:slow` for sim/balance/pipeline work; seeded-parity probe + single batched re-baseline; `testQualityAudit`/`megaplanDocLayout`/`docsLayout` green; `verify-implementation` pass before done.

## Risks

- **Contradictory community lore** — register keeps claims per-article (`disputed`); never flattened.
- **Anecdotal canon** — the DECISION-NEEDED gate is where bad canon gets rejected.
- **Scope couplings** — V22-D3/D4 and V24-D5 get evidence rows only; V31 never absorbs them.
- **Determinism** — rival-plan/archetype changes re-roll seeded streams; batch into one re-baseline phase.
- **Pre-existing nightly breakage** (§3 watch: GH006 push rejection + `skillPathScan` CI red on gitignored paths) — unrelated; noted in LEDGER if it persists.
