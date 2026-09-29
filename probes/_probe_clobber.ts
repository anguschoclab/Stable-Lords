(globalThis as any).__SL_DEBUG_CLOBBER = true;
const { runSimulation } = await import('../src/scripts/simulation-harness');
await runSimulation({ weeks: 12, seed: 12345, logFrequency: 1000, ignoreBankruptcy: true });
for (const [k, [rev, rv]] of ((globalThis as any).__SL_CLOBBER ?? new Map())) console.log(`reverted=${rev} revived=${rv}\n   ${k}`);
