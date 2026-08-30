import fs from 'fs';
import path from 'path';

function checkFile(filepath) {
  const content = fs.readFileSync(filepath, 'utf8');
  let inButton = false;
  let hasSizeIcon = false;
  let hasAriaLabel = false;
  let hasTooltip = false;
  let buttonStartLine = 0;

  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.includes('<Button') && !line.includes('</Button>')) {
      inButton = true;
      hasSizeIcon = false;
      hasAriaLabel = false;
      hasTooltip = false;
      buttonStartLine = i + 1;
    }

    if (inButton) {
      if (line.includes('size="icon"')) hasSizeIcon = true;
      if (line.includes('aria-label=')) hasAriaLabel = true;
      if (line.includes('tooltip=')) hasTooltip = true;

      if (line.includes('>')) {
        inButton = false;
        if (hasSizeIcon && !hasAriaLabel && !hasTooltip) {
          console.log(`${filepath} line ${buttonStartLine}: lacks tooltip and aria-label`);
        }
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
    } else if (fullPath.endsWith('.tsx')) {
      checkFile(fullPath);
    }
  }
}

traverseDir('./src/components');
