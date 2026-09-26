#!/usr/bin/env node
/**
 * delegate-factories.mjs — rewrite local test factories as thin adapters over
 * src/test/_fixtures/factories.ts.
 *
 *   function makeWarrior(name, style, cn = 12): Warrior {
 *     return { id: `w_${name}`, name, style, attributes: {...CN: cn}, fame: 100 };
 *   }
 * becomes
 *   const makeWarrior = (name: string, style: FightingStyle, cn = 12): Warrior =>
 *     fixtureWarrior({ id: `w_${name}`, name, style, attributes: {...CN: cn}, fame: 100 });
 *
 * The entire local literal is preserved verbatim as the override argument, so
 * per-file defaults (and spreads like ...overrides) are unchanged.
 *
 * Only `function makeX(...) { return { ... } }` shapes are transformed — bodies
 * with statements before the return are left for manual migration.
 */
import fs from 'node:fs';

const SHARED = {
  makeWarrior: 'fixtureWarrior',
  makeTestWarrior: 'fixtureWarrior',
  createTestWarrior: 'fixtureWarrior',
  mkWarrior: 'fixtureWarrior',
  makeRival: 'fixtureRival',
  createRival: 'fixtureRival',
  makeOwner: 'fixtureOwner',
  makeBoutOffer: 'fixtureBoutOffer',
  makeOffer: 'fixtureBoutOffer',
  createTestOffer: 'fixtureBoutOffer',
  mkOffer: 'fixtureBoutOffer',
  makeFightSummary: 'fixtureFightSummary',
  makeFight: 'fixtureFightSummary',
  makeGameState: 'fixtureGameState',
  makeState: 'fixtureGameState',
  mkState: 'fixtureGameState',
  mkBase: 'fixtureGameState',
  makeBaseState: 'fixtureGameState',
  makeFighter: 'fixtureFighterState',
  // NOTE: `makeCtx` intentionally unmapped — the name is used for
  // ResolutionContext in combat files AND OffseasonEventContext in
  // pipeline files; routing it would mis-type one side.
  makeStrategy: 'fixtureStrategy',
  makeAIEvent: 'fixtureAIEvent',
  makeAgentMemory: 'fixtureAgentMemory',
};

const IMPORT_NAMES = {
  fixtureWarrior: 'makeWarrior',
  fixtureRival: 'makeRival',
  fixtureOwner: 'makeOwner',
  fixtureBoutOffer: 'makeBoutOffer',
  fixtureFightSummary: 'makeFightSummary',
  fixtureGameState: 'makeGameState',
  fixtureFighterState: 'makeFighterState',
  fixtureResolutionContext: 'makeResolutionContext',
  fixtureStrategy: 'makeStrategy',
  fixtureAIEvent: 'makeAIEvent',
  fixtureAgentMemory: 'makeAgentMemory',
};

const apply = process.argv.includes('--apply');
const targetFiles = process.argv.slice(2).filter((a) => !a.startsWith('--'));

