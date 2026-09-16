const fs = require('fs');
const path = require('path');

const filesToCheck = [
  'src/data/narrative/combatStrikes.json',
  'src/data/narrative/combatPbp.json',
  'src/data/narrative/combatKillText.json'
];

function levenshtein(a, b) {
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
      if (b.charAt(i - 1) == a.charAt(j - 1)) {
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

function similarity(a, b) {
  const dist = levenshtein(a.toLowerCase(), b.toLowerCase());
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1.0;
  return (maxLen - dist) / maxLen;
}

let removedCount = 0;
let consolidatedCount = 0;
let backups = [];
const underrepresented = [];

function getText(item) {
  return typeof item === 'string' ? item : item.text;
}

function walk(obj, jsonPath = '') {
  if (Array.isArray(obj)) {
    if (obj.length > 0 && (typeof obj[0] === 'string' || obj[0].text)) {
      // Find duplicates
      const toRemove = new Set();
      for (let i = 0; i < obj.length; i++) {
        if (toRemove.has(i)) continue;
        for (let j = i + 1; j < obj.length; j++) {
          if (toRemove.has(j)) continue;
          const textI = getText(obj[i]);
          const textJ = getText(obj[j]);
          if (similarity(textI, textJ) > 0.85) {
            toRemove.add(j);
            backups.push({ path: jsonPath, item: obj[j], reason: 'Duplicate/near-duplicate of: ' + textI });
            if (textI === textJ) {
              removedCount++;
            } else {
              consolidatedCount++;
            }
          }
        }
      }

      const newArr = obj.filter((_, idx) => !toRemove.has(idx));

      if (newArr.length < 10) {
        underrepresented.push({ path: jsonPath, count: newArr.length });
      }

      return newArr;
    } else {
      return obj.map((item, idx) => walk(item, `${jsonPath}[${idx}]`));
    }
  } else if (obj && typeof obj === 'object') {
    const newObj = {};
    for (const [k, v] of Object.entries(obj)) {
      newObj[k] = walk(v, jsonPath ? `${jsonPath}.${k}` : k);
    }
    return newObj;
  }
  return obj;
}

for (const file of filesToCheck) {
  console.log(`Analyzing ${file}...`);
  const data = JSON.parse(fs.readFileSync(file, 'utf-8'));
  const newData = walk(data);
  fs.writeFileSync(file, JSON.stringify(newData, null, 2));
}

console.log(`\nRemoved exact duplicates: ${removedCount}`);
console.log(`Consolidated near-duplicates: ${consolidatedCount}`);
console.log(`\nUnderrepresented categories (< 10 items):`);
for (const u of underrepresented) {
  console.log(`  ${u.path} (${u.count} items)`);
}

if (!fs.existsSync('.claude/backups/narrative')) {
  fs.mkdirSync('.claude/backups/narrative', { recursive: true });
}
fs.writeFileSync('.claude/backups/narrative/archived_entries.json', JSON.stringify(backups, null, 2));
console.log(`\nArchived ${backups.length} entries to .claude/backups/narrative/archived_entries.json`);
