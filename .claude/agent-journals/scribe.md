# Scribe Journal

Tracked memory for the `scribe` agent — see `.claude/agent-journals/README.md`.
Critical learnings only: systematic doc/code divergences, invariants discovered
the hard way, repo-specific doc conventions, claims that turned out false.

## 2026-11-22 - `bun test` ≠ `bun run test` — skill docs conflated them

**Gap:** `.claude/skills/combat-sim/SKILL.md` described itself (frontmatter +
intro) as running the combat suite "via bun test (Vitest)". Bare `bun test`
never runs Vitest here — `bun run test` = `bun x vitest run` (fast tier), while
`bun test --isolate` is the native-runner parity job `bun run test:bun`. The
skill's own Commands section already used `bun run test` correctly, so the
intro contradicted its own body.

**Truth:** Two test runners coexist: Vitest (`bun run test` / `test:slow` /
`test:all` / `test:coverage`) and the native bun runner (`bun run test:bun`,
the CI `bun-test` parity job). Any doc writing `bun test` where it means the
Vitest suite is wrong; `run-all-tests/SKILL.md` carries the canonical tier
table.

**Watch:** This exact phrasing was the example trap in scribe.md's own
pointers — worth re-grepping `bun test` in `.claude/skills/`,
`.claude/agents/`, and live `docs/` (non-archive) periodically; archive docs
and `.devin/plans/` keep verbatim mentions legitimately.
