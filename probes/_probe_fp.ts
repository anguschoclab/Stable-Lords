import { runSimulation } from '../src/scripts/simulation-harness';
import { createHash } from 'crypto';
const r = await runSimulation({ weeks: 104, seed: 12345, logFrequency: 1000, ignoreBankruptcy: true });
const s: any = r.finalState ?? (r as any).state;
const fp = { treasury: s.treasury, rivalT: s.rivals.map((x: any) => x.treasury), grave: s.graveyard.map((w: any) => w.id), hist: s.arenaHistory.map((b: any) => b.id + b.winner + b.by), fame: s.rivals.map((x: any) => x.roster.map((w: any) => w.fame)) };
console.log('FP', createHash('sha256').update(JSON.stringify(fp)).digest('hex').slice(0, 16), r.cumulative.totalBouts, r.cumulative.deaths);
