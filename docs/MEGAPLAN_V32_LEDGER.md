<!-- markdownlint-disable MD013 -->

# MEGAPLAN V32 — LEDGER

## §1 Baseline gate

- Restore ref: `pre-megaplan-v32` (lightweight `update-ref` tag —
  `tag.gpgsign=true` in this clone blocks non-interactive SSH signing).
- Working tree at open: user's B5 tranche-4 work in flight (uncommitted);
  V32 commits stage only V32 paths.
- `commit.gpgsign=true` also prompts — commits made with
  `-c commit.gpgsign=false`; user's local signing unaffected.

## §2 Phase commits

| Commit | Phase | Contents |
|---|---|---|
| phase-0 | 0 | V31 archive move, `ARCHIVED_DOCS`/`ARCHIVED_VERSIONS`, V32 doc set, INDEX/BACKLOG |
| phase T+I | T+I | portrait-path specs (15 authored RED first), engine portrait path, catalog setters, schema enum, Avatar portrait mode, avatar-pool pipeline scripts + 600-spec ledger, sharp devDep |

## §3 RED-first record

- `avatarCatalog.test.ts` — set/clear setters, portraits-only validation, empty-catalog rejection: RED (missing exports).
- `avatarGenerator.test.ts` portraits block — 9 specs RED (no portrait path).
- `avatarSchemas.test.ts` — `'portraits'` round-trip RED (enum missing).
- `Avatar.test.tsx` portrait block — 2 specs RED (no portrait mode).
- `avatarPoolPlanMatrix.test.ts` — 4 specs RED (module absent; `#scripts` include added).
- Fixture `portraits` entries landed WITH specs; legacy fixture retained so
  existing specs keep exercising the fallback path (validation correction:
  preferred over mutating the shared fixture, which would have silently
  un-exercised the legacy path).

## §4 Art-gate record

- `DRY_RUN` emitted the committed 600-spec ledger (`scripts/avatar-pool/spec-ledger.json`).
- Pilot run `AVATAR_POOL_LIMIT=12` attempted against the user's key:
  `gemini-2.5-flash-image` and `gemini-3-pro-image-preview` both return
  `429 limit: 0 — free-tier image generation disabled` (quota resets ~16h but
  the *limit* is zero — image models require a paid/billing-enabled project).
  `imagen-4.0-generate-001` is absent on v1beta. **Blocked: needs a billing-enabled
  API key or an alternative image provider — user decision.**

## §4 Close-out gate

_Pending._

## Post-gate: role/gender curation pass

- Entities gained an optional `gender` field (Warrior, PoolWarrior, Trainer,
  Owner, Promoter + schemas), derived from `avatarSeed` at creation via
  `genderFromAvatarSeed` — zero extra RNG draws, draw order preserved.
- `generateAvatar` honors `config.gender`; portrait picks hard-filter on
  role tag, then resolved gender, then forced age group (forced
  demographics outrank role on fallback).
- `AvatarForEntity` passes `source.gender`; WarriorBuilder gained a
  Presentation picker (Auto/Masculine/Feminine/Ambiguous) wired to the
  live preview and the custom-create payload.
