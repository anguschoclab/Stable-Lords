import { runRivalStrategyPass } from "./src/engine/pipeline/passes/RivalStrategyPass";
import { createFreshState } from "./src/engine/factories";
import { populateInitialWorld } from "./src/engine/core/worldSeeder";

let state = populateInitialWorld(createFreshState(), 123);

for (let w = 1; w <= 3; w++) {
  console.time(`Week ${w} - runRivalStrategyPass`);
  state = runRivalStrategyPass(state, w);
  console.timeEnd(`Week ${w} - runRivalStrategyPass`);
}
