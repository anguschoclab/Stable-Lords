const fs = require('fs');
const filepath = 'src/types/shared.types.ts';
let content = fs.readFileSync(filepath, 'utf8');

if (!content.includes("'Eldritch Eclipse'")) {
  content = content.replace(/\| 'Ashfall'/, "| 'Ashfall'\n  | 'Eldritch Eclipse'");
  fs.writeFileSync(filepath, content, 'utf8');
  console.log("Added Eldritch Eclipse to WeatherType");
} else {
  console.log("Eldritch Eclipse already exists");
}
