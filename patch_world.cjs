const fs = require('fs');
const path = 'src/test/components/world/World.test.tsx';
let content = fs.readFileSync(path, 'utf8');
content = content.replace(/render\(<WarriorLeaderboardRow row=\{row\} index=\{0\} isFiltered=\{false\} \/>\);/g, "render(<table><tbody><WarriorLeaderboardRow row={row} index={0} isFiltered={false} /></tbody></table>);");
fs.writeFileSync(path, content);
