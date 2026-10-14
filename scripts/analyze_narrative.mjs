import fs from 'fs';
import path from 'path';

const dir = 'src/data/narrative';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));

function traverse(obj, path, res) {
  if (Array.isArray(obj)) {
    res.push({ path, length: obj.length, items: obj });
  } else if (obj !== null && typeof obj === 'object') {
    for (const key of Object.keys(obj)) {
      traverse(obj[key], path ? `${path}.${key}` : key, res);
    }
  }
}

for (const file of files) {
  const content = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf-8'));
  const arrays = [];
  traverse(content, '', arrays);

  for (const arr of arrays) {
    if (arr.length < 10) {
      console.log(`${file}: ${arr.path} has ${arr.length} items`);
    }
  }
}
