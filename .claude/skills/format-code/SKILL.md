---
name: format-code
description: Runs Prettier to format code consistently
disable-model-invocation: true
---

Run Prettier across the codebase (from the repository root):

```bash
bun run format                 # prettier --write . — fixes everything it touches
bunx prettier --check .        # verify only (exits non-zero on unformatted files)
bunx prettier --check "<path>" # scope the check to changed files
```

Covers TypeScript, TSX, JSON, CSS, and Markdown — including `.claude/skills`
docs. There is no `format:check` script; use `bunx prettier --check`.
