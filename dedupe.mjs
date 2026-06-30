import fs from 'fs';

// Helper for Levenshtein distance
function levenshteinDistance(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

function calculateSimilarity(str1, str2) {
  const maxLength = Math.max(str1.length, str2.length);
  if (maxLength === 0) return 1.0;
  const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
  return 1 - distance / maxLength;
}

const excludedKeys = new Set(['names', 'epithets', 'adjectives', 'adverbs', 'titles', 'first_names', 'last_names']);

function dedupeArray(arr, pathContext, removedItems) {
  if (!Array.isArray(arr) || arr.length === 0 || typeof arr[0] !== 'string') {
    return arr;
  }

  // Skip arrays with short strings
  const avgLength = arr.reduce((sum, str) => sum + str.length, 0) / arr.length;
  if (avgLength < 15) {
      return arr;
  }

  const keptItems = [];

  // We iterate backwards so that we keep the NEWEST version of a string
  for (let i = arr.length - 1; i >= 0; i--) {
      const currentItem = arr[i];
      let isDuplicate = false;

      for (const keptItem of keptItems) {
          if (calculateSimilarity(currentItem, keptItem) > 0.80) {
              isDuplicate = true;
              break;
          }
      }

      if (isDuplicate) {
          removedItems.push({
              path: pathContext,
              item: currentItem
          });
      } else {
          keptItems.unshift(currentItem);
      }
  }

  return keptItems;
}

function traverseAndDedupe(obj, pathContext, removedItems) {
  if (Array.isArray(obj)) {
    return dedupeArray(obj, pathContext, removedItems);
  } else if (typeof obj === 'object' && obj !== null) {
    const newObj = {};
    for (const key in obj) {
      if (excludedKeys.has(key)) {
        newObj[key] = obj[key]; // Skip deduping entirely
      } else {
        newObj[key] = traverseAndDedupe(obj[key], `${pathContext}.${key}`, removedItems);
      }
    }
    return newObj;
  }
  return obj;
}


async function run() {
  const removedItems = [];

  // Dedupe narrativeContent.json
  const jsonPath = 'src/data/narrativeContent.json';
  const jsonContent = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const dedupedJson = traverseAndDedupe(jsonContent, 'narrativeContent', removedItems);
  fs.writeFileSync(jsonPath, JSON.stringify(dedupedJson, null, 2), 'utf8');

  // Dedupe loreGenerator.ts
  const tsPath = 'src/engine/narrative/loreGenerator.ts';
  let tsContent = fs.readFileSync(tsPath, 'utf8');

  const arrayRegex = /const\s+(ORIGINS|CHILDHOOD_TRAITS|DEFINING_MOMENTS)\s*=\s*\[([\s\S]*?)\];/g;

  tsContent = tsContent.replace(arrayRegex, (match, arrayName, arrayContent) => {
      // Parse the array
      const items = arrayContent
          .split(/,\s*\n/)
          .map(s => s.trim().replace(/^['"](.*)['"]$/, '$1'))
          .filter(s => s.length > 0);

      const keptItems = dedupeArray(items, `loreGenerator.${arrayName}`, removedItems);

      const newArrayContent = keptItems.map(item => `  '${item.replace(/'/g, "\\'")}'`).join(',\n') + ',\n';
      return `const ${arrayName} = [\n${newArrayContent}];`;
  });

  fs.writeFileSync(tsPath, tsContent, 'utf8');

  // Write removed items
  const backupDir = '.claude/backups/narrative/lore';
  const backupPath = `${backupDir}/removed_duplicates.json`;

  if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
  }

  let existingRemoved = [];
  if (fs.existsSync(backupPath)) {
      try {
          existingRemoved = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
      } catch (e) {
          console.error("Could not parse existing backup file.");
      }
  }

  const allRemoved = [...existingRemoved];

  for (const item of removedItems) {
      // Very simple deduplication of the backup file itself
      const exists = existingRemoved.some(existing => existing.item === item.item && existing.path === item.path);
      if (!exists) {
          allRemoved.push(item);
      }
  }

  fs.writeFileSync(backupPath, JSON.stringify(allRemoved, null, 2), 'utf8');
  console.log(`Deduplication complete. Removed ${removedItems.length} items.`);
}

run();
