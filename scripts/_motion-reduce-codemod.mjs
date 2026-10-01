// One-shot codemod: append motion-reduce companions inside class-string
// literals on lines flagged by the ui-audit motion-violation scan.
// Safe rules:
//  - only edits inside a quoted/backtick string literal on a flagged line
//  - requires the literal to contain a hyphenated motion token OR a bare
//    'transition'/'animate' token in a class-like literal (has : or [ or -)
//  - skips literals already containing 'motion-reduce'
//  - skips lines using classList.add (whitespace arg breaks DOM API) and
//    prose strings (handled manually)
import fs from 'fs';
import { collectUiAudit } from './ui-audit-scan.mjs';

const MOTION_TOKEN =
  /(?:^|\s)[\w[\]%/().:-]*(?:animate-[\w-]+|transition-[\w-]+|transition\b|animate\b)(?=\s|$)/;
const prose = [];

for (const { file, line } of collectUiAudit().findings['motion-violation']) {
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  const l = lines[line - 1];
  if (l.includes('classList.add') || l.includes('toast.')) {
    prose.push(`${file}:${line}`);
    continue;
  }

  let changed = false;
  const next = l.replace(/(['"`])((?:\\.|(?!\1)[^\\\n])*)\1/g, (m, q, content) => {
    if (content.includes('motion-reduce')) return m;
    if (!MOTION_TOKEN.test(content)) return m;
    const add = [];
    if (/\btransition\b|transition-/.test(content)) add.push('motion-reduce:transition-none');
    if (/(?:^|[\s:])[\w-]*(?:scale|translate|rotate)[\w[\]-]*/.test(content))
      add.push('motion-reduce:transform-none');
    if (/animate-/.test(content)) add.push('motion-reduce:animate-none');
    if (!add.length) return m;
    changed = true;
    return q + content + ' ' + add.join(' ') + q;
  });

  if (changed) {
    lines[line - 1] = next;
    fs.writeFileSync(file, lines.join('\n'));
    console.log(`fixed ${file}:${line}`);
  }
}
console.log('MANUAL (prose/dom-api):', prose.join(', '));
