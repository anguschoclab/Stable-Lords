const fs = require('fs');
const content = fs.readFileSync('src/components/layout/TacticalBar.tsx', 'utf8');

let newContent = content.replace(
  /\n          >\n            <Link/g,
  `\n            <Link`
);

fs.writeFileSync('src/components/layout/TacticalBar.tsx', newContent);
