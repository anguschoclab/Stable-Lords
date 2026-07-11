const fs = require('fs');
const filepath = 'src/data/names/warriorNames.ts';
let content = fs.readFileSync(filepath, 'utf8');

const newNames = `  'VOIDBRINGER',
  'STARFALL',
  'CHAOSSPARK',
  'DOOMHAMMER',
  'NIGHTWEAVER',
  'ECLIPSEKNIGHT',
  'BLOODSTAR',
  'SHADOWFLARE',
  'ASTRALFIEND',
  'NEONBLADE',
`;

if (!content.includes("'VOIDBRINGER'")) {
  content = content.replace(/export const WARRIOR_NAMES = \[/, `export const WARRIOR_NAMES = [\n${newNames}`);
  fs.writeFileSync(filepath, content, 'utf8');
  console.log("Added new names to WARRIOR_NAMES");
} else {
  console.log("Names already added");
}
