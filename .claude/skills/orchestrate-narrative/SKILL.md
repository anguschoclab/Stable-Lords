---
name: orchestrate-narrative
description: Runs the Gemini-backed narrative content expansion (daily bard)
disable-model-invocation: true
---

Run the narrative expansion job to grow dynamic content pools (from the
repository root):

```bash
bun run bard:daily        # scripts/daily_bard.ts
```

It reads the merged `src/data/narrative/*.json` domain files per its
`DOMAIN_FILES` map (kept in sync with `src/data/narrative/index.ts`),
generates expanded content, splits it back into the domain files, and writes
`docs/reports/daily-bard-report.md`.

**Requires `GEMINI_API_KEY`:**

```bash
export GEMINI_API_KEY=your-api-key-here
bun run bard:daily
```

After a run, verify with `bun run narrative-validate` — see the
`narrative-templates` skill for the token/domain contract.
