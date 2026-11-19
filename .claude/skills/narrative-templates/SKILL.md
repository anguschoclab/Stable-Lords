---
name: narrative-templates
description: Add or edit Stable Lords narrative content safely — the src/data/narrative/*.json domain files (combatPbp, combatStrikes, combatKillText, combatConclusions, combatPassives, gazette, recruitment, offseason, announcer, uiMeta). Use whenever touching narrative JSON, adding {{token}} or %A-style placeholders, syncing the DOMAIN_FILES map, or running bard:daily expansion. Covers the validator contract (balanced {{}}, no dupes, no placeholder markers), the token-resolution layer in narrativePBPUtils.ts, mood tones, and the determinism caveat — a pool edit legitimately shifts every downstream seeded pick.
---

# Editing Narrative Templates

## Layout

Templates live in `src/data/narrative/*.json` — ten domain files: `combatPbp`,
`combatStrikes`, `combatKillText`, `combatConclusions`, `combatPassives`,
`gazette`, `recruitment`, `offseason`, `announcer`, `uiMeta`. They are merged
for the engine by `src/data/narrative/index.ts` via a `DOMAIN_FILES` map —
**the same map is duplicated in `scripts/daily_bard.ts`**; adding a file or a
new top-level key means updating both, or content silently drops.

## Two token systems

- **`{{token}}`** (Handlebars-style, lowercase): `{{attacker}}`, `{{defender}}`,
  `{{winner}}`, `{{loser}}`, `{{adj}}`… Resolved by
  `src/engine/narrative/narrativePBPUtils.ts` — a token is valid only where the
  production call site supplies that context; the resolver's job is to keep a
  raw `{{token}}` from ever leaking into play-by-play, but an unsupplied key is
  still a content bug at author time.
- **`%A %D %W %BP %H`** — canonical combat tokens (same resolver,
  `narrativePBPUtils.ts`). Legitimate; the validator deliberately never flags
  them.

So before adding a `{{foo}}`/`%X%` placeholder: find the production resolution
site for that template family and confirm the key is supplied. If it isn't,
either add it at the call site or don't use the token.

## The validator contract — `bun run narrative-validate`

`scripts/narrative_validate.ts` exits non-zero on:

- invalid JSON,
- **unbalanced `{{ }}` brackets** (per-string depth check),
- **duplicate entries** inside an array (exact-string match),
- **placeholder contamination** — `(Mock`, `TODO`, `FIXME`, `PLACEHOLDER`,
  `LOREM`, `XXX`, `TBD`,
- missing required top-level keys.

Run it after every narrative edit — it's the committed CI gate, and the
`narrative-validate` runner skill maps the test coverage around it
(`src/test/engine/narrative/`, `src/test/engine/gazette/`).

## Mood tones

Gazette/narration voice is tone-conditioned — Calm, Bloodthirsty, Theatrical,
Solemn, Festive — and tests exist per tone (`-t "Bloodthirsty"` etc.). New
template families should either be tone-tagged or deliberately neutral.

## offseason.json is special

It carries **game events**, not just text (`offseason_events` + `events`
top-level keys): `title`, a unique snake_case `effectType`, and `newsletter`
templates. The full data → type → handler → registry chain with its coverage +
determinism gates lives in the `offseason-event` skill — don't add events
here, add them there.

## Bulk expansion — `bun run bard:daily`

`scripts/daily_bard.ts` (Gemini; needs `GEMINI_API_KEY`) expands pools, splits
output back into the domain files per `DOMAIN_FILES`, and writes
`docs/reports/daily-bard-report.md`. Hand edits to `*.json` need only
`narrative-validate` + the domain tests.

## Determinism caveat

Narrative pools feed seeded picks. **Adding or removing an entry shifts every
downstream draw** — `offseasonDeterminism`/characterization tests will flag
it, and that's the suite working as designed (see `determinism-debug` §1).
What must stay true: narrators draw from the **isolated narration rng** so
narrated === headless outcomes hold — never let a narrator share the
mechanical stream.

## Verify

```bash
bun run narrative-validate
bun run test --reporter=verbose src/test/engine/narrative/ src/test/engine/gazette/
```
