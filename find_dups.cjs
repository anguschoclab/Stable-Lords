const fs = require('fs');
const path = require('path');

function stringSimilarity(s1, s2) {
  if (s1 === s2) return 1.0;
  if (!s1 || !s2) return 0.0;

  // Basic Levenshtein distance
  const matrix = [];
  for (let i = 0; i <= s1.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= s2.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= s1.length; i++) {
    for (let j = 1; j <= s2.length; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  const distance = matrix[s1.length][s2.length];
  return 1 - (distance / Math.max(s1.length, s2.length));
}

function analyzeFile(filePath) {
  const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const results = [];
  const duplicates = [];

  function traverse(obj, pathStr) {
    if (Array.isArray(obj)) {
      if (obj.length < 10) {
        results.push(`[<10] ${pathStr}: ${obj.length} items`);
      }
      for (let i = 0; i < obj.length; i++) {
        for (let j = i + 1; j < obj.length; j++) {
          const sim = stringSimilarity(obj[i], obj[j]);
          if (sim > 0.85) {
            duplicates.push(`[SIM: ${sim.toFixed(2)}] ${pathStr}:\n  "${obj[i]}"\n  "${obj[j]}"`);
          }
        }
      }
    } else if (typeof obj === 'object' && obj !== null) {
      for (const key in obj) {
        traverse(obj[key], pathStr ? `${pathStr}.${key}` : key);
      }
    }
  }

  traverse(content, '');
  return { results, duplicates };
}

['src/data/narrative/combatStrikes.json', 'src/data/narrative/combatPbp.json', 'src/data/narrative/combatKillText.json'].forEach(file => {
  console.log(`\n=== ${file} ===`);
  const { results, duplicates } = analyzeFile(file);
  results.forEach(r => console.log(r));
  console.log(`Found ${duplicates.length} near-duplicates.`);
  duplicates.forEach(d => console.log(d));
});
