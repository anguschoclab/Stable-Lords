// Aggregate a V8 .cpuprofile: self-time per function (by hitCount * sampleInterval)
const prof = JSON.parse(await Bun.file(process.argv[2]).text());
const nodes = new Map(prof.nodes.map(n => [n.id, n]));
const byKey = new Map();
for (const n of prof.nodes) {
  const f = n.callFrame;
  const key = `${f.functionName || '(anon)'} @ ${f.url.split('/').slice(-3).join('/')}:${f.lineNumber}`;
  byKey.set(key, (byKey.get(key) ?? 0) + (n.hitCount ?? 0));
}
const total = [...byKey.values()].reduce((a, b) => a + b, 0);
const rows = [...byKey.entries()].map(([k, h]) => ({ k, ms: (h * (prof.sampleInterval ?? 1000)) / 1000 })).sort((a, b) => b.ms - a.ms);
console.log(`total sampled: ${(total * (prof.sampleInterval ?? 1000) / 1000).toFixed(0)}ms`);
for (const r of rows.slice(0, 45)) console.log(`${r.ms.toFixed(0).padStart(7)}ms  ${r.k}`);
