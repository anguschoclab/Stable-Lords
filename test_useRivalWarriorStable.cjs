const fs = require('fs');
let code = fs.readFileSync('src/test/hooks/useRivalries.test.ts', 'utf8');

// Looking for `it('intensity = 1 when no kills and bouts < 5'`
const match = code.match(/it\('intensity = 1 when no kills and bouts < 5', \(\) => {/);
if (match) {
  console.log("Found intensity test!");
} else {
  console.log("Missing test!");
}
