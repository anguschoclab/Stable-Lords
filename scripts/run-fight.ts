/**
 * Run a single fight headlessly and print the full play-by-play.
 *
 * Build + run:
 *   bun scripts/build-fight.ts && bun scripts/.build/run-fight.js [seed] [styleA] [styleD]
 *
 * Styles use FightingStyle enum values, e.g. "STRIKING ATTACK" "PARRY-RIPOSTE".
 */
import { simulateFight, defaultPlanForWarrior } from '@/engine/simulate';
import { FightingStyle } from '@/types/shared.types';
import { getStyleDefaultLoadout } from '@/data/equipment';
import { loadCombatNarrative } from '@/data/narrative';
import { makeWarrior } from '@/test/engine/combat/_helpers';
import type { Warrior } from '@/types/warrior.types';

// The app lazy-loads combat narrative templates at startup; do the same so
// PBP lines resolve to real archive text instead of the generic fallback.
await loadCombatNarrative();

const seed = Number(process.argv[2] ?? 42);

const styleArg = (v: string | undefined, fallback: FightingStyle): FightingStyle =>
  Object.values(FightingStyle).find((s) => s === v?.toUpperCase()) ?? fallback;

const styleA = styleArg(process.argv[3], FightingStyle.LungingAttack);
const styleD = styleArg(process.argv[4], FightingStyle.ParryRiposte);

const attrsA = { ST: 13, CN: 12, SZ: 9, WT: 15, WL: 15, SP: 17, DF: 15 };
const attrsD = { ST: 12, CN: 15, SZ: 11, WT: 16, WL: 14, SP: 11, DF: 17 };

const withEquipment = (w: Warrior): Warrior => ({
  ...w,
  equipment: getStyleDefaultLoadout(w.style),
});

const warriorA = withEquipment(makeWarrior('Varrek the Quick', styleA, attrsA));
const warriorD = withEquipment(makeWarrior('Stonefist Maren', styleD, attrsD));

const outcome = simulateFight(
  defaultPlanForWarrior(warriorA),
  defaultPlanForWarrior(warriorD),
  warriorA,
  warriorD,
  seed,
  undefined,
  'Clear',
  'standard_arena',
  undefined,
  false
);

console.log(`=== ${warriorA.name} (${styleA}) vs ${warriorD.name} (${styleD}) — seed ${seed} ===\n`);

let lastMinute = 0;
for (const e of outcome.log) {
  if (e.minute !== lastMinute) {
    lastMinute = e.minute;
    console.log();
  }
  console.log(e.text);
}

const winnerName =
  outcome.winner === 'A' ? warriorA.name : outcome.winner === 'D' ? warriorD.name : 'nobody';
console.log(`\n=== Result: ${winnerName} wins by ${outcome.by} in ${outcome.minutes} minute(s) ===`);
console.log(
  `hits: A=${outcome.post?.hitsA ?? 0} D=${outcome.post?.hitsD ?? 0}` +
    (outcome.post?.tags?.length ? ` | tags: ${outcome.post.tags.join(', ')}` : '')
);
