echo 'The objective is to "Organically expand the world of Stable Lords with fun, spontaneous, minor features". We will create a few things based on the problem description:
1. "Adding a \"Weather System\" variable (Rain, Blazing Sun) that slightly modifies stamina drain in combatMath.ts."
Wait, the weather system is already present: `src/engine/combat/mechanics/weatherEffects.ts` has many weathers. And `combatMath.ts` has `WEATHER_STAMINA_MOD`. Actually, let us check if "Rain" is in `WEATHER_STAMINA_MOD` in `src/engine/combat/mechanics/combatMath.ts`.
Also `weatherEffects.ts` has `Rainy`. The `combatMath.ts` `WEATHER_STAMINA_MOD` does not have `Rainy` listed, just `Blazing Sun`, `Scorching Wind`, etc. And it falls back to 1.0. Oh, wait, in `weatherEffects.ts`, `staminaMult` is defined directly on the `WeatherEffect` object!
Is `weatherStaminaModifier` in `combatMath.ts` even used?

2. "Generating 200 new localized names for gladiators."
There are names in `src/data/names/` maybe?

3. "Adding a random \"Tavern Brawl\" off-season event that risks minor injury but boosts reputation."
Oh, wait! "tavern_brawl" is ALREADY in `src/engine/pipeline/seasonal.ts` and `src/data/narrativeContent.json`!

Let us check what the prompt says: "Create: Dreams up minor gameplay additions that fit the Design Bible. For example: ... Output Commit: Implements the feature end-to-end (the data, the math modifier, and the UI badge), hooking it into the existing pipeline and committing the feature as a surprise for the morning."
So I need to DREAM UP a NEW feature.

Let us add a new Offseason Event: "stray_cat"
Or let us add a new Weather condition: "Blood Rain"
Or a new Offseason Event: "mysterious_stranger"
Or "local_tournament"

Wait, the prompt says "minor gameplay additions that fit the Design Bible."
What about a new Off-season event: "gladiator_rebellion_rumor", or "found_artifact", or "training_accident", or "noble_patronage"?
Or I can add an offseason event "mysterious_patron" that grants gold but increases a hidden debt, or just grants gold and fame.
Or "local_festival" that increases popularity.

Let us add an off-season event: "street_performance".
"During the offseason, {{name}} took to the streets, performing mock battles for the local townsfolk. The crowd loved it! (+{{fame}} Fame, +{{gold}} Gold)"
Effect Type: `street_performance`.

Let us add this event to `src/data/narrativeContent.json`, `src/engine/pipeline/seasonal.ts`, and update the mock calls in `SeasonalPass.test.ts`.'
