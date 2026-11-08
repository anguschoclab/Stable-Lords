<!-- markdownlint-disable MD001 MD024 MD025 MD033 MD060 -->

# MEGAPLAN V22 PLAN — Noblish Island Canon Integration (VALIDATED)

**Branch:** `main` (direct commits per house convention — V18-V21 precedent).
**Constraints:** zero save-file/backwards-compat — new `Warrior` fields are
optional (`handedness`), so `SAVE_STATE_VERSION` bump optional.
**Safety:** restore tag `pre-megaplan-v22` exists.
**Ledger:** `MEGAPLAN_V22_LEDGER.md` — one row per commit.
**Findings:** `MEGAPLAN_V22_FINDINGS.md` — §1 adjudication (60+ claims).
**Canon sources, verified this pass (fetched live):**
- Terrablood skill chart (updated 2004-03-02) — full attr→skill increment
  tables, DEFTNESS note ("ABs get double the Att skills in DF",
  "Ambidextrous warriors have +1 Attack skills"), STYLE MODIFICATIONS grid,
  Pagan AB-RIP heuristic.
- Hit point chart (Ben Weinstein, n=3650, 100.00% accuracy) — `CN*2+SZmod+WLmod`
  with the exact SZ/WL mod rows and HP rating bands.
- Warrior endurance chart (postulated, updated 2024-05-19) — measured
  (ST+CN)×WL lookup, 45 rows × 23 cols, tiers L/P/N/G/R/T/A.

**WIP caveat:** user's uncommitted changes in `sections.tsx`,
`progressionHandler.ts`, `warriorDefaults.ts`, `StartGame.tsx`,
`TurnaroundCard.tsx`, `_setup` baselines — merge around them; never stage
their files wholesale.

## §0 Validation addendum — draft audited against code + live canon

Each draft premise re-checked by reading the code and fetching the three
primary canon charts. Verdicts: **APPROVED** / **CORRECTED** / **DISPROVED**.

### Disproved premises (removed from scope)

