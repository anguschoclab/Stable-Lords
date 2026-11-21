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
| — | Phase 0 | scaffold: tag, V30 archive move, allowlist extension, V31 doc set | _in flight_ |

## §2 — Deferred register pointer

`MEGAPLAN_V31_DEFERRED.md` — written at Phase 6 close-out.

## §3 — RED log (Phase T)

Every Phase T spec/pin/guard must be observed RED before its implementation phase (documented exception: `// V31 pin:` characterization pins — GREEN on old and new).

| Spec / guard | Phase | RED evidence | Status |
| --- | --- | --- | --- |
| — | _filled in Phase T_ | — | — |
