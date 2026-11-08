# Stable Lords — Agent Conventions

## Plan files

All session plans and MEGAPLAN drafts live **in the repo** at `.devin/plans/`.
- Write plan files with the `write` tool directly to `.devin/plans/<name>.md`
  (NOT `~/.devin/plans/` — that location is deprecated; it was migrated
  2026-11-08).
- The `write_plan` tool writes to the home directory by default — if it is
  used, immediately mirror the file into `.devin/plans/` and treat the repo
  copy as authoritative.
- Landed megaplans keep their own files at repo root per house convention
  (`MEGAPLAN_V<N>_{PLAN,FINDINGS,LEDGER}.md`); the `.devin/plans/` folder is
  for in-progress session plans.
