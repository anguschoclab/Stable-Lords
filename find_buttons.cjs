const fs = require('fs');
const path = require('path');

function findButtons(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      findButtons(fullPath);
    } else if (fullPath.endsWith('.tsx')) {
      const content = fs.readFileSync(fullPath, 'utf8');

      const buttonRegex = /<Button\s+([^>]+)>/g;
      let match;
      while ((match = buttonRegex.exec(content)) !== null) {
        const props = match[1];
        if (props.includes('size="icon"')) {
          if (!props.includes('tooltip') && !props.includes('aria-label=')) {
             console.log(`${fullPath} line ${content.substring(0, match.index).split('\n').length}: lacks tooltip and aria-label`);
          } else if (props.includes('tooltip=') && !props.includes('aria-label=')) {
             console.log(`${fullPath} line ${content.substring(0, match.index).split('\n').length}: lacks aria-label (has tooltip)`);
          }
        }
      }
    }
  }
}

findButtons('./src');
