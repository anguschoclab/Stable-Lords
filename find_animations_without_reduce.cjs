const fs = require('fs');
const path = require('path');

function checkFile(filepath) {
  const content = fs.readFileSync(filepath, 'utf8');
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check for animation classes without motion-reduce
    if ((line.includes('animate-') || line.includes('transition-') || line.includes('duration-') || line.includes('delay-'))
        && !line.includes('motion-reduce:')) {
      // Look if there are any obvious tailwind classes for animation/transition
      if (line.match(/animate-\w+|transition(-\w+)?|duration-\d+|delay-\d+/)) {
        console.log(`Missing motion-reduce: ${filepath}:${i+1}`);
      }
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
