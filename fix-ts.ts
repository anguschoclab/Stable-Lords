import fs from 'fs';

let wpContent = fs.readFileSync('src/test/engine/pipeline/passes/WarriorPass.test.ts', 'utf8');
wpContent = wpContent.replace(/const max =/g, 'const _max =');
fs.writeFileSync('src/test/engine/pipeline/passes/WarriorPass.test.ts', wpContent, 'utf8');
