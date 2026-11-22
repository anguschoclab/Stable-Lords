# Arena Architect Journal

Critical learnings only — registration surfaces found the hard way, venue
asymmetry findings, tag interactions with surprising skew, dead paths in the
tournament/promoter tree. Format: `## YYYY-MM-DD - [Title]` +
Finding/Learning/Rule.

## 2026-11-22 - `indoor:` tag:weather combos are unreachable in live combat

**Finding:** `STYLE_WEATHER_MODIFIERS` carries three `indoor:X` entries
(`indoor:Blood Moon`, `indoor:Acid Rain`, `indoor:Mana Surge`) that can never
fire in a real bout. `resolveEffectiveWeather` (`src/engine/combat/mechanics/
weatherEffects/index.ts:11`) maps every `indoor`-tagged arena's weather to
`'Clear'`, and `ctx.weather` is populated from that _effective_ weather
(`src/engine/simulate/initialization.ts:83`). An indoor venue therefore always
queries `indoor:Clear`, which does not exist. The unit test
(`newArenaArchitect.test.ts`, the `modMurky` case) still passes because it
calls `getStyleWeatherModifier` directly with a raw weather + raw tags —
the helper itself has no indoor suppression.

**Learning:** tag:weather keys gate on the _effective_ weather, not the rolled
weather. Tags whose venues are all-or-mostly indoor (`indoor` itself, and any
combo meant to fire inside a building) are dead by construction. By contrast,
mixed tags like `elevated` (10 outdoor + 3 indoor venues) stay live for the
outdoor members and are correctly inert indoors — matching the 'indoor'
sheltered-from-weather rule.

**Rule:** Never add a `STYLE_WEATHER_MODIFIERS` key whose tag appears only on
indoor venues — it compiles and unit-tests green but never spawns. Prefer tags
with outdoor venues (`elevated`, `open`, `uneven`, `ruins`, `living`, `cursed`,
`water`, `magical` venues all have outdoor members). If a future change wants
indoor venues to feel leaked-in weather, the fix belongs in
`resolveEffectiveWeather`/`ResolutionContext` (carry raw weather), not in the
modifier table.

## 2026-11-22 - Roster caps are a curated ceiling, not headroom

**Finding:** `ARENA_ROSTER_LIMITS` (`src/constants/arena/arena.ts:112`) sits at
TOTAL 52 / NORMAL 50 / tiers {12, 25, 17} — and the live roster is exactly
52/50/12/21/17 (normal-pool counts). The comment records a deliberate
curation that _lowered_ the caps (54→52) and froze tier ceilings.

**Learning:** `dataIntegrityArenas.test.ts` enforces the caps, and
`magicNumbers.test.ts` pins the exact numbers. Any new venue forces a cap bump
against a documented curation decision — that is a balance/scope conversation,
not a small domain addition.

**Rule:** When the roster is at cap, ship interaction content instead
(tag:weather combos, `weatherMods` entries on existing venues, arena-event
flavor). Check `ARENA_ROSTER_LIMITS` vs `getNormalArenas()` counts before
drafting a venue.