function findFunction(content, name) {
  // match: function NAME(PARAMS) [: RET] { ... }  — braces counted
  //     or: const NAME = (PARAMS) [: RET] => ({ ... });
  let re = new RegExp(`function ${name}\\s*\\(`);
  let m = re.exec(content);
  let arrowForm = false;
  if (!m) {
    re = new RegExp(`const ${name}\\s*=\\s*\\(`);
    m = re.exec(content);
    arrowForm = true;
  }
  if (!m) return null;
  const start = m.index;
  // params
  let i = start + m[0].length - 1;
  let depth = 0;
  let paramsEnd = -1;
  for (; i < content.length; i++) {
    if (content[i] === '(') depth++;
    else if (content[i] === ')') {
      depth--;
      if (depth === 0) {
        paramsEnd = i;
        break;
      }
    }
  }
  if (paramsEnd < 0) return null;
  const params = content.slice(start + m[0].length - 1, paramsEnd + 1);
  if (arrowForm) {
    // const NAME = (params) [: Ret] => ( {literal} ) [: as T] ;
    const rest = content.slice(paramsEnd + 1);
    const arm = /^\s*:\s*([^=]+?)\s*=>/.exec(rest);
    const arrowIdx = rest.indexOf('=>');
    if (arrowIdx < 0) return null;
    const retType = arm ? arm[1].trim() : '';
    let bi = paramsEnd + 1 + arrowIdx + 2;
    // skip whitespace + optional wrapping paren
    while (/\s/.test(content[bi])) bi++;
    let litStart = bi;
    let wrapped = false;
    if (content[bi] === '(') { wrapped = true; litStart = bi + 1; }
    while (/\s/.test(content[litStart])) litStart++;
    if (content[litStart] !== '{') return null;
    // `{` may open an object literal `=> ({...})` or a BRACED body `=> { stmt }`.
    // Reject the latter: a literal can't start with a statement keyword.
    const afterBrace = content.slice(litStart + 1).trimStart();
    if (/^(return|if|for|while|const|let|var|switch|throw)\b/.test(afterBrace)) return null;
    // find matching close of object literal
    let depth2 = 1;
    let li = litStart + 1;
    for (; li < content.length; li++) {
      if (content[li] === '{') depth2++;
      else if (content[li] === '}') {
        depth2--;
        if (depth2 === 0) break;
      }
    }
    const literal = content.slice(litStart + 1, li);
    // find end of statement: consume wrapped ')' + optional `as T` + ';'
    let end = li + 1;
    while (/\s/.test(content[end])) end++;
    if (wrapped && content[end] === ')') end++;
    const tailM = /^\s*as\s+[\w<>[\]]+\s*;?/.exec(content.slice(end));
    if (tailM) end += tailM[0].length;
    if (content[end] === ';') end++;
    return {
      start,
      end,
      params,
      literal,
      retType,
      arrowForm: true,
      wrapped,
    };
  }
  // optional return type then body
  const retRe = /^[^a-zA-Z]*:?\s*[^{]*\{/;
  const rest2 = content.slice(paramsEnd + 1);
  const rm = retRe.exec(rest2);
  if (!rm) return null;
  const bodyStart = paramsEnd + 1 + rm[0].length;
  depth = 1;
  i = bodyStart;
  for (; i < content.length; i++) {
    if (content[i] === '{') depth++;
    else if (content[i] === '}') {
      depth--;
      if (depth === 0) break;
    }
  }
  const body = content.slice(bodyStart, i);
  return { start, end: i + 1, params, body, arrowForm: false };
}

// does the body consist of ONLY `return { ... };` (+whitespace/comments)?
function singleLiteralReturn(body) {
  const m = body.match(/^\s*return\s*\{/);
  if (!m) return null;
  // find matching close brace of the returned literal
  const litStart = m.index + m[0].length;
  let depth = 1;
  let i = litStart;
  for (; i < body.length; i++) {
    if (body[i] === '{') depth++;
    else if (body[i] === '}') {
      depth--;
      if (depth === 0) break;
    }
  }
  const literal = body.slice(litStart, i);
  const tail = body.slice(i + 1).trim();
  if (!/^;?\s*$/.test(tail) && !/^;?\s*as\s+\w/.test(tail) && !/^;?\s*as\s+const/.test(tail)) {
    // allow `} as X;` tail
    if (!/^;?\s*as\s/.test(tail) && tail !== ';' && tail !== '') return null;
  }
  return literal;
}

const results = [];
for (const file of targetFiles) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');
  const needed = new Map(); // localName -> sharedAlias
  const edits = [];

  for (const local of Object.keys(SHARED)) {
    // avoid partial-name collisions (makeWarriorRows shouldn't match makeWarrior)
    const fn = findFunction(content, local);
    if (!fn) continue;
    // ensure exact name: check char after name
    const prefix = fn.arrowForm ? `const ${local}` : `function ${local}`;
    const nameEnd = fn.start + prefix.length;
    if (!/^\s*[(=]/.test(content.slice(nameEnd))) continue;
    const literal = fn.arrowForm ? fn.literal : singleLiteralReturn(fn.body);
    if (literal === null || literal === undefined) {
      results.push({ file, local, status: 'SKIP body-not-single-literal' });
      continue;
    }
    const alias = SHARED[local];
    const retType = fn.arrowForm
      ? fn.retType
      : (content.slice(fn.start, fn.end).match(/\)\s*:\s*([^{]+)\{/) || [null, ''])[1].trim();
    const arrow = `const ${local} = ${fn.params}${retType ? `: ${retType.replace(/;$/, '')}` : ''} =>\n  ${alias}({${literal}});`;
    edits.push({ start: fn.start, end: fn.end, text: arrow });
    needed.set(local, alias);
  }

  if (edits.length) {
    let out = content;
    for (const e of edits.sort((a, b) => b.start - a.start)) {
      out = out.slice(0, e.start) + e.text + out.slice(e.end);
    }
    // repair stale `as T;` tails left behind after adapter call closes
    // (`});as GameState;` — always invalid/unintended)
    out = out.replace(/\}\);?\s*as\s+[A-Z]\w*;/g, '});');
    // add import
    const imported = [...new Set([...needed.values()])]
      .map((a) => `${IMPORT_NAMES[a]} as ${a}`)
      .join(', ');
    const importLine = `import { ${imported} } from '@/test/_fixtures/factories';`;
    const lines = out.split('\n');
    let insertAt = 0;
    let i = 0;
    // scan the leading block only: comments, blanks, and import declarations
    while (i < lines.length) {
      const l = lines[i].trim();
      if (l === '' || l.startsWith('//') || l.startsWith('/*') || l.startsWith('*')) {
        i++;
        continue;
      }
      if (/^import\b/.test(lines[i])) {
        // absorb multi-line import to the line containing `from '...'` or `;`
        i++;
        while (i < lines.length && !/;/.test(lines[i - 1])) i++;
        insertAt = i;
        continue;
      }
      break;
    }
    lines.splice(insertAt, 0, importLine);
    out = lines.join('\n');
    results.push({ file, status: 'TRANSFORM', fns: [...needed.keys()] });
    if (apply) fs.writeFileSync(file, out);
  } else if (!results.some((r) => r.file === file)) {
    results.push({ file, status: 'NO-MATCH' });
  }
}

for (const r of results) console.log(r.status.padEnd(28), r.file, r.fns ? r.fns.join(',') : '');
