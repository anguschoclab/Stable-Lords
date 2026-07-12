const fs = require('fs');
const filepath = 'src/engine/pipeline/seasonal.ts';
let content = fs.readFileSync(filepath, 'utf8');

// 1. Add type
if (!content.includes("| 'midnight_market'")) {
  content = content.replace(/\| 'loyal_stray_dog';/, "| 'loyal_stray_dog'\n    | 'midnight_market';");
}

// 2. Add handler
const handlerCode = `
function handleMidnightMarket(
  state: GameState,
  nextWeek: number,
  e: OffseasonEventNarrative,
  rng: IRNGService,
  ctx: OffseasonEventContext
) {
  const activeWarriors = getActiveWarriors(state);
  if (activeWarriors.length > 0) {
    const chosen = rng.pick(activeWarriors);
    if (chosen) {
      const cost = 40;
      ctx.treasuryDelta -= cost;
      addLedger(ctx, rng, nextWeek, 'Midnight Market Elixirs', -cost, 'other');

      const xpGained = 20;
      ctx.rosterUpdates.set(chosen.id, {
        xp: (chosen.xp || 0) + xpGained,
      });

      ctx.insightTokens.push({
        id: rng.uuid('insight') as InsightId,
        type: 'Tactic',
        warriorId: chosen.id,
        warriorName: chosen.name,
        detail: 'Whispers from the Midnight Market revealed a new tactic.',
        origin: 'Midnight Market',
        discoveredWeek: nextWeek,
      });

      pushNarrative(ctx, rng, nextWeek, e, {
        name: chosen.name,
        gold: cost,
      });
    }
  }
}
`;
if (!content.includes("function handleMidnightMarket(")) {
  content = content.replace(/const EVENT_HANDLERS/, `${handlerCode}\nconst EVENT_HANDLERS`);
}

// 3. Register handler
if (!content.includes("midnight_market: handleMidnightMarket")) {
  content = content.replace(/loyal_stray_dog: handleLoyalStrayDog,/, "loyal_stray_dog: handleLoyalStrayDog,\n  midnight_market: handleMidnightMarket,");
}

fs.writeFileSync(filepath, content, 'utf8');
console.log("Updated seasonal.ts");
