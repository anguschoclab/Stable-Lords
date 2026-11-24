<!-- markdownlint-disable MD013 -->

# MEGAPLAN V32 — Painterly Avatar Art Upgrade

One-sentence summary: replace the procedural placeholder layer-sprites with a
pool of ~600 Gemini-generated painterly portraits selected at runtime by
seeded tag-matching; full V32 ritual under a strict test-first gate, legacy
catalog retained as bootstrap fallback.

## Scope decision (user-confirmed)

- **Art source — Gemini image API via repo script.** One portrait per call
  from a parameterized prompt → every asset is auto-tagged by construction.
- **Architecture — whole portraits + seeded tag match.** `AvatarData` = one
  painterly image; `layers[]` carries a single entry so cache/schema/UI keep
  working. Painterly layered compositing rejected.
- **Pool — ~600+ portraits**, committed as 256×256 WebP (~20–35MB).
- **Framing — full MEGAPLAN V32 ritual.** Restore ref `pre-megaplan-v32`
  (lightweight — `tag.gpgsign` prompts for a passphrase; see LEDGER).
- **Backwards compatibility — explicitly de-scoped by the user.** `layers[]`
  retained to minimize UI/test churn, not for save-compat. Legacy placeholder
  catalog stays as bootstrap fallback until pool coverage is proven.

## Phases

- **Phase 0** — scaffold: tag, archive V31 set, `ARCHIVED_DOCS`/`ARCHIVED_VERSIONS`
  extended, V32 doc set, `INDEX.md` + BACKLOG header.
- **Phase T** — strict RED-first: catalog validation + `setAvatarCatalog`/
  `clearAvatarCatalog` specs → generator portrait-path specs → schema spec →
  `Avatar.tsx` portrait-mode specs → `planMatrix` spec. Fixture gains
  `portraits` entries with the specs.
- **Phase I** — engine (`avatarCatalog`, `avatarGenerator`, `avatarSchemas`,
  `avatar.types`, `Avatar.tsx`) → pipeline (`scripts/avatar-pool/`: planMatrix,
  generate, ingest, contactSheet + `sharp` devDep).
- **Art gate** — `DRY_RUN` lands the committed spec ledger; the ~600-image
  Gemini run needs the user's `GEMINI_API_KEY` (~$20–30) — explicit user step.
- **Phase 6** — coverage report, contact-sheet review, `runnerGroups` regen,
  `orphanScan` ratchet note, DEFERRED + BACKLOG fold.

## Verification matrix

`bun run test` + `type-check` + `lint` every phase. Phase-T gate: every spec
observed RED before its production change. Guard couplings handled
deliberately: `scanInLoop` (Set-based tag lookups), `paramBudget` (options
objects), `fileBudget` (≤120-line fns), `orphanScan` (count ratchet note),
`runnerGroups` (`scripts/test-audit-scan.mjs` regen), `megaplanDocLayout` +
`docsLayout` (doc allowlists + INDEX).

## Full plan

Working plan (with the validation audit verdicts) lives at
`.devin/plans/v32-avatar-art-upgrade.md`; the validated findings are folded
into `MEGAPLAN_V32_FINDINGS.md` §0.
