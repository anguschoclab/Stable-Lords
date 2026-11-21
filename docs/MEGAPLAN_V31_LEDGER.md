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
