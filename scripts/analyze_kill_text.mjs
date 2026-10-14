import fs from 'fs';
import path from 'path';

const dir = 'src/data/narrative';
const killTextFile = path.join(dir, 'combatKillText.json');
const content = JSON.parse(fs.readFileSync(killTextFile, 'utf-8'));
const arrays = [];

function traverse(obj, path, res) {
  if (Array.isArray(obj)) {
    res.push({ path, length: obj.length, items: obj });
  } else if (obj !== null && typeof obj === 'object') {
    for (const key of Object.keys(obj)) {
      traverse(obj[key], path ? `${path}.${key}` : key, res);
    }
  }
}

traverse(content.kill_text, '', arrays);

for (const arr of arrays) {
    console.log(`${arr.path} has ${arr.length} items`);
}
