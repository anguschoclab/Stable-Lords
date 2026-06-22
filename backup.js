const fs = require('fs');
const backupPath = '.claude/backups/narrative/lore/removed_duplicates.json';
const data = [
  { file: 'src/data/arenas.ts', content: 'The Shattered Echoes', duplicateOf: 'The Shattered Echo' },
  { file: 'src/engine/narrative/loreGenerator.ts', content: 'Unearthed alive from a shallow grave behind the old executioner\'s block', duplicateOf: 'Raised in the shadow of the executioner\'s block' }
];
fs.writeFileSync(backupPath, JSON.stringify(data, null, 2));
