# Design Bible Audit Findings — June 2026

## Executive Summary

Full codebase sweep completed. **ZERO `rounded-*` structural violations** (clean from Phase 12). New violations found in: `text-white`, `text-black`, `font-serif`, raw palette colors, emoji in UI, and structural pattern compliance (`codex-label` unused).

---

## 1. TOKEN VIOLATIONS

### ❌ text-white — 3 matches, 2 violations, 1 approved

| File | Line | Violation | Fix | Status |
|---|---|---|---|---|
| `WarriorLeaderboardRow.tsx` | 50 | `hover:text-white` on Link | `hover:text-foreground` | ❌ FIX |
| `WarriorDetail.tsx` | 178 | `hover:text-white` on destructive hover button | `hover:text-primary-foreground` | ❌ FIX |
| `RecruitCard.tsx` | 229 | `text-white/5` decorative quote icon (5% opacity) | — | ✅ APPROVED (decorative, exempt) |

### ❌ text-black — 14 matches, 12 files

All instances: `text-black` on colored backgrounds. Per bible, primary buttons and badges on colored backgrounds must use `text-primary-foreground`.

| File | Lines | Context | Fix |
|---|---|---|---|
| `AdminTools.tsx` | 187, 195 | Category button + icon on `bg-primary` | `text-primary-foreground` |
| `StableEquipment.tsx` | 230, 357 | Badge on `bg-arena-gold`, button on `bg-primary` | `text-primary-foreground` |
| `ErrorBoundary.tsx` | 72 | Reboot button hover on `bg-primary` | `text-primary-foreground` |
| `StableDossier.tsx` | 76 | Badge on `bg-arena-fame` | `text-primary-foreground` |
| `ArenaFighter.tsx` | 176 | Winner name plate on `bg-arena-gold/80` | `text-primary-foreground` |
| `planBuilder/CommonControls.tsx` | 81 | Badge on `bg-arena-gold` | `text-primary-foreground` |
| `planBuilder/StylePassives.tsx` | 91 | Badge on `bg-arena-gold` | `text-primary-foreground` |
| `TrainerCard.tsx` | 75 | Master tier trophy on `bg-arena-gold` | `text-primary-foreground` |
| `TrainerTable.tsx` | 96 | Tier badge on `bg-arena-gold` | `text-primary-foreground` |
| `Graveyard.tsx` | 156 | Champion badge on `bg-arena-gold` | `text-primary-foreground` |
| `HallOfFame.tsx` | 390 | Champion badge on `bg-arena-gold` | `text-primary-foreground` |
| `NotFound.tsx` | 26 | Return button hover on `bg-primary` | `text-primary-foreground` |

### ❌ font-serif — 3 matches, 3 files

Per bible: display text uses Cinzel (`font-display`). `font-serif` → `font-display` globally.

| File | Line | Context | Fix |
|---|---|---|---|
| `SpeechBubble.tsx` | 70 | Opening quote mark | `font-display` |
| `TacticalLogView.tsx` | 98 | Event log text | `font-display` |
| `BoutResolution.tsx` | 134 | Comms link announcement text | `font-display` |

---

## 2. RAW PALETTE COLOR VIOLATIONS

### ❌ text-* raw colors — 17 matches, 8 files

| File | Lines | Violation | Fix | Status |
|---|---|---|---|---|
| `AppHeader.tsx` | 62 | `text-slate-400` (Overcast weather) | `text-arena-steel` | ❌ FIX |
| `AppHeader.tsx` | 63 | `text-blue-400` (Rainy weather) | `text-arena-pop` | ❌ FIX |
| `AppHeader.tsx` | 67 | `text-cyan-400` (Gale weather) | `text-arena-pop` | ❌ FIX |
| `AppHeader.tsx` | 71 | `text-blue-200` (Blizzard weather) | `text-arena-pop` | ❌ FIX |
| `AppHeader.tsx` | 75 | `text-lime-500` (Acid Rain) | `text-arena-gold` | ❌ FIX |
| `AppHeader.tsx` | 74 | `text-stone-500` (Ashfall) | `text-muted-foreground` | ❌ FIX |
| `AppHeader.tsx` | 76 | `text-fuchsia-400` (Mana Surge) | `text-arena-fame` | ❌ FIX |
| `AppHeader.tsx` | 250 | `text-sky-400` (fallback) | `text-arena-pop` | ❌ FIX |
| `StableComparison.tsx` | 320, 333, 349 | `text-sky-400` (combat modifiers) | `text-arena-pop` | ❌ FIX |
| `toast.tsx` | 92 | `text-red-300`, `ring-red-400`, etc. | — | ✅ EXEMPT (shadcn pattern) |
| `WeatherWidget.tsx` | 96 | `text-indigo-900` (Abyssal Gloom) | `text-arena-fame` | ❌ FIX |
| `WeatherWidget.tsx` | 105 | `text-fuchsia-600` (Cursed Miasma) | `text-arena-fame` | ❌ FIX |
| `WeatherWidget.tsx` | 113 | `text-cyan-300` (Hailstorm) | `text-arena-pop` | ❌ FIX |
| `WeatherWidget.tsx` | 121 | `text-violet-400` (Arcane Storm) | `text-arena-fame` | ❌ FIX |
| `tacticSuitability.ts` | 95 | `text-green-500` (WS rating) | `text-primary` | ❌ FIX |
| `tacticSuitability.ts` | 96 | `text-amber-500` (S rating) | `text-arena-gold` | ❌ FIX |
| `ErrorBoundary.tsx` | 64 | `text-red-400` (error pre) | — | ✅ EXEMPT (error display) |
| `InsightManager.tsx` | 26 | `text-cyan-500` (Rhythm token) | `text-arena-pop` | ❌ FIX |
| `Training.tsx` | 189 | `text-sky-400` (recovery kind) | `text-arena-pop` | ❌ FIX |

