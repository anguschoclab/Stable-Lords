# Agent Journals

Tracked memory for the agents in `.claude/agents/` — one file per agent
(`bard.md`, `bolt.md`, `scout.md`, …), appended by that agent at the end of a
session and read at the start of the next.

## Rules

- **Critical learnings only.** Each agent's file defines what qualifies —
  codebase-specific traps, rejected approaches, discovered invariants. Routine
  work ("added 5 templates", "fixed a test") does not get journaled.
- **Append-only, dated.** Entries use `## YYYY-MM-DD - [Title]` followed by the
  agent's own field structure (Discovery/Rule/Check, Finding/Learning/Rule,
  etc. — see each agent file for its format).
- **Committed with the work.** A journal entry lands in the same commit as the
  change it records.
- **Do not move this directory into `docs/`** — the docs taxonomy is
  guard-enforced (`src/test/megaplan/docsLayout.guard.test.ts`); agent memory
  lives here, next to the agents that own it.
