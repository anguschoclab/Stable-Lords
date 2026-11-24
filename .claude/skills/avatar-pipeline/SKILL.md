---
name: avatar-pipeline
description: Work on the avatar/portrait system — the deterministic seed→tags→catalog→entry selection chain, the public manifest contract, and the V32 portrait-pool art pipeline (generate/ingest/contact-sheet scripts). Use whenever touching src/engine/avatar, public/avatars/index.json, scripts/avatar-pool/, avatarSlice, recruit/WarriorBuilder avatar flows, or avatar rendering — covers hash-derived seeds, role/gender/age/clothing tag filtering with graceful fallback, the "populated portraits satisfy the manifest" rule, and the resumable Gemini ledger workflow.
---

# Avatar Pipeline Domain

Two lanes: **selection** (deterministic, runs in-app) and **art production**
(batch scripts, runs offline). They meet only at `public/avatars/index.json`.

## Selection — `src/engine/avatar/`

- `seedForEntity(entityType, entityId)` = `hashStr("type:id")` — a stable
  identity-derived seed. Renaming entity type or id changes every pick.
- `avatarGenerator.ts` — `pickGender` (forcedGender > gender > seed roll ~45/45/
  10), `pickAgeGroup` (±1 bracket jitter ~10%), `clothingCategoryForStyle`,
  `wearScore`/`avatarDescription` (age+kills+injuries+fame → scar titles).
- **Tag filtering:** build the role pool first (`entry.tags.includes(role)` —
  use the `Set` form for perf), then forced matches; **the role pool falls back
  to all entries when empty** — underfilled cells degrade gracefully, never
  throw. `pickEntry` throws only on a truly empty catalog slice.
- `avatarGender.ts` (`src/utils/`) — gender derived from `avatarSeed` for
  entities that carry only a seed (recruit custom-create path).
- Catalog (`avatarCatalog.ts`): `loadAvatarCatalog` fetches the manifest,
  `setAvatarCatalog` injects for tests. **V32 rule:** a populated `portraits`
  category satisfies the manifest on its own — legacy layer categories
  (base/skinTone/eyes/…) are required only when portraits are absent.
- Store: `avatarSlice`; rendering: `src/components/avatar/` (`AvatarForEntity`);
  creation flows: `src/components/WarriorBuilder`, recruit `customCreate`.

## Art production — `scripts/avatar-pool/`

```bash
DRY_RUN=true bun run avatar:generate   # spec-ledger only, no API calls
bun run avatar:generate                # Gemini portraits (needs GEMINI_API_KEY)
bun run avatar:ingest                  # sharp → 256px webp + manifest merge + coverage report
bun run avatar:sheet                   # contact-sheet.png for visual QA
```

- `generate.ts` — deterministic spec matrix (`planMatrix.ts` →
  `spec-ledger.json`), resumable (completed ids skipped), env:
  `GEMINI_API_KEY`, `AVATAR_IMAGE_MODEL`, `AVATAR_POOL_COUNT`,
  `AVATAR_POOL_SEED`, `AVATAR_POOL_LIMIT`.
- `ingest.ts` — transcodes `out/raw/*.png` → `public/avatars/portraits/*.webp`
  (256², q82), rewrites `manifest.categories.portraits` from the ledger, prints
  per-cell coverage (flags cells <3 → re-run with a focused LIMIT).
- Art outputs live under `scripts/avatar-pool/out/` and `public/avatars/` —
  don't hand-edit the manifest portraits list; it is regenerated from the
  ledger.

## Traps

- Every selection draw consumes seeded RNG — changing pool sizes or draw order
  shifts downstream picks (`determinism-debug`).
- Signing a recruit must preserve the pool warrior's avatar metadata
  (avatarSeed/gender/traits) — parity is spec-pinned in `recruitment` tests;
  don't re-roll on sign.
- `AvatarGender`/tags come from `src/types/avatar.types.ts` — keep the catalog
  tag vocabulary (genders/ages/roles in `ingest.ts`) in sync.

## Verify

```bash
bun run test --reporter=verbose "src/test/engine/avatar/" "src/test/state/avatarSlice.test.ts" "src/test/state/serialization.test.ts" "src/test/scripts/avatarPoolPlanMatrix.test.ts" "src/test/components/avatar/"
```
