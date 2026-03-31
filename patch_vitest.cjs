const fs = require('fs');
let content = fs.readFileSync('vitest.config.ts', 'utf8');
content = content.replace('environment: "node"', 'environment: "jsdom"');
fs.writeFileSync('vitest.config.ts', content, 'utf8');
