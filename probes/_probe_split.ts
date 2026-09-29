import * as H from '../src/scripts/simulation-harness';
let last = performance.now(); const gaps: number[] = [];
await H.runSimulation({ weeks: 40, seed: 12345, logFrequency: 1000, ignoreBankruptcy: true, onWeek: () => { const n = performance.now(); gaps.push(n - last); last = n; } });
console.log('avg ms/week (full loop)', (gaps.slice(5).reduce((a, b) => a + b, 0) / (gaps.length - 5)).toFixed(0));
