const fs = require('fs');
const path = require('path');

function checkFile(filepath) {
  const content = fs.readFileSync(filepath, 'utf8');
  // Very simplistic check: files with <input> or <Input> but no <Label> or <label>
  if ((content.includes('<input ') || content.includes('<Input ')) &&
      !(content.includes('<Label') || content.includes('<label') || content.includes('aria-label='))) {
      console.log(`Input might lack label: ${filepath}`);
  }
}

function traverseDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      traverseDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.jsx')) {
      checkFile(fullPath);
    }
  }
}

traverseDir('./src/components');
traverseDir('./src/pages');
