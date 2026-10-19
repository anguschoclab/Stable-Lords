# MEGAPLAN V16 PLAN — Last-Week Feature Integration + NPC-AI Accessibility

**Branch:** `main` · **Constraints:** zero save-file/backcompat; slow suite skipped per user
directive; strict test-first mandate (Phase 1 RED before any production change).

## Scope — last week's lands

| Commit | Feature |
| --- | --- |
| `2f0d1f05` | MEGAPLAN V15 consolidation (narrative, traits, weather registration, offseason guard) |
| `17de790b` | Arena-feed filters + mobile shell + draft-commit UX |
| `21d70f2e` | Codex Sanguis responsive/honesty pass |
| `810bee2a`/`8450a5ee`/`ff1a5344` | Procedural avatars + lifecycle + all-surfaces wiring |
| `179c5339` | WarriorId-keyed scout reports + `WarriorRef` resolution payloads |
| `b51a0393` | Unified `entityIndex` search + hybrid breadcrumbs |

## Fixes

| # | Fix | Finding |
| --- | ----- | --------- |
| F1 | Unify warrior lookup — `livingWarriorById` in `entityIndex`; `findWarriorById` delegates | Two parallel WeakMap indexes with divergent coverage |
| F2 | `WEATHER_AI_DISPOSITION` record over all 64 `WeatherType`s; `Cursed Eclipse` gets real rules | Seasonable Fall weather with zero AI gates |
| F3 | AI scout reports via shared `generateScoutReport` → `agentMemory.scoutReports` + dossier hooks | Player-only scouting machinery; AI had no report equivalent |
| F3b | Wire `newInsights` → `state.insightTokens` on purchase | `generateScoutInsights` output discarded at sole call site |
| F3c | `'Trait'` cases in `applyInsightToken` + `resolveInsightResult` | Trait tokens dead-on-consume |
| F3d/e | `ScoutReport`↔`ScoutReportData` unify + `suspectedTraits`/schema fields | Trait intel stripped on save |
| F4 | `AvatarForEntity` resolves crest via `source.stableId` before roster scan | Dead/retired rival warriors rendered with player crest |
| F5 | Remove dead `'recruit'` `EventType` | Zero producers; `category:'recruit'` in AI workers is a different field — untouched |

## Phases

- **Phase 0** — baseline, this ledger, FINDINGS. ✅
- **Phase 1** — all contract/integration tests written and committed RED. ✅
- **Phase 2** — F1 (green T-F1). ✅
- **Phase 3** — F2 (green T-F2). ✅
- **Phase 4** — F3 + F3b/c/d/e (green T-F3). ✅
- **Phase 5** — F4 + F5 (green T-F4/T-F5). ✅
- **Phase 6** — full battery (fast tier), finalize docs, commit + push. ✅
  All gates green — see MEGAPLAN_V16_LEDGER.md Phase 6 for the matrix
  (type-check, lint, 9,102 vitest, all megaplan guards, knip report-only,
  40w soak ×2 identical-hash determinism, e2e chromium 5/5).

## Explicitly out of scope (documented)

- Bid-priority weather staleness (A11 — pipeline design quirk; acceptance gates see correct weather).
- AI fuzzy-evaluation of scouted opponents (V17 — this lands shared machinery + memory + insight economy).
