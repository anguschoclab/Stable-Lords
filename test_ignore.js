import { runSimulation } from "./src/scripts/simulation-harness";

const config = {
  weeks: 3,
  seed: 999,
  logFrequency: 1, 
};

// Override console.time inside weekPipelineService if we could...
// Let's modify weekPipelineService.ts directly to add console.time.
