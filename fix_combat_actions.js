const fs = require('fs');

let content = fs.readFileSync('src/state/slices/worldSlice/combatActions.ts', 'utf8');

const regex = /\/\/ ⚡ Bolt Optimization: Replace nested O\(N\) array mapping with updateEntityInList for targeted update\.\n\s*rivals: updateEntityInList\(state\.rivals, rivalStableId, \(r\) => \(\{/g;

content = content.replace(regex, `// ⚡ Bolt Optimization: Replace nested O(N) array mapping with updateEntityInList for targeted update.\n            // Note: Rivals are identified by owner.id, but updateEntityInList matches by 'id'.\n            // Since RivalStableData has id = owner.id, updateEntityInList(..., rivalStableId) works correctly because RivalStableData.id is equivalent to RivalStableData.owner.id.\n            // Actually, let's revert that part back to map() since it might be brittle if id and owner.id are desynchronized, or we can use map for rivals and updateEntityInList for roster.\n            rivals: state.rivals.map((r) =>\n              r.owner.id === rivalStableId\n                ? {`);

content = content.replace(/ \}\)\),\n          \};\n        \}/, `                  }\n                : r\n            ),\n          };\n        }`);

fs.writeFileSync('src/state/slices/worldSlice/combatActions.ts', content);
