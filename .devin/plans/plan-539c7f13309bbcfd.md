# Stable Lords Player Manual — v3.0 Rewrite with Screenshots

Rewrite docs/USER_MANUAL.md from scratch so it accurately documents the current v3.0.0 game (the existing v2.1.0 manual predates ~4,500 commits), illustrated with captured screenshots of key screens, plus two small adjacent drift fixes (Help Codex objectives, StartGame version footer).

# Stable Lords Player Manual — v3.0 Rewrite with Screenshots

## Context & Findings

`docs/USER_MANUAL.md` exists (34 KB, header says "Version 2.1.0") but was last substantively updated 2026-08-12 — ~4,483 commits ago. The game (`package.json` = **3.0.0**, `SAVE_STATE_VERSION = '3.0.0'`) has drifted massively. Audit results below.

### Verified drift (old claim → current code)

| Manual says | Code actually does |
|---|---|
| 5 progression objectives | 8 objectives — adds **Arena Champion**, **Lord of the Circuit**, **Grand Champion** (`src/constants/progression.ts`) |
| FTUE: backstory → name → crest → 3 warriors | Title screen → New Game form (owner, stable, **crest designer**, **9 backstories**, **3 world difficulties**) → **Orphanage flow**: pick ≤3 orphans → First Blood tutorial bout → plan step → story begins (`src/pages/StartGame.tsx`, `src/pages/Orphanage.tsx`, `src/data/backstories.ts`) |
| Recruit costs 50/150/300/500g; pool of 12, full refresh | Costs **100/150/250/400g**; shared world pool (min 20, 0.5 per rival stable), **partial refresh** (30%, removes 2–4, hard cap 36); reroll 50g; free agents/veterans appear in pool (`recruitment.json`, `src/constants/recruitment/`, `src/engine/recruitment/draftService.ts`) |
| Style names "Bashing Attack" etc. | Game displays Duel II colloquial names: **Basher, Lunger, Striker, Slasher, Aimed-Blow, Parry-Lunger, Parry-Riposte, Parry-Striker, Total-Parry, Wall of Steel** (`src/types/shared/fightingStyles.ts`) |
| Fight plan = Offensive/Defensive Emphasis + Responsiveness | Full canon plan: **OE, AL, Kill Desire**, offensive/defensive tactics, attack/protect targets, opening move, fallback (FLEE/TURTLE/BERZERK/YIELD), per-phase strategies, **conditions, decoys, phase shifts, desperate plan**, feints, range preference, **challenge & tournament plan slots** (`src/types/shared/fightPlan.ts`) |
| Bouts last ~8–12 exchanges | Max **30 exchanges** (10 min × 3/min) (`src/constants/combat/combat/global.ts`) |
| Kill window: style HP threshold 0.3–0.8 + END<0.4, 4% cap | Canonical model: vitals roll (threshold, **12% cap × 1.1 scale**) → death intent → **death roll** → doomed; **infirmary roll** → "died of wounds"; bloodlust, armor/helm, WL, youth, damage-class sweet spot all factor (`KILL_WINDOW`, `DEATH_ROLL`, `INFIRMARY` in global.ts) |
| Weather: 5 types | **66 weather types** in seasonal pools + 12 offseason-only; economic effects (Mana Surge +250g, Sweltering/Blizzard premiums) (`src/types/enumSources.ts`, `src/constants/economy/economy.ts`) |
| 8 rival stables | 8 **seeded**; living world churns to floor 90 / soft 160 / hard 200 via organic licensing, **legacy founders**, bankruptcy & starvation folds, **free agents** (`src/constants/world.ts`) |
| Scouting: 25g flat | 3 qualities: **Basic 25g / Detailed 50g / Expert 100g** (variance 5/3/1; Expert reveals plan, traits, owner-competence read) (`src/engine/scouting/scouting.ts`) |
| Trainers: 3 tiers + Healing/Attr/Skill specialties | Tiers/salaries unchanged; now **5 foci** (Aggression/Defense/Endurance/Mind/Healing), **7 specialties**, max 5 trainers, 52-wk contracts, trainer aging/death, **retired warriors → trainers** (`src/types/enumSources.ts`, help codex) |
| Armor: None/Leather/Chain/Plate | **9 armor tiers**, 5 helms, 4 shields, 19 weapons + carry-cap/encumbrance + style restrictions + preferred weapons (`src/data/equipment/`) |
| Arenas unmentioned | **52 venues** w/ tiers 1–3, sizes (cramped/standard/open), zone DEF penalties, surface mods, tags (`src/data/arenas/venues/`) |
| Tournaments: 4 tiers | Same 4 tiers + calendar (weeks 10/20/30/42), **Grand Championship week 52**, 4-wk prep window, insight-token prizes, awards incl. TOURNAMENT_RANK (`tournamentSelection/core.ts`, `dates.ts`, `arenaChampionship.ts`) |
| Dashboard/widgets + 6 pages | Hub UI: **Stable hub** (14 pages) + **World hub** (10 pages) + utility links (`src/components/layout/navigationHubs.ts`) |
| Save: autosave, slots | Autosave + **10 slots** + JSON/YAML **import/export** + Electron store fallback (`src/state/saveSlots.ts`) |

