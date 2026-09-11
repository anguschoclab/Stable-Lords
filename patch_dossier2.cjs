const fs = require('fs');
const path = 'src/test/components/WarriorDossier.test.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/render\(<WarriorDossier warriorId=\{'(w1|nonexistent)' as WarriorId\} \/>\);/g, "await act(async () => { render(<WarriorDossier warriorId={'$1' as WarriorId} />); });");

fs.writeFileSync(path, content);