| Draft item | Verdict | Evidence |
|------------|---------|----------|
| Phase-3.10 "SZ_MOD/WL_MOD_HP → Sir Jessie Jest tables; Chronic Pain HP=15" | **DISPROVED** | Code tables are *byte-identical* to the fetched canon chart (SZ 3:0…18:+8,21:+10; WL 3:0…14:+2…25:+10). Chronic Pain computes 12+8+2=**22** → falls in canon "Cannot take a lot" (22-26) — the profile statement still matches. No alternate table exists on the canon page; the audit agent's "SZ18→+3/WL9→0" was a misread. **Action: keep tables; add `hpRating()` only. Already implemented.** |
| C5 HP rating bands (1-14/15-20/…) | **CORRECTED** | Canon bands on the same page: Very frail ≤21 · Cannot take a lot 22-26 · Average 27-35 · A lot 36-40 · Tremendous 41-53 · Seemingly unaffected ≥54. Implemented as `hpRating()`. |
| Phase-3.11 endurance "(ST+CN)×WL product bands (0-180 L…)" | **DISPROVED as formula** | The canon chart is a measured 45×23 lookup, not a product — product mispredicts (e.g. 14×8=P while 15×9=L). **Implemented as the literal table** with '0'-cell fallback (scan left, then up). |
| "'U' reachable / keep at >882" | **DISPROVED** | Canon table contains zero 'U' cells; tops at 'A'. `U` stays in the type for forward-compat but is unreachable by any (ST+CN,WL) input. |
| Phase-3.8 "WT_DEC +[7,1], WL_DEC +[9,1] (BAGMAN)" | **DISPROVED** | The fetched chart shows explicit `0#` at those cells; worked-example raw DEC=7 (not 9 — the article's D9 folds in ~+2 luckfactor it cannot observe). No bumps added; values preserved as canon-reference only. |
| Worked example "raw DEC = 9" (A2) | **CORRECTED** | Chart-derived raw: I17 R13 A19 P10 F17 **D7**. Spec asserts D7 with the luckfactor explanation in-comment. |
| A2 per-attr yields "WT15→2D, WL9→3D, DF17→6I" | **CORRECTED** | Chart: WT15→1D, WL9→2D, DF17→4I (INI gains only at 5,7,15,17 odd). Spec asserts chart values. |

### Approved-with-correction premises

| Draft item | Verdict | Evidence |
|------------|---------|----------|
| F1 table truncations (DF/SP rows) | **APPROVED, corrected values** | Exact canon rows now known (fetched): `DF_DEF` = `DF_PAR` = `DF_ATT` pattern → 8@17; `DF_RIP` = evens 4-20 + tail 22-25 → 7@17; `SP_INI` = odd {9,15,21×2,22-25} + even {6,12,18} (drop phantom @4); `SP_RIP` = odd 5-17 (+2@11,21) + 22-25 (19:+0); `SP_DEF` = odd {5,7,15,17,21×2,22-25}; `SP_DEC` = evens 4-20 + 22-25. **Implemented.** |
| F2 AB double-DF-ATT | **APPROVED** | Canon chart note verbatim. Implemented in `computeBaseSkills` (×2 `bp(DF_ATT,DF)` for AimedBlow only). |
| New `WL_INI` table | **APPROVED (new finding)** | Canon chart has a WL→INI row: +1 each at 22-25. Implemented + wired into `INI_raw`. |
| `ST_PAR` divergence | **APPROVED (new finding)** | Chart: ST→PAR +0 at 22-25 while ST→ATT continues +1. Split implemented. |
| F4 ambidextrous | **APPROVED, descoped** | `checkWeaponRequirements` already honors `dualWieldReqAmbi` (live path, not dead); `generateWarriorIntro` already takes a `handedness` override at the canon 0.85/0.5 split. Remaining gap = persist `Warrior.handedness`, roll at creation, +1 ATT, pass through at call sites. `rollHandedness` implemented. |
| F3 persona/floors | **APPROVED** | Canon floors implemented as `STATEMENT_MIN_SKILLS` constants {INI10,RIP10,ATT7,PAR6,DEF3,DEC9}; genius text + bad categories + numeral-strip land in Phase 2. |
| A7 handedness rate | **CORRECTED** | Canon note = 85% right / ~7.5% left / ~7.5% ambi (intro code already splits this way). |
| C6 endurance tier shape | **CORRECTED** | Lookup (not formula) — see disproved row above. Fixture impact: all-15s (30,15) → 'N'(25) vs old 'R'(42) — endurance pool shrinks ~40% on the fixture; ratchet risk moves from HP to fatigue. |
| C18 Recruit 66→70 | **APPROVED** | Stale string confirmed `Recruit/index.tsx:92`. |
| B2/B3/B4/C9/C10/C11/C13/F10 mechanics | **APPROVED, unstarted** | All remain valid; each needs its own RED spec + ratchet cycle (Phase 4). |

## §1 Sequencing — test-first is the gate, not a phase

**Mandate (binding):** every implementation item below names its spec file(s)
in-line. A spec must exist, compile, and be observed RED (failing for the
intended reason — assertion, not import error) before its implementation
lands. Where implementation already landed ahead of a spec during this pass,
the row is marked **[retro-GREEN]** and the spec is committed in the same
commit — never implementation-only.

| Phase | Content | Balance risk | Verification |
|-------|---------|--------------|--------------|
| 1 | Canon-table specs RED + preservation constants | none | specs fail on assertions |
| 2 | Canon-data fixes (persona/statements/profile/hand surfaces/help/design) | none–small | fast tier |
| 3 | Chart corrections (skill tables, endurance lookup, AB rule) — **landed, pending ratchet** | HIGH | lab + world + ratchet |
| 4 | Combat mechanics (decise, will checks, recovery, riposte-dodge, ATT-crit, misc) | MED-HIGH each | lab + world + ratchet |
| 5 | Deferred structural (ledger only) | — | — |

## §2 Phase 1 — Spec inventory (authored / queued)

| Spec | Status | Covers |
|------|--------|--------|
| `src/test/engine/warrior/skillBreakpoints.canon.test.ts` | **authored** | canon per-attr yields (chart-verified values), worked example raw totals I17/R13/A19/P10/F17/**D7**, `CANON_STYLE_PENALTIES` row, AB DF×2-ATT |
| `src/test/engine/warrior/derivedStats.canon.test.ts` | **authored** | HP anchors (6,18,9)→22 + `hpRating()` canon bands; endurance lookup anchors incl. (15,9)→L, (20,10)→P, (25,17)→G, (36,17)→R, (33,21)→T, (42,21)→A, top-out at 'A' |
| `src/test/data/warriorStatements.canon.test.ts` | **authored** | canon floors (RIP<10→'', PAR<6→'', DEF<3→'', ATT<7→'', INI<10→''), genius text presence, no "(N)" numerals, bad-wit 6 categories |
| `src/test/engine/warrior/handedness.test.ts` | **authored** | `rollHandedness` 85/7.5/7.5 distribution + determinism; ambi dual-wield req easing (live `checkWeaponRequirements` path); intro override consumed |
| `src/test/engine/warrior/profileStatements.canon.test.ts` | **authored** | `physicalProfileLines` (non-normal tiers only), `skillRating` 16-19 Expert / 20+ Advanced Expert |
| `src/test/megaplan/v22Canon.guard.test.ts` | **authored (live ratchet)** | persona good+bad × 6 categories, numeral-free texts, `CANON_STYLE_PENALTIES` all 10 styles, `STATEMENT_MIN_SKILLS` values |
| `src/test/engine/combat/willCheck.test.ts` | **queued — write before Phase-4.2** | exhausted fighter fails WL check → collapse; wounded + low-KD surrenders more than high-KD (monte-carlo, seeded, N≥200) |
| `src/test/engine/combat/recovery.test.ts` | **queued — before 4.3** | exhausted low-OE/AL fighter fades back, regains endurance, resumes |
| `src/test/engine/combat/decise.test.ts` | **queued — before 4.1** | higher DEC → more first-strikes (paired warriors, monte-carlo) |
| `src/test/engine/combat/dodgeRiposte.test.ts` | **queued — before 4.4** | successful dodge check → riposte check fires |
| `src/test/engine/combat/attackCrit.test.ts` | **queued — before 4.5** | crit events (`metadata.crit`) increase with ATT (monte-carlo) |
| `src/test/engine/warrior/designReview.v22.test.ts` | **queued — before Phase-2.9** | BA/PR/TP canon notes, AB weakness warn, Little-damage warn, WL dead-zone, DF-11 callout |
| coverage note | — | fatigue-bark emission (Phase-2.10) needs a spec asserting `FATIGUE` events fire on threshold crossings; rhythm always-on (4.8) needs a spec asserting bonus applies with `discovered=false`; secondary-statement threshold (4.9) needs a threshold spec. Add to queued list at implementation time. |

## §3 Phase 2 — Canon-data fixes (no combat-path change)

1. ~~`CANON_STYLE_PENALTIES` + `STATEMENT_MIN_SKILLS` constants~~
   **landed** in `skillBreakpoints.ts` (values = fetched chart).
2. **uiMeta persona repairs** — spec: `warriorStatements.canon` + guard:
   add `bad.riposte`, `bad.parry`, `bad.endurance`; add "nothing short of a
   genius…" to `good.initiative.high`; strip "(N)" numerals; dedupe
   unreachable `min` entries.
3. **Statement canon floors** — spec: `warriorStatements.canon`: gate each
   persona statement behind `STATEMENT_MIN_SKILLS` (WT≥8 side); the DEC-side
   "endurance" category keeps its existing semantic.
4. **Profile physical statements** — spec: `profileStatements.canon`:
   `physicalProfileLines({enduranceTier,hp,encumbranceClass,damageClass})`
   emitting endurance/punishment/carry/damage lines for non-normal tiers;
   wire into dossier panel. `hpRating()` **landed**.
5. **Expert ratings** — spec: `profileStatements.canon` (`skillRating`):
   Expert ≥16 / Advanced Expert ≥20 on displayed luck-free skills; dossier
   badge + recruit card.
6. **Ambidextrous** — spec: `handedness.test` (+ `skillRating` ATT check):
   `Warrior.handedness` optional field; `rollHandedness` (**landed**) invoked
   at creation sites after luckfactor/bloodlust draws (deterministic order);
   `+1 ATT` via `computeBaseSkills` handedness param (**landed**); pass
   `handedness` at `simulate/narrative.ts` intro call and
   `checkWeaponRequirements` callers; "Is Ambidextrous" dossier line.
7. **Help text** — WT/WL ordering, breakpoint text, encumbrance f(ST,CN),
   six-skill canon descriptions. Merge around user WIP.
8. **Recruit page** — "66 Attribute Points" → 70.
9. **designReview additions** — spec: `designReview.v22` (queued): BA/PR/TP
   canon notes, AB weakness warn, PR Good+-damage bar, Little-damage warn,
   WL 10-14 dead-zone note, DF-11 breakpoint callout.
10. **Fatigue barks** — spec queued: emit `FATIGUE` event on threshold
    crossings so canon lines fire (narrative only).
11. **Dead-data flags** — `isMastery`, `BASE_GAIN_CHANCE`: document or wire;
    no removal.

## §4 Phase 3 — Chart corrections — LANDED, pending ratchet

**Landed this pass (all [retro-GREEN]-eligible once specs run):**

- `ST_PAR` split (no 22-25 gains), new `WL_INI` (22-25), `SP_DEC` +16/+22-25,
  `SP_DEF` +17/+21×2/+22-25, `SP_INI` restructured (odd 9/15/21×2/22-25 +
  even 6/12/18), `SP_RIP` odd 5-17/21×2/22-25, `DF_DEF`=`DF_ATT`,
  `DF_PAR`=`DF_ATT`, `DF_INI` +22-25, `DF_RIP` evens 4-20 + 22-25.
- `computeBaseSkills`: `WL_INI` wired into `INI_raw`; AB ×2 `DF_ATT`;
  optional `handedness` → +1 ATT.
- `computeEnduranceTier` → literal canon 45×23 table + '0' fallback.
- `hpRating()` added; `computeHP` unchanged (already canon-exact).
- `CANON_STYLE_PENALTIES` (fetched originals) + `STATEMENT_MIN_SKILLS`.
- `rollHandedness` + `Handedness` type.

**Removed from Phase 3 (disproved):** Sir-Jessie HP rewrite; BAGMAN
WT_DEC/WL_DEC bumps; product-formula endurance; 'U'-reachability work.

**Re-ratchet (mandatory, this is the remaining Phase-3 work):**

- Fixture impact analysis: at all-15s the table fixes grant **+5 DEF, +2 PAR,
  +3 RIP** (raw, pre-penalty) to every warrior — defensive skills inflate
  globally; endurance drops 'R'→'N' (42→25) on the fixture — fatigue
  pressure rises for everyone. Expect hit-rates down, bouts longer,
  defensive styles relatively favored.
- Run `scripts/balance-lab.ts` snapshot before/after; adjust
  `STYLE_PENALTIES` rows only (never `MATCHUP_MATRIX` for absolute
  weakness); `world-diag` 3 seeds if fixture moves >2pp; keep all ten
  styles inside [0.40,0.60].
- `bun scripts/test-audit-scan.mjs` to regenerate `runnerGroups.json` /
  `auditBaseline.json` for the new spec files.

## §5 Phase 4 — Combat mechanics (each: RED spec → implement → ratchet)

All approved by validation; none started. Per-item spec files listed in §2.

1. **DEC→first-strike**: `skills.DEC × DEC_INI_COEFF` into initiative
   contest (initiativePhase.ts); decise tactic untouched.
2. **Will checks**: exhausted → per-exchange WL check (`wlProb=WL×0.04`),
   fail → collapse→stoppage when hurt (hp<45% gate stays as house rule);
   wounded → surrender check with WL + KD (low KD surrenders → lives; high
   KD fights on → dies). Independent of plan YIELD.
3. **Fade-back recovery**: endurance ≤ ~15% → rest exchange (+maxEnd×0.08),
   canon 'fades back' narrative line.
4. **Dodge→riposte**: successful dodge check → `performRiposteCheck`.
5. **ATT→crit**: `+ATT × 0.005` into `effectiveCritChance` (cap modest).
6. **Burn-order retune**: canon LU>WS>SL>BA>PL>ST>PR>AB>PS>TP (current:
   SL too hot, PS misplaced, BA/PL swapped).
7. **Striker endurance bonus**: pool bonus at fighter build (×1.1 or flat).
8. **Rhythm always-on**: remove `discovered` gate (`getFavoriteRhythmBonus`).
9. **Secondary damage statements**: fixed threshold channel alongside
   ratio tiers.
10. **Encumbrance top-end**: reconcile ENC_TABLE vs ST+min(ST,CN)−6
    (36 vs 44 at 25/25) — adjudicate, then fix or document.

## §6 Phase 5 — Deferred (ledger-registered, own pass)

- Trains-burn-skills economy (E2) — inverts current balance; needs design
  decision + world calibration.
- Off-hand / dual-wield combat (C14) — needs loadout model changes + VHC
  gate; `dualWieldReqAmbi` data confirmed live for requirements only.
- Pagan literal damage model rewrite (C15) — soak rework.
- ADM/graduation tier (E5) — feature, not a fix.
- Rolled-base+14 creation (D1) — keep 70-pt pool (documented divergence).

## §7 Verification

- `bun run test` — full fast tier (all new specs must land GREEN).
- `bun run type-check`, `bun run lint`.
- `bun run test:slow` — REQUIRED after Phase-3/4 (balance/determinism
  surfaces): `balance.slow`, `worldBalance.slow`, `traitBalance.slow`,
  determinism sims. All ten styles in [0.40,0.60] fixture AND world.
- `bun run scripts/balance-lab.ts snap.json` before/after Phases 3-4.
- `SNAP=snap.json bun run scripts/world-diag.ts 1000 12345` (+777/2024 if
  deltas >2pp).
- `bun scripts/test-audit-scan.mjs` — regenerate runner groups/baseline.
- `bun run e2e` chromium smoke (dossier/profile changes).
- Determinism: handedness adds one creation draw — appended *after*
  luckfactor+bloodlust at every creation site (document draw order);
  sim determinism specs must stay green.

## §8 Acceptance criteria

- [ ] Worked example reproduces the canon chart: 9-6-18-15-9-10-17 striker
  raw = I17 R13 A19 P10 F17 **D7** pre-style (D9 = article's luck-inflated
  reading, documented).
- [ ] `computeHP` unchanged (already canon); `hpRating()` emits canon bands.
- [ ] Endurance tier comes from the literal canon lookup; 'A' is the
  reachable top; Chronic Pain reads VERY LITTLE.
- [ ] Profile shows physical statements + Expert ratings + handedness;
  ambidextrous persists (+1 ATT, deterministic intro, eased dual reqs).
- [ ] Wit statements honor `STATEMENT_MIN_SKILLS`; genius + bad-wit
  categories wired; no "(N)" numerals.
- [ ] Phase-4 mechanics each landed spec-first with ratchet: DEC→order,
  will checks (WL+KD), fade-back, dodge→riposte, ATT→crit.
- [ ] Balance harnesses green post-ratchet; runnerGroups regenerated.
- [ ] Help/design teach canon (WL-first, breakpoints, dead zone, all 10
  style notes).
- [ ] Ledger rows per commit; user WIP untouched.

## §9 Risks / decisions

- **Fixture-wide defense inflation** (+5 DEF/+2 PAR/+3 RIP raw) — ratchet
  penalties for affected styles; do NOT touch matchup matrix.
- **Fixture endurance cut** (R→N) — fatigue fires earlier everywhere;
  expect longer bouts + more stoppages; re-tune only if bands break.
- ~~HP table switch lowers HP~~ — **closed: no HP change** (tables were
  canon-exact); lethality shifts come only from endurance/mechanics.
- Will-checks/surrender shift bout endings — verify world kill-rate +
  decision share stay in band.
- Handedness draw perturbs recruit RNG streams — appended last at creation;
  sim determinism specs are the gate.
- `sections.tsx`/`progressionHandler.ts` carry user edits — merge only.
