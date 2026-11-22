# Crisis Agent Journal

## 2026-11-22 — Soft-pressure staff cuts were personality-blind

**Finding:** `maybeFireTrainer` (`src/engine/ai/workers/staffWorker.ts`) had three
fire triggers — RECOVERY/SURVIVAL intent, treasury < 100, and a _soft_
regional patch (`treasury < 500 && (crowdMood 'Solemn' || weather 'Rainy')`).
The soft trigger fired identically for every owner, so a Methodical stable
(the most loyal, slowest-to-cut archetype) panic-fired a trainer on a rainy
week exactly like an Aggressive one.

**Learning:** `TRAIT_POLICY.cutLiabilityThreshold` is the engine's canonical
"how fast does this owner cut" ordering (Aggressive 55 < Showman 60 <
Tactician 62 < Pragmatic 70 < Methodical 78) — it maps personalities onto the
design's Ruthless→Loyal archetypes. Comparing a policy threshold against
`TRAIT_POLICY.Pragmatic`'s value is a self-syncing way to ask "does this
owner cut faster than baseline" that survives table retuning, instead of
hardcoding a personality set.

**Rule:** Crisis responses split into _hard_ triggers (insolvency, crisis
intents — personality-blind is correct; a folding stable is a folding
stable) and _soft_ triggers (regional pressure, bad optics) where
personality must decide whether the owner flinches at all. When adding a
soft trigger, gate it on the trait-policy ordering, not on intent alone —
and check `makeAiTestRival`'s default owner (`Pragmatic`) before assuming
existing tests exercise the personality you expect.
