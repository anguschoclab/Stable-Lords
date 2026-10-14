import fs from 'fs';
import path from 'path';

function getSimilarity(str1, str2) {
  if (typeof str1 !== 'string' || typeof str2 !== 'string') return 0;
  if (str1 === str2) return 1.0;
  if (!str1 || !str2) return 0.0;

  // Use a simple Levenshtein distance based similarity
  const len1 = str1.length;
  const len2 = str2.length;

  // Prevent huge arrays from causing RangeError
  if (len1 > 1000 || len2 > 1000) return 0;

  const matrix = Array(len2 + 1).fill(null).map(() => Array(len1 + 1).fill(null));

  for (let i = 0; i <= len1; i++) matrix[0][i] = i;
  for (let j = 0; j <= len2; j++) matrix[j][0] = j;

  for (let j = 1; j <= len2; j++) {
    for (let i = 1; i <= len1; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      );
    }
  }

  const distance = matrix[len2][len1];
  const maxLen = Math.max(len1, len2);
  return 1 - (distance / maxLen);
}

const dir = 'src/data/narrative';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));

let totalRemoved = 0;
const removedEntries = {};

function dedupeArray(arr, path) {
  const toRemove = new Set();
  const retained = [];

  for (let i = 0; i < arr.length; i++) {
    if (toRemove.has(i)) continue;
    retained.push(arr[i]);
    for (let j = i + 1; j < arr.length; j++) {
      if (toRemove.has(j)) continue;
      const sim = getSimilarity(arr[i], arr[j]);
      if (sim >= 0.80) { // Set threshold to 80% to catch more near-duplicates
        toRemove.add(j);
        if (!removedEntries[path]) removedEntries[path] = [];
        removedEntries[path].push(arr[j]);
        totalRemoved++;
      }
    }
  }
  return retained;
}

function traverseAndDedupe(obj, currentPath) {
  if (Array.isArray(obj)) {
    if (obj.length > 0 && typeof obj[0] === 'string') {
      const beforeLength = obj.length;
      const deduped = dedupeArray(obj, currentPath);
      if (deduped.length !== beforeLength) {
        return deduped;
      }
      return obj;
    } else {
        return obj.map((item, idx) => traverseAndDedupe(item, `${currentPath}[${idx}]`));
    }
  } else if (obj !== null && typeof obj === 'object') {
    const newObj = {};
    for (const [key, value] of Object.entries(obj)) {
      newObj[key] = traverseAndDedupe(value, currentPath ? `${currentPath}.${key}` : key);
    }
    return newObj;
  }
  return obj;
}

for (const file of files) {
  const filePath = path.join(dir, file);
  const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  const newContent = traverseAndDedupe(content, file);
  fs.writeFileSync(filePath, JSON.stringify(newContent, null, 2) + '\n');
}

console.log(`Removed ${totalRemoved} near-duplicates (>= 80% similarity).`);
if (totalRemoved > 0) {
    fs.mkdirSync('.claude/backups/narrative', { recursive: true });
    // Merge with existing backup if it exists
    let existing = {};
    try {
        existing = JSON.parse(fs.readFileSync('.claude/backups/narrative/fuzzy_removed.json', 'utf-8'));
    } catch(e) {}
    const combined = { ...existing, ...removedEntries };
    fs.writeFileSync('.claude/backups/narrative/fuzzy_removed.json', JSON.stringify(combined, null, 2));
}
