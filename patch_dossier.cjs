const fs = require('fs');
const path = 'src/test/components/WarriorDossier.test.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/it\('renders "Warrior not found\." for unknown warriorId', \(\) => \{/g, `it('renders "Warrior not found." for unknown warriorId', async () => {`);
content = content.replace(/it\('renders "Physical Polygon" card header', \(\) => \{/g, `it('renders "Physical Polygon" card header', async () => {`);
content = content.replace(/it\('renders WarriorRadarChart inside Suspense', \(\) => \{/g, `it('renders WarriorRadarChart inside Suspense', async () => {`);
content = content.replace(/it\('passes the correct warrior to WarriorRadarChart', \(\) => \{/g, `it('passes the correct warrior to WarriorRadarChart', async () => {`);
content = content.replace(/it\('renders dossier sub-components', \(\) => \{/g, `it('renders dossier sub-components', async () => {`);

fs.writeFileSync(path, content);