### Systems entirely missing from the manual

Traits (~184 across Common/Notable/Exceptional/Signature/Flaw/class), favorites (weapon + rhythm + learn) & weapon charting, arena learns (0–6/bout, WT-gated, caps 6/skill 24/career), insight tokens (4 kinds), per-arena championship titles (defenses, stripping, dormancy) + Grand Championship, ~67 offseason events, bankruptcy system (−500 threshold, 13-wk grace, −800 floor, 300g emergency loan, 25g idle stipend), spatial combat (4 ranges, 4 zones, momentum, psych states, feints, disarms, knockdowns, tactic RPS), popularity/renown/fame split, roster cap 10 (+backstory bonus), Warrior Builder (70-pt custom + fighter-concept presets), house rules + content packs (Mods page), bookmarks, War Council advisor suite, Physicals Simulator, Style Archives, Hall of Fights, owner succession/dynasty, epithets, probabilistic retirement, seasonal tournament calendar, promoter tiers (Local→Legendary) + hype.

## Decisions (from user)

1. **Full rewrite** — restructure for cohesion/intuitive flow, not just fact-patching.
2. **Depth = guide + key numbers** — every system documented with player-facing behavior and important constants (costs, caps, thresholds); hidden systems (luckfactor, bloodlust, potential, favorites) documented as discoverable in-game without spoiling exact rolls; no full formula dumps.
3. **No megaplan artifacts** — docs only, no MEGAPLAN_V22_* files.
4. **Fix all three adjacent drifts** — manual + Help Codex objectives + StartGame version.
5. **Screenshots of key parts** — captured live from the running game.

## Deliverable 1 — Rewrite `docs/USER_MANUAL.md`

New structure (journey-ordered, keeps reusable prose from v2.1 where still accurate):

