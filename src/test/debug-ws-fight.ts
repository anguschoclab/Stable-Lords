/**
 * Debug script: trace WS vs BA fight outcomes
 * Run: bunx tsx src/test/debug-ws-fight.ts
 */
import { simulateFight, defaultPlanForWarrior } from "@/engine/simulate";
import { FightingStyle, type Warrior, type FightPlan } from "@/types/game";
import { computeWarriorStats } from "@/engine/skillCalc";

function makeWarrior(
  name: string,
  style: FightingStyle,
  attrs: Partial<Record<"ST" | "CN" | "SZ" | "WT" | "WL" | "SP" | "DF", number>> = {},
): Warrior {
  const full = { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10, ...attrs };
  const { baseSkills, derivedStats } = computeWarriorStats(full, style);
  return {
    id: `test_${name}`,
    name,
    style,
    attributes: full,
    baseSkills,
    derivedStats,
    fame: 0,
    popularity: 0,
    titles: [],
    injuries: [],
    flair: [],
    career: { wins: 0, losses: 0, kills: 0 },
    champion: false,
    status: "Active",
    age: 20,
  };
}

const wA = makeWarrior("Basher", FightingStyle.BashingAttack, { ST: 14, CN: 12 });
const wD = makeWarrior("Wall", FightingStyle.WallOfSteel, { SP: 15, DF: 15, WL: 14, CN: 14 });

console.log("\n=== BASHER (A) stats ===");
console.log("Attrs:", wA.attributes);
console.log("Skills:", wA.baseSkills);
console.log("Derived:", wA.derivedStats);

console.log("\n=== WALL OF STEEL (D) stats ===");
console.log("Attrs:", wD.attributes);
console.log("Skills:", wD.baseSkills);
console.log("Derived:", wD.derivedStats);

const planA: FightPlan = { style: FightingStyle.BashingAttack, OE: 8, AL: 6, killDesire: 5, target: "Any" };
const planD: FightPlan = { style: FightingStyle.WallOfSteel, OE: 4, AL: 5, killDesire: 5, target: "Any" };

let wallWins = 0;
let bashWins = 0;
let draws = 0;

const by: Record<string, number> = {};

console.log("\n=== FIGHT OUTCOMES (seeds 1-40) ===");
for (let seed = 1; seed <= 40; seed++) {
  const r = simulateFight(planA, planD, wA, wD, seed);
  if (r.winner === "D") wallWins++;
  else if (r.winner === "A") bashWins++;
  else draws++;

  const key = `${r.winner ?? "null"}-${r.by ?? "null"}`;
  by[key] = (by[key] || 0) + 1;
}

console.log(`\nWall wins: ${wallWins}/40, Bash wins: ${bashWins}/40, Draws: ${draws}/40`);
console.log("Outcome breakdown:", by);

// Show a few fights in detail
console.log("\n=== SEED 1 FIGHT DETAIL ===");
const r1 = simulateFight(planA, planD, wA, wD, 1);
console.log(`Winner: ${r1.winner}, By: ${r1.by}, Minutes: ${r1.minutes}`);
console.log(`Post: hitsA=${r1.post?.hitsA}, hitsD=${r1.post?.hitsD}`);
console.log("Log (first 15 entries):");
r1.log.slice(0, 15).forEach(e => console.log(`  [${e.minute}] ${e.text}`));
