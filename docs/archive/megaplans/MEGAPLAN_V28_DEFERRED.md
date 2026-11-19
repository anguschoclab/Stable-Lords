# MEGAPLAN V28 — Deferred scope

Items consciously deferred at close-out. Watch items fold into
`MEGAPLAN_BACKLOG.md` §2.

## Deferred

- **markdownlint CI adoption** — `MEGAPLAN_BACKLOG.md` and the master design
  bible carry vestigial `markdownlint-disable` comments, but no
  `.markdownlint*` config exists and no lint step runs over markdown. If
  markdown linting is ever adopted, `docsLayout` is the natural gate to
  extend; until then the disable comments stay as inert documentation.
- **`docs/archive/` kebab-case rename** — the ~100 archived lineage files
  keep their original names verbatim (frozen audit records; the
  `ARCHIVED_DOCS` allowlist in `megaplanDocLayout.guard.test.ts` pins them
  literally). Exempt from the kebab ratchet by design.
- **`snap.json` (14MB) at repo root** — large generated artifact outside the
  docs scope; flagged as an observation only.
- **Chromium E2E smoke of the narrowed bible corpus** — `bibleIndex.test.ts`
  asserts the corpus boundary (design docs only + no admin-doc ids); a live
  Help-page click-through wasn't run. The glob is a path constant — low
  residual risk.

## Watch items (folded to `MEGAPLAN_BACKLOG.md` §2)

- **First scheduled `daily_sim`/`daily_bard` run post-merge** — verify
  `git add docs/reports/*` lands the regenerated reports and no root-level
  `Daily_*` files resurrect.
- **`tacticDiscovery.parity.test.ts` suite-load flake** — passed standalone
  post-change; failure signature matches the registered "slow-suite flakes
  under load" pattern. Pre-existing, not V28-caused.
