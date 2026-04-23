
import fs from 'fs';
import path from 'path';

const dir = 'src/engine/pipeline/passes';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.ts'));

files.forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // Regex to match the PASS_METADATA block
  const regex = /export const PASS_METADATA = \{[\s\S]*?\};\n\n?/g;
  
  if (regex.test(content)) {
    console.log(`Removing PASS_METADATA from ${filePath}`);
    content = content.replace(regex, '');
    fs.writeFileSync(filePath, content);
  }
});

// Also check seasonal.ts
const seasonalPath = 'src/engine/pipeline/seasonal.ts';
if (fs.existsSync(seasonalPath)) {
  let content = fs.readFileSync(seasonalPath, 'utf-8');
  const regex = /export const PASS_METADATA = \{[\s\S]*?\};\n\n?/g;
  if (regex.test(content)) {
    console.log(`Removing PASS_METADATA from ${seasonalPath}`);
    content = content.replace(regex, '');
    fs.writeFileSync(seasonalPath, content);
  }
}
