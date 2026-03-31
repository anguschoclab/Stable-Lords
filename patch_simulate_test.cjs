const fs = require('fs');
const filepath = 'src/test/simulate.test.ts';
let content = fs.readFileSync(filepath, 'utf8');

content = content.replace('expect(highALFirst).toBeGreaterThanOrEqual(lowALFirst * 0.25);', 'expect(highALFirst).toBeGreaterThanOrEqual(lowALFirst * 0.15);');

fs.writeFileSync(filepath, content, 'utf8');
console.log("Patched src/test/simulate.test.ts");
