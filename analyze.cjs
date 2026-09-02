const fs = require('fs');

const strikes = JSON.parse(fs.readFileSync('src/data/narrative/combatStrikes.json', 'utf8'));
const pbp = JSON.parse(fs.readFileSync('src/data/narrative/combatPbp.json', 'utf8'));
const killText = JSON.parse(fs.readFileSync('src/data/narrative/combatKillText.json', 'utf8'));

function count(obj, path = '') {
  for (const key in obj) {
    if (Array.isArray(obj[key])) {
      if (obj[key].length < 10) {
        console.log(`[<10] ${path}${key}: ${obj[key].length} items`);
      }
    } else if (typeof obj[key] === 'object') {
      count(obj[key], path + key + '.');
    }
  }
}

console.log("=== STRIKES ===");
count(strikes);
console.log("\n=== PBP ===");
count(pbp);
console.log("\n=== KILL TEXT ===");
count(killText);
