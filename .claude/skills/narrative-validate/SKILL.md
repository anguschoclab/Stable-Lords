---
name: narrative-validate
description: Validate narrative system integrity including tag references, template structure, and generation across mood tones.
disable-model-invocation: true
---

# narrative-validate

Validates the Stable Lords narrative system for integrity, tag reference resolution, and template structure.

## Usage

```
/narrative-validate [filter]
```

## Test Groups

| Filter keyword | What it targets |
|----------------|----------------|
| (none) | All narrative validation tests |
| combat | src/test/engine/narrative/combatNarrator.test.ts |
| gazette | src/test/engine/gazetteNarrative.test.ts + src/test/engine/gazetteDetections.test.ts |
| status | src/test/engine/narrative/statusNarrator.test.ts |
| bout | src/test/engine/narrative/boutNarrator.test.ts |
| template | src/test/engine/narrative/narrativeTemplateEngine.test.ts |
| archive | scripts/validateNarrativeArchive.ts (tag reference validation) |

## Commands

**Run all narrative tests:**
```bash
bun run test --reporter=verbose src/test/engine/narrative/ src/test/engine/gazetteNarrative.test.ts src/test/engine/gazetteDetections.test.ts
```

**Run with a filter (e.g. /narrative-validate combat):**
```bash
bun run test --reporter=verbose -- <filter>
```

**Run narrative archive validation (tag reference check):**
```bash
bun scripts/validateNarrativeArchive.ts
```

**Run specific mood tone validation:**
```bash
bun run test --reporter=verbose -t "mood.*Calm"
bun run test --reporter=verbose -t "mood.*Bloodthirsty"
```

## Notes

- Narrative archive (narrativeContent.json) is 96KB with complex template structure
- Tag references use {{TAG}} syntax that must resolve to dictionary entries
- Mood tones affect narrative voice: Calm, Bloodthirsty, Theatrical, Solemn, Festive
- The validateNarrativeArchive script exits non-zero on failure for CI/CD gating
- Narrative generation tests cover combat narration, gazette stories, status updates, and bout summaries
