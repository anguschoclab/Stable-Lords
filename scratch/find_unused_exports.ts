
import fs from 'fs';
import path from 'path';

const srcDir = path.join(process.cwd(), 'src');

function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getAllFiles(filePath, fileList);
    } else if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
      fileList.push(filePath);
    }
  });
  return fileList;
}

const allFiles = getAllFiles(srcDir);
const exportRegex = /export\s+(const|function|type|interface|enum|class|async\s+function)\s+([a-zA-Z0-9_]+)/g;

const exportsByFile = {};
const allImportedNames = new Set();

allFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf-8');
  
  // Find exports
  let match;
  while ((match = exportRegex.exec(content)) !== null) {
    const name = match[2];
    if (!exportsByFile[file]) exportsByFile[file] = [];
    exportsByFile[file].push(name);
  }
  
  // Find imports (simple approach: match any word that looks like it's being used)
  // This is a bit coarse but good for a first pass
  const lines = content.split('\n');
  lines.forEach(line => {
    if (!line.trim().startsWith('export')) {
      // Find all words and add to set
      const words = line.match(/[a-zA-Z0-9_]+/g);
      if (words) {
        words.forEach(word => allImportedNames.add(word));
      }
    }
  });
});

console.log('Potentially unused exports (names not found in any non-exporting line):');
Object.entries(exportsByFile).forEach(([file, names]) => {
  const unusedInFile = names.filter(name => !allImportedNames.has(name));
  if (unusedInFile.length > 0) {
    console.log(`\nFile: ${file}`);
    unusedInFile.forEach(name => console.log(`  - ${name}`));
  }
});
