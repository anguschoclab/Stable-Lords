const fs = require('fs');

function extractArray(content, arrayName) {
  const regex = new RegExp(`export const ${arrayName}: string\\[\\] = \\[([\\s\\S]*?)\\];`);
  const match = content.match(regex);
  if (!match) return [];
  const items = match[1].split(',').map(s => s.trim().replace(/^['"](.*)['"]$/, '$1')).filter(Boolean);
  return items;
}

function jaccard(s1, s2) {
  const set1 = new Set(s1.toLowerCase().split(/\s+/));
  const set2 = new Set(s2.toLowerCase().split(/\s+/));
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  return intersection.size / union.size;
}

const files = [
  { path: 'src/engine/narrative/lore/origins.ts', name: 'ORIGINS' },
  { path: 'src/engine/narrative/lore/childhoodTraits.ts', name: 'CHILDHOOD_TRAITS' },
  { path: 'src/engine/narrative/lore/definingMoments.ts', name: 'DEFINING_MOMENTS' }
];

for (const file of files) {
  const content = fs.readFileSync(file.path, 'utf8');
  const items = extractArray(content, file.name);
  console.log(`\nChecking ${file.name} (total ${items.length} items)...`);
  const duplicates = [];
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const sim = jaccard(items[i], items[j]);
      if (sim > 0.6) { // lower threshold to catch near identical
        duplicates.push({i, j, sim, item1: items[i], item2: items[j]});
      }
    }
  }
  duplicates.sort((a, b) => b.sim - a.sim);
  for (const dup of duplicates) {
    console.log(`Sim: ${dup.sim.toFixed(2)}\n - ${dup.item1}\n - ${dup.item2}`);
  }
}