1. **Welcome to the Arena** — what the game is, Duel II heritage, management-not-twitch, win condition preview
2. **Getting Started** — `bun install` / `bun run dev` (web :8080) / `bun run electron:dev`; title screen (New/Continue/Load/Import/Delete) — *screenshot: title screen*
3. **A New Stable** — New Game form: owner name, stable name, crest designer (shield/field/colors/charges), 9 backstories w/ bonuses, 3 world difficulties (Contender/Challenger/Legend) — *screenshot: new-game form*
4. **The Orphanage (First Blood)** — pick ≤3 orphans, tutorial bout, set plan, story begins — *screenshot: orphanage selection*
5. **The Weekly Cycle** — planning → BEGIN CYCLE → simulation → resolution reveal; 52 wk/yr; year-boundary offseason
6. **Warriors** — attributes (3–25, 70-pt creation pool, breakpoints 9/13/17/21), six base skills, derived stats (HP/Endurance/Damage class/Carry Cap), fighting styles table w/ display names + identities, traits (tiers, flaws), hidden potential/luckfactor/bloodlust (existence-level), arena learns (WT-gated, 6/24 caps), favorites (weapon/rhythm/learn) & charting, popularity vs fame, epithets/lineage, aging & retirement (decay 25+, probabilistic retirement, career arcs) — *screenshot: warrior dossier*
7. **Fight Plans** — OE/AL/KD axes, tactics, targets, opening move, fallback, per-phase, conditions, decoys, phase shifts, desperate plan, feints, range preference, challenge/tournament slots; council presets — *screenshot: planner*
8. **Combat** — exchange chain, spatial model (ranges/zones/arena size), momentum & psych states, damage & hit locations, bout outcomes (Kill/KO/Exhaustion/Stoppage/Decision/Yield/Draw), death model at guide level (vital hit → death intent → death roll → doom; infirmary/died-of-wounds; WL & armor matter; no resurrection) — *screenshot: resolution reveal / bout viewer*
9. **Equipment** — weapons by weight class w/ requirements & style suitability, 9 armor tiers, 5 helms, shields, encumbrance & carry cap, style restrictions, favorite-weapon discovery — *screenshot: stable equipment*
10. **Training & Trainers** — modes (attribute / skill drill / recovery / trait work), 20g cost, WL-driven odds (repeat halving, seasonal cap 3), drill cap 3, injury risk; trainers: tiers & salaries, 5 foci, 7 specialties, max 5, contracts, aging, retired-warrior conversion — *screenshot: training page*
11. **Recruitment & Roster** — roster cap 10 (+bonus), shared world recruit pool (tiers & new costs, partial refresh, 50g reroll, free agents/veterans), Warrior Builder (70-pt + fighter-concept presets) — *screenshot: recruit page*
12. **Economy** — income (purse/win/fame dividend/patronage/weather gifts) & expenses (upkeep 60+1.5×fame, salaries, fees) w/ scaling table, arena-tier multipliers; **treasury distress**: bankruptcy −500, 13-wk grace, −800 floor, 300g emergency loan, idle stipend — *screenshot: finance ledger*
13. **The Booking Office** — bout offers & statuses (incl. countered), promoter personalities + 4 tiers + hype, challenges, title bouts (Arena Commission), once/week rule, rivalries & vendettas — *screenshot: booking office*
14. **The Arena Circuit** — 52 venues, tiers, sizes, tags, zone DEF penalties & surface mods, per-arena championship titles (contention, defenses ~4 wk, refusals→stripping, dormancy, +50 hype/1.5× purse) — *screenshot: arena detail*
15. **The Living World** — crowd mood (5), weather system (66 types, seasonal pools, gameplay & economic effects, offseason-only events), meta drift, rival stables (personalities × competence × meta-adaptation, AI intents incl. vendettas), world churn (growth to 90+/folds/free agents), scouting (3 quality tiers) — *screenshots: scouting + arena circuit*
16. **Tournaments & the Season** — calendar wk 10/20/30/42, 4 tiers w/ rank bands, prep mode, tournament plans, medals & insight tokens, annual awards, Grand Championship (wk 52, champions-only, 2500g) — *screenshot: tournaments*
17. **The Offseason** — year-boundary events (~67 kinds: feasts, plagues, bargains, strange weather…), newsletter, offseason page — *screenshot: offseason page*
18. **Progression & Victory** — all 8 objectives, victory screen, legacy mode
19. **Records & Lore** — Chronicle (Gazette), Hall of Fame, Graveyard, Hall of Fights, world history, Style Archives — *screenshots: chronicle + graveyard*
20. **Interface Guide** — hub map (Stable 14 / World 10 / utility 5), every page's purpose, dashboard widgets — *screenshot: stable overview + war council*
21. **Tools & Customization** — Physicals Simulator, Mods (house rules: death-rate multiplier, severe-injury-instead-of-death; content packs), Import/Export (JSON/YAML), Bookmarks, Help Codex, Admin (dev-only) — *screenshot: simulator*
22. **Saving Your Game** — autosave, 10 slots, IndexedDB vs Electron store
23. **Glossary** — expanded (~40 terms: OE/AL/KD, learn, trait, psych state, range, zone, momentum, insight token…)

