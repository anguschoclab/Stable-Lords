# Stable Lords — Agent Conventions

## Plan files

All session plans and MEGAPLAN drafts live **in the repo** at `.devin/plans/`.

- Write plan files with the `write` tool directly to `.devin/plans/<name>.md`
  (NOT `~/.devin/plans/` — that location is deprecated; it was migrated
  2026-11-08).
- The `write_plan` tool writes to the home directory by default — if it is
  used, immediately mirror the file into `.devin/plans/` and treat the repo
  copy as authoritative.
- Stale session plans sweep to `.devin/plans/archive/`; `.devin/plans/` top
  level is for in-progress work only.

## Megaplan docs

- Landed megaplans use root-level files per house convention:
  `MEGAPLAN_V<N>_{PLAN,FINDINGS,LEDGER,DEFERRED}.md`. Only the **latest**
  version's set stays at repo root.
- When a newer megaplan closes, the prior set moves to
  `docs/archive/megaplans/` (git history preserved via `git mv`).
- `MEGAPLAN_BACKLOG.md` at root is the living cross-version register of
  open deferred items, watch items, and house divergences — every megaplan
  close-out folds its leftovers there.
- `src/test/megaplan/megaplanDocLayout.guard.test.ts` enforces this layout —
  update its `ARCHIVED_DOCS` allowlist when archiving a new version.
