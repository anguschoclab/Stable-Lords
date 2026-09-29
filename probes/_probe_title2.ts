import { runSimulation } from '../src/scripts/simulation-harness';
const deathWeek = new Map<string, number>(); const reigns = new Map<string, any>();
await runSimulation({ weeks: 120, seed: 12345, logFrequency: 1000, ignoreBankruptcy: true,
  onWeek: (s: any) => { const wk = s.absoluteWeek ?? s.week;
    for (const w of s.graveyard ?? []) if (!deathWeek.has(w.id)) deathWeek.set(w.id, w.deathWeek ?? wk);
    for (const [a, t] of Object.entries<any>(s.arenaChampions ?? {})) for (const h of t.history ?? []) reigns.set(a + h.warriorId + h.startedAbsoluteWeek, h); } });
const died = [...reigns.values()].filter(h => h.endReason === 'died');
const deadBeforeCrown = died.filter(h => (deathWeek.get(h.warriorId) ?? 1e9) < h.startedAbsoluteWeek);
const len = (a: any[]) => a.length ? +(a.reduce((x, h) => x + h.endedAbsoluteWeek - h.startedAbsoluteWeek, 0) / a.length).toFixed(1) : 0;
const uniq = new Set(died.map(h => h.warriorId));
console.log(JSON.stringify({ died: died.length, uniqueDeadChamps: uniq.size, alreadyDeadWhenCrowned: deadBeforeCrown.length, avgReignWeeksDied: len(died), zeroLengthDied: died.filter(h => h.endedAbsoluteWeek === h.startedAbsoluteWeek).length, avgReignWeeksDefeated: len([...reigns.values()].filter(h => h.endReason === 'defeated')) }));