Style conventions: keep existing tone (2nd person, tip callouts, tables); bump header to `Version 3.0.0`; relative image links `images/manual/<name>.png`.

## Deliverable 2 — Screenshots (`docs/images/manual/`)

**Method:** `bun install` (deps exist) → `bun run dev` → drive `http://localhost:8080` with the Playwright MCP server:
1. Complete FTUE per `e2e/helpers.ts` `startNewGame` flow (title → new game → orphan picks → first blood → hub).
2. Advance ~10–15 weeks via the Arena hub **AutosimConsole** (or repeated BEGIN CYCLE) so bouts, gazette issues, rankings, and likely a death or two populate the world. Deaths are fine — they make the Graveyard shot real.
3. Set viewport **1440×900**, capture PNG viewport shots (full-page where the layout demands it).

**Shot list (~18, mapped to manual sections):**
`title-screen`, `new-game-form`, `orphanage-selection`, `stable-overview`, `war-council`, `arena-hub`, `roster-wall`, `warrior-dossier`, `training`, `planner`, `equipment`, `finance-ledger`, `booking-office`, `recruit`, `arena-detail`, `scouting`, `tournaments`, `chronicle`, `graveyard`, `resolution-reveal`, `physicals-simulator`, `offseason`, `style-archives`. (Trim during implementation where a shot adds no value; every screenshot must map to a manual section.)

**Notes:** `docs/images/` is not gitignored (only `e2e/screenshots/` is); commit images alongside the manual. PNG, deterministic names, alt text = caption.

## Deliverable 3 — Adjacent drift fixes

- `src/pages/help/sections.tsx` — `ProgressionSection` (lines ~524–545): insert the 3 missing objectives between "Tournament Victor" and "Hall of Famer", matching `DEFAULT_PROGRESSION` order: **Arena Champion** (hold an arena championship), **Lord of the Circuit** (three arena championships across three warriors), **Grand Champion** (win the champions-only Grand Championship).
- `src/pages/StartGame.tsx` — line 65 footer `Stable Lords v2.0` → `Stable Lords v3.0.0` (literal bump; `resolveJsonModule` isn't enabled for app code so a package.json import isn't available — keep it simple).

## Files

- `docs/USER_MANUAL.md` — full rewrite (~700–900 lines)
- `docs/images/manual/*.png` — ~18–22 new screenshots
- `src/pages/help/sections.tsx` — 3-objective insert
- `src/pages/StartGame.tsx` — version literal

## Verification

- `bun run dev` boots; screenshots taken against the live app confirm each documented page/flow renders as described.
- `bun run lint` + `bun run type-check` — required for the two `.tsx` edits.
- `bun run test` — fast suite green (doc + string changes shouldn't move it, but gate anyway per repo rules).
- Final manual self-review: every numeric claim traceable to a constant (`economy.ts`, `recruitment.ts`, `training constants.ts`, `learn.ts`, `global.ts`, `arenaChampionship.ts`, `progression.ts`, `world.ts`, `dates.ts`); every page named in the Interface Guide exists in `navigationHubs.ts`.
- Markdown renders correctly (tables, TOC anchors, image links) — spot-check on GitHub preview.

## Risks / Considerations

- **Screenshot capture time** — driving the UI + simming weeks via MCP is the slow part; if a populated state proves hard (e.g., no deaths yet for Graveyard), acceptable fallback is capturing the page's designed empty state rather than forcing outcomes.
- **Drift recurrence** — the manual will drift again; mitigated by documenting systems at guide-level + key constants rather than exhaustive formulas, and by the version header making staleness obvious.
- **Image weight** — ~20 PNGs at 1440×900 ≈ 3–6 MB in-repo; acceptable for docs (no image pipeline exists), but avoid full-page captures except where needed.
