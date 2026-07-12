const fs = require('fs');
const filepath = 'src/data/narrativeContent.json';
let content = fs.readFileSync(filepath, 'utf8');
let json = JSON.parse(content);

if (!json.offseason_events.midnight_market) {
  json.offseason_events.midnight_market = {
    title: "The Midnight Market",
    effectType: "midnight_market",
    newsletter: [
      "A hidden Midnight Market appeared behind the arena. {{name}} spent {{gold}} gold on strange elixirs and a whispered secret, gaining +20 XP and a new insight."
    ]
  };
  fs.writeFileSync(filepath, JSON.stringify(json, null, 2) + "\n", 'utf8');
  console.log("Added midnight_market to narrativeContent.json");
} else {
  console.log("midnight_market already exists");
}
