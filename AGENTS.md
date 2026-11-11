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

## Docs layout (V28 taxonomy)

`docs/` is organized into fixed families:

| Dir | Contents |
| --- | --- |
| `docs/design/` | Canon specs (`stable-lords-*`) + UI-design docs — the in-game Help bible corpus (`bibleIndex.ts` globs only this dir) |
| `docs/engineering/` | Testing, RNG policy, pipeline, setup references + live audits |
| `docs/reports/` | Generated committed reports (daily sim, daily bard, orphan scan) |
| `docs/manual/` | Player-facing manual + images |
| `docs/archive/` | Frozen history — `megaplans/`, `audits/`, `summaries/`, `superpowers/` |

- `docs/` root carries only `INDEX.md` + megaplan protocol files (below).
- Repo root carries only `README.md` + `AGENTS.md` — no other `.md` files.
- Non-archive docs use **kebab-case** filenames; protocol names
  (`README.md`, `AGENTS.md`, `INDEX.md`, `MEGAPLAN_*`) are exempt.
  `docs/archive/` contents stay verbatim (frozen history).
- `docs/INDEX.md` catalogues every non-archive doc — keep it fresh.
- `src/test/megaplan/docsLayout.guard.test.ts` enforces all of this —
  update its allowlists deliberately when adding a new family.
- NB: `archives/` (plural, gitignored script output) ≠ `docs/archive/`
  (tracked). Never create `docs/archives/`.

## Megaplan docs

- Landed megaplans use **docs/ root** files per house convention:
  `docs/MEGAPLAN_V<N>_{PLAN,FINDINGS,LEDGER,DEFERRED}.md`. Only the **latest**
  version's set stays at docs/ root.
- When a newer megaplan closes, the prior set moves to
  `docs/archive/megaplans/` (git history preserved via `git mv`).
- `docs/MEGAPLAN_BACKLOG.md` is the living cross-version register of
  open deferred items, watch items, and house divergences — every megaplan
  close-out folds its leftovers there.
- `src/test/megaplan/megaplanDocLayout.guard.test.ts` enforces this layout —
  update its `ARCHIVED_DOCS` allowlist when archiving a new version.
