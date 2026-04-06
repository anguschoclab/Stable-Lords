import { runSimulation } from "./src/scripts/simulation-harness";

const config = {
  weeks: 4,
  seed: 999,
  logFrequency: 1, 
};

console.log("[Sim] Start");
console.time("Simulation");
runSimulation(config);
console.timeEnd("Simulation");
console.log("[Sim] End");
