---
name: narrative-validate
description: Run narrative JSON validation and focused narration/gazette tests. Authoring contracts live in narrative-templates.
disable-model-invocation: true
---

# Narrative validation runner

Read `narrative-templates` for domain files, both token systems, production
context requirements, and isolated narration RNG. There is no monolithic
96KB narrativeContent.json archive to edit. The validator checks JSON structure,
bracket balance, exact duplicates, contamination, and required keys; it does
not prove every token is supplied by every production caller.

```bash
bun run narrative-validate
bun run test --reporter=verbose "src/test/engine/narrative/" "src/test/engine/gazette/"
```

For a supplied keyword, select a real file/directory first; `-t "pattern"`
filters test titles, not JSON tokens or event IDs. Verify token resolution at
its actual call site and assert rendered text contains no unresolved tokens.
See `offseason-event` for events and `orchestrate-narrative` for opt-in API
expansion; validation must never launch the paid expansion job.
