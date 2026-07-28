const fs = require('fs');
const data = JSON.parse(fs.readFileSync('src/data/narrativeContent.json', 'utf8'));
console.log(Object.keys(data.offseason_events).length);
