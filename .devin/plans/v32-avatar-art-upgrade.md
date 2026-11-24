# MEGAPLAN V32 — Painterly Avatar Art Upgrade (validated draft)

Replace the procedural placeholder layer-sprites with a pool of ~600 Gemini-generated painterly portraits, selected at runtime by seeded tag-matching; executed as a full MEGAPLAN V32 ritual under a strict test-first gate, with the legacy catalog retained as a bootstrap fallback.

## Scope decision (user-confirmed)

- **Art source — Gemini image API via repo script.** `GEMINI_API_KEY` plumbing already exists (`scripts/daily_bard.ts:139-141`, `.env.example`, `@google/generative-ai@0.24.1`). One portrait per call from a **parameterized prompt** → every asset is auto-tagged *by construction*.
- **Architecture — whole portraits + seeded tag match.** Each `AvatarData` = one painterly image; `layers[]` carries a single entry so `avatarCache`, serialization, `Avatar.tsx`, reroll, `WarriorNameAvatar` keep working. Painterly layered compositing rejected (models can't emit pixel-aligned transparent layers).
- **Pool — ~600+ portraits**, committed as 256×256 WebP (~20–35MB).
- **Framing — full MEGAPLAN V32 ritual**: `docs/MEGAPLAN_V32_{PLAN,FINDINGS,LEDGER,DEFERRED}.md`, `pre-megaplan-v32` tag, per-commit ledger, V31 set archived, BACKLOG fold at close-out.
- **Backwards compatibility — explicitly de-scoped by the user.** Old saves need not load; the `layers[]` shape is retained only because it minimizes UI/test churn, not for save-compat. The **legacy placeholder catalog stays as a bootstrap fallback** until pool coverage is proven (a coverage safeguard, not a migration contract).

## Validation audit — verdicts

### Confirmed (draft claims verified against code)

- `avatarGenerator.ts:18-255` — deterministic `SeededRNG` on `config.seed ?? seedForEntity(entityType, entityId)`; wear/markings/style-tag logic as described. ✓
- `avatarCatalog.ts` — fetches `/avatars/index.json`, module-level `cachedCatalog`, validates 7 required categories. ✓
- `Avatar.tsx` — stacked `<img>`s, `imageRendering:'pixelated'`, `hue-rotate` tints; :18-19 comment already flags placeholder art. ✓
- `scripts/generate-placeholder-avatars.ts` — pure-code PNG writer; header: sprites "are meant to be replaced by real pixel-art later." ✓
- `setup.node.ts` stubs `fetch` → `createTestAvatarCatalog()` in BOTH projects; pinned by `testSuiteAudit` MEGAPLAN-A5. ✓
- `avatarSchemas.ts` — `AvatarLayerCategorySchema` enum lacks `'portraits'`; `gameStateSchema.ts:225` persists `avatarCache: z.record(AvatarDataSchema)` inside a `.strict()` schema. ✓
- `avatarSeed` persisted: `warriorFactory.ts:88`, `generate.ts:149,208`, `signWarrior.ts:174`, `orphanPool.ts:110`; trainer copies it (`avatarLifecycle.test.ts` pin). ✓
- Entity scale: `BASE_ROSTER_CAP=10`, `INITIAL_RIVAL_COUNT=8`, `RECRUIT_POOL_MIN=20` → a few hundred portrait-bearing entities per campaign. ✓
- `useBuilderAvatar` calls `generateAvatar` directly → WarriorBuilder preview gets portraits automatically. ✓
- `rosterSlice` purges `avatarCache` on death/retire/release; `impacts/warriors.ts:25-29` invalidates on age-group transition — both stay correct under portrait mode (regeneration re-picks with new age tags). ✓

### Corrections folded into the plan

1. **Schema ordering constraint (was unstated):** `gameStateSchema` parses `avatarCache` through `AvatarDataSchema` inside `.strict()`. Any state containing a `'portraits'` layer fails deserialization until the enum is extended → **schema change must land in the same commit as (or before) the generator change**, and the Phase-T schema spec is authored RED first.
2. **`moduleCacheRegistry.test.ts:53` comment is STALE** — it documents `avatarCatalog.ts:cachedCatalog` as "resettable via setAvatarCatalog/clearAvatarCatalog", which do not exist. Plan adds these two exports (gives tests a direct injection path that doesn't rely on the global fetch stub, and makes the registry doc truthful).
3. **`runnerGroups.json` is generated** by `scripts/test-audit-scan.mjs` and diffed by `testQualityAudit` — new test files that need isolation (e.g., anything stubbing globals) require a regen step; added to Phase I/6.
4. **`scanInLoop.guard.test.ts`** allowlists per-file `entry.tags.includes(tag)` patterns in `avatarCatalog.ts`/`avatarGenerator.ts`. New scoring code must use **Set-based tag lookups** (preferred — no allowlist churn) or deliberate allowlist entries.
5. **`paramBudget.guard`** enforces ≤5 params with destructured bindings counting — new code follows the `FacialHairContext` options-object convention. **`fileBudget.test.ts`** ceilings: 1600 src / 120 fn lines — scripts stay under.
6. **`orphanScan.guard.slow.test.ts`** is a count ratchet — new exports (catalog setters, scoring helpers, pool-script functions) need a deliberate ratchet note in the ledger.
7. **`Avatar.test.tsx` pins `imageRendering:'pixelated'`** — portrait mode must be conditional (single-portrait layers render smoothly, legacy stacks stay pixelated); spec update scheduled.
8. **`seededId.guard`** — all engine + spec-generation randomness must come from `SeededRNG`; `planMatrix` uses a fixed seed → committed spec list is reproducible. (`generate.ts` itself is a maintainer script outside seeded paths.)
9. **`src/test/scripts/` is the mirror home for script specs** — `planMatrix` spec files live there per mirror-tree rules.
10. **Docs guards**: `docsLayout.guard` exempts `MEGAPLAN_V<N>_*` at docs root ✓; `INDEX.md` must catalogue the V32 set; `megaplanDocLayout.guard`'s `ARCHIVED_DOCS` allowlist (:27) must gain the V31 paths when archived.
11. **WebP transcode needs `sharp`** — no image encoder exists in the repo (checked package.json); added as devDependency. PIL exists on this machine but scripts must stay portable.
12. **`AvatarForEntity.test` pins cached multi-layer rendering** (`/cached.png` layer) — confirms old cached entries still render; fixture keeps legacy categories.

## Design

### Tag taxonomy — new `portraits` catalog category

`{ src: "/avatars/portraits/<id>.webp", category: "portraits", tags: [...] }`. Dimensions: `gender` (masc/fem/neutral) · `ageGroup` (young/adult/middle/elder) · `skinTone` (light/medium/olive/dark/deep) · `hair` (color+style incl. bald/gray/balding) · `facialHair` (stubble/beard/mustache/goatee) · `markings` (scar/eyepatch/warpaint/wrinkles/tattoo, multi) · `headgear` (helm/headband/circlet/hood) · `build` (light/defensive/heavy, reuses `clothingCategoryForStyle` mapping) · `role` (warrior/trainer/owner/promoter flavor).

### Art pipeline — `scripts/avatar-pool/`

- `planMatrix.ts` (pure): coverage cells (12 gender×age × 4 roles, floor counts) + seeded fill of remaining budget → committed prompt-spec JSON (~600 specs, stable ids). Deterministic — re-run reproduces the spec.
- `generate.ts`: spec → Gemini image model (env-configured, default `gemini-2.5-flash-image`; `DRY_RUN` emits ledger only, mirroring `daily_bard.ts`). Retries + per-id checkpoint skip → resumable. Fixed template: painterly bust, head-and-shoulders, centered, muted background, gritty oil-painting style, 1:1 — tuned vs the reference sheet. **If SDK 0.24.1 can't express image output → direct REST `fetch` to the generativelanguage endpoint (no new dep) or bump to `@google/genai`; decided at Phase I.**
- `ingest.ts`: PNG → 256×256 WebP into `public/avatars/portraits/` via `sharp`; merges entries into `public/avatars/index.json` `categories.portraits`; prints coverage report (underfilled cells → re-run list). Raw intermediates gitignored under `scripts/avatar-pool/out/`.
- `contactSheet.ts`: composites sample portraits into a review sheet (reuses the validated PIL approach; QC gate for framing/style drift).

### Runtime selection

- `avatar.types.ts`: `AvatarLayerCategory` += `'portraits'`.
- `avatarCatalog.ts`: validation → `portraits` non-empty **or** full legacy set (portraits preferred); add `setAvatarCatalog`/`clearAvatarCatalog` exports (fixes stale registry doc + test injection).
- `avatarGenerator.ts`: portraits path — score each entry via Set-based tag lookup (gender/ageGroup/build/scar-when-wear>15/warpaint-when-famous/wrinkles-middle-elder/gray-balding-elder/role); `forcedGender`/`forcedAgeGroup` hard-filter; seeded weighted pick top-K (K≈8) → `layers:[{category:'portraits', src, z:0}]`. Legacy path untouched when `portraits` empty.
- `Avatar.tsx`: single-`'portraits'`-layer mode → no pixelated scaling, optional crest-color frame ring via `portrait.primaryColor` (stable-color identity survives without whole-image hue-rotate).
- `avatarSchemas.ts`: enum += `'portraits'` (same commit as generator).

### Phase T — strict test-first gate (authored + observed RED before ANY production edit)

| Spec file | Assertions |
|---|---|
| `src/test/engine/avatar/avatarGenerator.test.ts` (extend) | portrait-path determinism; scar tag only when wear>15; warpaint when fame>300‖kills>1; elder→gray/balding; build tag per style; forced-* hard filters; top-K spread; legacy fallback when no portraits |
| `src/test/engine/avatar/avatarCatalog.test.ts` (extend) | portraits-or-legacy validation both directions; `setAvatarCatalog`/`clearAvatarCatalog` |
| `src/test/schemas/avatarSchemas.*` (new, mirror-tree) | `AvatarDataSchema` round-trips `'portraits'` + legacy layers |
| `src/test/components/avatar/Avatar.test.tsx` (extend) | portrait mode: 1 img, no pixelated, frame-ring color |
| `src/test/scripts/avatarPool.planMatrix.test.ts` (new) | coverage floors; deterministic spec list |
| `src/test/_fixtures/avatarCatalog.ts` (fixture, lands WITH specs) | +~10 `portraits` entries so all existing specs exercise the new path |

### Megaplan V32 ritual

- **Phase 0**: `git tag pre-megaplan-v32`; `git mv` V31 doc set → `docs/archive/megaplans/`; extend `ARCHIVED_DOCS`; scaffold V32 docs; `INDEX.md` + BACKLOG header.
- **Phase F** → FINDINGS §0 carries this audit. **Phase T** → table above, all RED. **Phase I** → pipeline → engine → UI. **Art gate**: real run needs user's `GEMINI_API_KEY` (~$20–30) — `DRY_RUN` first. **Phase 6** → coverage report, contact-sheet review, `runnerGroups` regen (`scripts/test-audit-scan.mjs`), `orphanScan` ratchet note, DEFERRED + BACKLOG fold.

## Acceptance criteria

- `bun run test` + `type-check` + `lint` green; runnerGroups regenerated if needed.
- All Phase-T specs were observed RED before their production changes.
- ≥600 committed portraits; every gender×age×role cell at floor.
- Same seed → same pick; reroll → new pick; legacy fallback intact.
- Repo weight delta ≤ ~40MB.

## Risks

- Image modality on SDK 0.24.1 → REST fallback or `@google/genai` bump (Phase I decision).
- Prompt drift (off-center crops) → fixed template + ingest QC + contact-sheet review + per-id re-roll.
- Cost/rate limits → resumable checkpoints, ~$20–30 budget.
- Guard couplings (scanInLoop/orphanScan/fileBudget/paramBudget/runnerGroups) → handled deliberately per the corrections above.
