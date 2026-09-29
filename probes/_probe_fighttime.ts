import { FightingStyle } from '../src/types/game';
import { simulateFight, defaultPlanForWarrior } from '../src/engine/simulate';
import { loadCombatNarrative } from '../src/data/narrative';
import { makeComputedWarrior } from '../src/test/_fixtures/factories';
import { generateArchetypeAttrs } from '../src/engine/factories/statGeneration';
import { SeededRNGService } from '../src/utils/random';
await loadCombatNarrative(); const S = Object.values(FightingStyle); const rng = new SeededRNGService(3);
const ws = Array.from({ length: 200 }, (_, i) => makeComputedWarrior(generateArchetypeAttrs(S[i % 10], rng), S[i % 10], { id: `w${i}` as any, name: 'x', fame: 0, age: 20 }));
for (const headless of [false, true]) { const t = performance.now(); for (let i = 0; i < 2000; i++) { const a = ws[i % 200], d = ws[(i * 7 + 3) % 200]; simulateFight(defaultPlanForWarrior(a), defaultPlanForWarrior(d), a, d, i, undefined, undefined, undefined, undefined, headless); }
  console.log(`headless=${headless}: ${((performance.now() - t) / 2000).toFixed(3)} ms/fight`); }
