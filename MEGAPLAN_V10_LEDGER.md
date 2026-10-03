# MEGAPLAN V10 LEDGER

## Baseline

- **Branch:** `main`
- **Restore tag:** `pre-megaplan-v10` (at `49dc1ee8`)
- **Baseline gates (re-run at start):**
  - `type-check`: ✅ pass
  - `eslint .`: ✅ 0 errors
  - `bun x vitest run`: ✅ 748 files, 8515 tests passed, 2 skipped
  - `bun run test:bun`: ✅ green
  - `bun run narrative-validate`: ✅ green

## Consolidation summary

| PR | Disposition | Key commits |
| --- | --- | --- |
| #1017 | **REJECTED** (title/body false; pure churn) | — |
| #1018 | **LANDED (curated)** | `35f37fee` |
| #1019 | **LANDED (curated, repaired)** | `35f37fee` (supplied missing constants) |
| #1020 | **LANDED (curated)** | `15ddfe62` |
| #1021 | **LANDED (curated)** | `95a70de7` |
| #1022 | **LANDED (near-verbatim)** | `31ea7930` |
| `narrative-content-expansion-1450…` | **DELETE** (superseded) | — |
| `bolt/optimize-useshallow` | **DELETE** (empty obsolete) | — |
| `wip/living-rival-world` | **SALVAGE then DELETE** | `b8ceda9d`, `c34ea89e` |

## Bugs fixed with failing evidence

| ID | Bug | Evidence | Fix commit |
| --- | --- | --- | --- |
| B-V10-1 | `falling_debris` event impossible to host | New orphan-event invariant: no registered arena had both `ruins` and `indoor` tags. | `35f37fee` |
| B-V10-2 | `hollow_gaze` duplicate of `cornered_rat` | Canonical `effectHash` found identical `{attModLate, defModLate}`. | `f7f6195a` |
| B-V10-3 | `orphan_street_rat` duplicate of `gallows_humor` | Canonical `effectHash` found identical `{decMod, defModLate}`. | `f7f6195a` |
| B-V10-4 | `rust_blooded` duplicate of `iron_vein` core effect | Canonical `effectHash` found identical `{defMod, enduranceMult:0.9}`. | `f7f6195a` |

## Final gate matrix

Pending coverage and e2e runs — see MEGAPLAN_V10_FINDINGS.md §5 for live updates.

| Gate | Result | Counts |
| --- | --- | --- |
| type-check | ✅ | `bun run type-check` exit 0 |
| lint | ✅ | `eslint .` 0 errors |
| Vitest default | ✅ | 752 files, 8577 passed, 2 skipped |
| Bun test (sharded) | ✅ | All shards pass |
| Vite build | ✅ | `bun run build` exit 0 |
| Electron compile | ✅ | `bun run electron:compile` exit 0 |
| Narrative validate | ✅ | no errors |
| Vitest slow suite | ✅ | 28 files, 188 tests passed |
| Coverage vitest | ✅ | `bun x vitest run --coverage --reporter=dot` green |
| Playwright e2e | ⚠️ | 3/4 local specs green; `seasonal-tournament.spec.ts` fails identically on `pre-megaplan-v10` → pre-existing local flake |
| CI 9-job matrix | ⏳ | pending after push |
| UI-audit | ✅ | 0 hits |
| Orphan-scan | ✅ | 0 unreachable pages |
| Data-array-dup-scan | ✅ | clean |
| Test-audit | ⚠️ | only pre-existing `tacticsAdvisorBridge.test.ts` JSDOM pragma flag |

## Cleanup log

| Branch | Action | Status |
| --- | --- | --- |
| #1017–#1022 PR branches | `gh pr close` + `git push origin --delete` | pending |
| `narrative-content-expansion-1450…` | `git push origin --delete` | pending |
| `bolt/optimize-useshallow` | `git push origin --delete` | pending |
| `wip/living-rival-world` | `git branch -D` after salvage verification | pending |

## Notes

- Roster cap repin: actual registered arena count = 53; caps set to
  `{TOTAL_CAP:54, TIER_CAPS:{1:12,2:25,3:17}}` as ceilings.
- `ARENA_EVENTS` remains dormant v2 config — no production consumers found.
- Test-first discipline enforced: every integration unit has a `test:` commit
  before the corresponding `feat:`/`fix:`/`refactor:` commit.
