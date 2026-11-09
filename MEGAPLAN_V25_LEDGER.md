# MEGAPLAN V25 — COMMIT LEDGER

One row per megaplan commit, chronological. Restore tag: `pre-megaplan-v25`
(HEAD at tagging: `8114c118 feat: V24 Phase 6 — clash jitter, KD band, canon presets`).

| # | Commit | Phase | Scope | Verify |
|---|--------|-------|-------|--------|
| 0 | 32a56a58 | 0 | docs: plan, findings, ledger open; restore tag set | typecheck |
| 1 | 881d124a | 1 | spec batch ×10 RED-first + inert scaffolds | typecheck, 43 assertion-RED observed |
| 2 | 0e7744da | 2 | `src/data/warriorArchetypes.ts` — six winning archetypes, STYLE_ARCHETYPE_FIT, classifyArchetype | canon+guard specs green |
| 3 | 06d05df3 | 3 | Design Review archetype notes (style axis); tank-frame/encumbrance warns gated to armor-dependent identities | 201 warrior-review tests green |
| 4 | c610ce26 | 4 | 9 Assur concept builds (Snotling AB line, marginal PR, six WS tank/hybrid spreads); PR count 12→13 | concept specs + ratchet rebaseline |
| 5 | dad36931 | 5 | Codex WinningTypesSection + StyleCard archetype chips | UI specs green |
| 6 | 809008bf | 6 | Archetype doctrine shaping (TP exempt), archetype-aware armor fitting in roster refit; spec renames to suffix taxonomy; probe-glob tsconfig exclusion | 991 targeted tests, typecheck |
| 7 | a5de3db3 | 7 | rhythm bonus always-on (drop discovered.rhythm gate); duplication ledger renames | fast suite green, traitBalance rebaselined (personality floor 32→20) |
| 8 | 923f8893 | 8 | ratchet + close-out: balance-lab FLAT in band (42.1–57.0), SNAP proxy TP-elevated (watch item, certified world band holds), world-diag seed 12345 kill 5.20%, DEFERRED.md | fast suite, type-check, slow subset (worldSeeder/styleWinConditions/traitBalance/rivalTraitAI/worldBalance/balance) |
| 9 | (this commit) | deferred pass | V24-deferred items landed post-close-out: D1 style-conditioned luck pools (WS {ATT,PAR}, post-draw clamp, stream parity); D2 dagger-style-fit advisory (DF<11 non-ST/AB); D3 canon learn caps 20/area + 120 career; PS signature floors [1,4,1,1,9,1]; archetype e2e smoke; livingWorld re-seed 12345→2024 (TP world center ~62.3 canon-dominant — 6-seed probe, no TP nerf kept; DEF −16 residual measured no-op, reverted) | fast 973/973 + 10629, slow 45/45 + 298, typecheck, e2e 2/2, livingWorld/worldBalance/gradient/strip all current-seed green |