### ❌ bg-* raw colors — 15 matches, 5 files

| File | Lines | Violation | Fix | Status |
|---|---|---|---|---|
| `ArenaBackground.tsx` | 281, 420, 460, 466, 502, 506, 515 | `bg-blue-*`, `bg-lime-*` | — | ✅ EXEMPT (atmospheric weather effects) |
| `ParticleSystem.tsx` | 120-123 | `bg-red-600`, `bg-yellow-400`, etc. | — | ✅ EXEMPT (decorative particles) |
| `WeatherWidget.tsx` | 97, 106, 114, 122 | `bg-indigo-900/10`, `bg-fuchsia-600/10`, `bg-cyan-300/10`, `bg-violet-400/10` | Map to arena equivalents | ❌ FIX |
| `InsightManager.tsx` | 26 | `bg-cyan-500/20` | `bg-arena-pop/20` | ❌ FIX |
| `Training.tsx` | 189 | `bg-sky-500/5` | `bg-arena-pop/5` | ❌ FIX |

### ❌ border-* raw colors — 5 matches, 4 files

| File | Lines | Violation | Fix |
|---|---|---|---|
| `WeatherWidget.tsx` | 98, 107, 115, 123 | `border-indigo-900/20`, `border-fuchsia-600/20`, `border-cyan-300/20`, `border-violet-400/20` | Map to arena equivalents |
| `RosterWarriorRow.tsx` | 123 | `border-emerald-400/40` (grade B) | `border-primary/40` |
| `PromoterDetail.tsx` | 418 | `border-emerald-500/30` (signed offer) | `border-primary/30` |
| `Training.tsx` | 189 | `border-sky-500/10` (recovery kind) | `border-arena-pop/10` |

---

## 3. COPY / VOICE VIOLATIONS

### ❌ Emoji in Serious UI — 1 file

| File | Lines | Violation | Fix |
|---|---|---|---|
| `MiniCombatLog.tsx` | 56-74 | Emoji used as combat event icons (⚔️, ⚡, 💀, 😵, 🛡️, ↩️, 😮‍💨) | Replace with Lucide icons or text labels |

---

## 4. STRUCTURAL PATTERN FINDINGS

### ⚠️ codex-label class — DEFINED BUT UNUSED

- `index.css:256-260` defines `.codex-label` with Cinzel font, gold color, tracking
- `SectionDivider.tsx` replicates the styling inline (`text-[10px] font-black uppercase tracking-[0.4em]`) but does NOT use the `codex-label` class
- **Impact**: Section labels miss the gold color and Cinzel font-family specified in the bible
- **Verdict**: Pattern deviation. `SectionDivider` should apply `codex-label` class to its label span.

### ✅ PageHeader — WIDELY ADOPTED

- 23 of 24 page-level components use `PageHeader`
- Exemptions (by design): `Gazette.tsx` (newspaper masthead), `StartGame.tsx` (title screen), `Orphanage.tsx` (FTUE flow)
- `PromoterDetail.tsx` uses raw `<h1>` instead of `PageHeader` — **minor deviation, non-critical**
- `TrainingPlanner.tsx` uses `<h2>` inside layout alongside `PageHeader` — **acceptable**

### ✅ imperial-ring — CONSISTENTLY USED

- 131 references across codebase
- `PageHeader` embeds `ImperialRing` automatically
- Pattern is well-established

### ✅ rounded-* — ZERO VIOLATIONS

- All structural elements use `rounded-none`
- `rounded-full` used only on decorative avatar containers (acceptable per bible)

---

## 5. EXEMPTS (Do Not Fix)

| File | Reason | Bible Reference |
|---|---|---|
| `toast.tsx` | shadcn/ui destructive group classes | Section 14, previous audit |
| `ParticleSystem.tsx` | Decorative particle colors | Section 14, previous audit |
| `ErrorBoundary.tsx` | Error display styling | Section 14, previous audit |
| `ArenaBackground.tsx` | Atmospheric weather gradients/effects | Decorative/atmospheric |
| `RecruitCard.tsx:229` | `text-white/5` decorative quote mark | 5% opacity, invisible decorative |

---

## Fix Priority

1. **High**: `text-white`, `text-black`, `font-serif` — clear token violations, easy fixes
2. **High**: Raw palette colors in `AppHeader.tsx`, `StableComparison.tsx`, `WeatherWidget.tsx`, `Training.tsx`, `InsightManager.tsx`, `RosterWarriorRow.tsx`, `PromoterDetail.tsx`, `tacticSuitability.ts` — map to arena tokens
3. **Medium**: Emoji in `MiniCombatLog.tsx` — replace with Lucide icons
4. **Low**: `SectionDivider.tsx` — add `codex-label` class to label span
