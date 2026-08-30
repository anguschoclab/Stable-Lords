const fs = require('fs');
const path = require('path');

function checkFile(filepath) {
  const content = fs.readFileSync(filepath, 'utf8');
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check for Input or input without id
    if ((line.includes('<Input ') || line.includes('<input ')) && !line.includes('id=')) {
      console.log(`Input without id: ${filepath}:${i+1}`);
    }
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
