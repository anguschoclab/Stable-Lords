import fs from 'fs';

let content = fs.readFileSync('src/test/state/storeGuards.test.ts', 'utf8');
content = content.replace(/try \{ await promise; \} catch \(e\) \{\}/g, 'try { await promise; } catch (e) { /* ignore */ }');
fs.writeFileSync('src/test/state/storeGuards.test.ts', content, 'utf8');
