const fs = require('fs');
const filepath = 'src/test/engine/combat/weatherEffects.test.ts';
let content = fs.readFileSync(filepath, 'utf8');

if (!content.includes("'Eldritch Eclipse',")) {
  content = content.replace(/'Ashfall',/g, "'Ashfall',\n        'Eldritch Eclipse',");
  fs.writeFileSync(filepath, content, 'utf8');
  console.log("Updated weatherEffects.test.ts");
} else {
  console.log("Already updated tests");
}
