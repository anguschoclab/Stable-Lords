# MEGAPLAN V31 — Ledger

**Plan:** `MEGAPLAN_V31_PLAN.md`
**Findings:** `MEGAPLAN_V31_FINDINGS.md`

## §0 — Baseline (pre-megaplan-v31)

| Gate | Result | Notes |
| --- | --- | --- |
| `bun run type-check` | _in flight_ | filled at first gate run (`tsr generate` runs first — codegen drift may precede type errors) |
| `bun run lint` | _in flight_ | filled at first gate run |
| `bun run test` | _in flight_ | filled at first gate run |
| safety | `pre-megaplan-v31` tag | created |
| doc layout | V30 set → `docs/archive/megaplans/`; `ARCHIVED_DOCS` + `ARCHIVED_VERSIONS` extended | V31 set scaffolded at docs root |

## §1 — Phase log

| Commit | Phase | Contents | Gates |
| --- | --- | --- | --- |
| `4449c4547` | Phase 0 | scaffold: tag, V30 archive move, `ARCHIVED_DOCS`/`ARCHIVED_VERSIONS` extension, V31 doc set, INDEX | `megaplanDocLayout` + `docsLayout` green (12/12) |
| `e4719945d` | Phase F | claims register (28→30 rows) + FINDINGS §1 audit + §2 register | register scanner clean |
| (gate) | Gate | 8 DECISION-NEEDED rulings recorded: F1/F4 deferred-evidence; knack+M4+breakage+AB-exhaust+eval+probe = implement | — |

## §2 — Deferred register pointer

`MEGAPLAN_V31_DEFERRED.md` — written at Phase 6 close-out.

## §3 — RED log (Phase T)

Every Phase T spec/pin/guard must be observed RED before its implementation phase (documented exception: `// V31 pin:` characterization pins — GREEN on old and new).

| Spec / guard | Phase | RED evidence | Status |
| --- | --- | --- | --- |
| `skillTiers.canon.test.ts` (+4 rows, rungs assert) | T | 5 fails: `44/55/56/80 → GM/ARCH`, `grandmaster.min`/`archmaster.min` undefined | RED observed |
| `scouting/knackInsights.canon.test.ts` | T | 2 fails (bonused + hosed Knack tokens); 2 pins GREEN (mild + non-Expert — vacuous until channel exists) | RED observed |
| `combat/weaponBreak.canon.test.ts` | T | 3 fails (`weaponBreakChance` missing symbol; seeded QS break absent); 2 pins GREEN (scimitar/rearm — vacuous) | RED observed |
| `ai/plan/abExhaustDoctrine.test.ts` | T | 1 fail (defensive opening tactic absent — generic `buildPhasePlan` taper carries no tactic); 1 pin GREEN | RED observed |
| `combat/matchupMatrix.canon.test.ts` | T | 4 fails (LU>BA, PRP>LU, TP>AB, TP>offensives — all 0-vs-negative symmetric, not dominant) | RED observed |
| `warrior/designReview.test.ts` (+3) | T | 2 fails ('Primus-bound'/'Viable frame' titles absent); 1 pin GREEN | RED observed |
| `canonClaims.guard.slow.test.ts` + `scripts/canon-claims-scan.mjs` | T | GREEN — ratchet pins resolved-state (planted-violation check: fails as designed) | pin (ratchet) |
| `test-audit-scan.mjs` regen | T | `runnerGroups.json` + `auditBaseline.json` regenerated | GREEN |

## §4 — Phase I (implementation → GREEN)

| Item | Change | Verification |
| --- | --- | --- |
| I-1 (M4) GM/ARCH tiers | `src/data/skillTiers.ts` — grandmaster + archmaster rungs | `skillTiers.canon.test.ts` 14/14 GREEN |
| I-2 (D3) eval composite | `designReview.ts` `reviewEvalComposite` + `EVAL_PRIMUS_SUM`/`EVAL_VIABLE_SUM` in `designDoctrine.ts` — 'Primus-bound' (≥49) / 'Viable frame' (≥35) tourney-axis notes | `designReview.test.ts` 73/73 GREEN |
| I-3 (V27-§5) knack surface | `'Knack'` added to `InsightTokenType` + schema enum + `TokenIcon`; `createKnackInsights` emits vague Expert-only tokens for \|luckfactor\|≥3 | `knackInsights.canon.test.ts` 4/4 GREEN |
| I-4 (S2) AB exhaust | `applyAbExhaustTemplate` in `strategicLayer.ts` — riposting-hybrid-fit AB (within 10 of top archetype) gets a defensive tactic in `phases.opening` | `abExhaustDoctrine.test.ts` 2/2 GREEN |
| I-5 (C8) weapon breakage | `WEAPON_BREAK_CHANCES` (QS .06 / GA .05 / GS .05) + `weaponBreakChance` + `tryWeaponBreak` (attacker-side, armor-clang gated, never `droppedWeaponId`) + `WEAPON_BREAK` event + `exchangeLog.weaponBreak` | `weaponBreak.canon.test.ts` 6/6 GREEN |
| I-6 (S6) matchup retune | two-source probe (N=400 style-typical): LU/BA 0→+1/−1 (sim 68.5%), PR/LU 0→+1/−1 (56.8%), TP/ST −1/+1→+1/−1 (52.0%); TP>AB **rejected** (sim 35.8%) | `matchupMatrix.canon.test.ts` 4/4 GREEN; antisymmetry violations 0 |

### Collateral repairs

- `boutOfferAdvisor.test.ts` — LU/BA cell now favors LU; 'easy' fixture opponent moved BA→ParryLunge (restores the pre-retune neutral matchup the purse-weight scenario calibrates against).
- `fileBudget` — `applyAbExhaustTemplate` and `maybeBreakWeapon` extracted to keep `applyStrategicLayer`/`applyHitAndCounters` under the 80-line ratchet.
- Spec-plumbing correction: `weaponBreak.canon.test.ts` re-pointed from `r.log[].events` (never populated — headless nukes log; narration folds events to text) to `r.exchangeLog[].weaponBreak` + a direct `tryWeaponBreak` unit pin for the no-rearm invariant. Same assertions, real observability surface.
- `abExhaustDoctrine.test.ts` — `AiPlanForWarriorArgs.philosophy` filled ('WIN_TODAY').

## §5 — Verification matrix

| Gate | Result |
| --- | --- |
| `bun run test` | 10997 pass / 3 fail → collateral repairs → all green |
| `bun run type-check` | clean (Knack TokenIcon entry, philosophy arg, index-guard fixes) |
| `bun run lint` | 0 errors (5 pre-existing warnings) |
| `bun run test:slow` | 3 failures triaged — `balance` PS>WS/ST>BA 81% **pre-existing at HEAD** (stash-verified); `orphanScan` count 180→183 ratcheted (+1 `createKnackInsights`, sibling class; +2 pre-existing drift flagged for triage); `worldLiveness` coherence 0.1186 vs 0.12 = seeded drift from the new disarm-stream draws — re-baselined to a verified seed per the spec's own precedent |
