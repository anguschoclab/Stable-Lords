const fs = require('fs');

function levenshtein(a, b) {
  if(a.length === 0) return b.length;
  if(b.length === 0) return a.length;

  var matrix = [];
  var i;
  for(i = 0; i <= b.length; i++){
    matrix[i] = [i];
  }
  var j;
  for(j = 0; j <= a.length; j++){
    matrix[0][j] = j;
  }
  for(i = 1; i <= b.length; i++){
    for(j = 1; j <= a.length; j++){
      if(b.charAt(i-1) == a.charAt(j-1)){
        matrix[i][j] = matrix[i-1][j-1];
      } else {
        matrix[i][j] = Math.min(matrix[i-1][j-1] + 1, Math.min(matrix[i][j-1] + 1, matrix[i-1][j] + 1));
      }
    }
  }
  return matrix[b.length][a.length];
}

function similarity(s1, s2) {
  var longer = s1;
  var shorter = s2;
  if (s1.length < s2.length) {
    longer = s2;
    shorter = s1;
  }
  var longerLength = longer.length;
  if (longerLength == 0) {
    return 1.0;
  }
  return (longerLength - levenshtein(longer, shorter)) / parseFloat(longerLength);
}

function extractArray(content, arrayName) {
    const regex = new RegExp(`export const ${arrayName}: string\\[\\] = \\[\n([\\s\\S]*?)\n\\];`);
    const match = content.match(regex);
    if (!match) return [];

    return match[1].split(',\n')
        .map(s => s.trim().replace(/^['"](.*)['"]$/, '$1'))
        .filter(s => s.length > 0);
}

const fileContent = fs.readFileSync('src/engine/narrative/lore/loreData.ts', 'utf8');

const arrays = ['ORIGINS', 'CHILDHOOD_TRAITS', 'DEFINING_MOMENTS'];
const threshold = 0.8;

for (const name of arrays) {
    console.log(`Checking ${name}...`);
    const items = extractArray(fileContent, name);
    for (let i = 0; i < items.length; i++) {
        for (let j = i + 1; j < items.length; j++) {
            const sim = similarity(items[i], items[j]);
            if (sim >= threshold) {
                console.log(`DUPLICATE FOUND (Sim: ${sim.toFixed(2)})`);
                console.log(`  1: ${items[i]}`);
                console.log(`  2: ${items[j]}`);
            }
        }
    }
}
