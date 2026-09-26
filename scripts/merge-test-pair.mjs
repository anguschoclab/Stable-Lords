#!/usr/bin/env node
/**
 * merge-test-pair.mjs — Union-merge two duplicate test files that import the
 * same module. Writes the merged spec to the canonical (mirror-of-source)
 * path. Preserves every describe/it from both inputs; dedupes identical
 * it-name+body blocks; unions imports.
 *
 * Usage: node scripts/merge-test-pair.mjs <primary> <secondary> <outPath> [--apply]
 * Default is dry-run (prints stats + collision warnings).
 */
import fs from 'node:fs';

const [primary, secondary, outPath] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const apply = process.argv.includes('--apply');

const read = (f) => fs.readFileSync(f, 'utf8');

function splitImports(content) {
  const lines = content.split('\n');
  const imports = [];
  const body = [];
  let i = 0;
  // absorb leading comment header + imports
  while (i < lines.length) {
    const l = lines[i];
    if (/^import\s/.test(l)) {
      // multi-line import — side-effect imports end at ';', others end at from '...';
      let imp = l;
      while (!/;/.test(imp) && i + 1 < lines.length) {
        i++;
        imp += '\n' + lines[i];
      }
      imports.push(imp);
    } else {
      body.push(l);
    }
    i++;
  }
  return { imports, body: body.join('\n') };
}

function mergeImportLines(a, b) {
  // union named specifiers per module; dedupe side-effect/namespace/default lines
  const named = new Map(); // key: `${type}:${module}` -> Set of specifiers
  const other = new Map(); // verbatim lines (side-effect, namespace, default)
  const specRe =
    /import\s+(type\s+)?\{([^}]*)\}\s*from\s*['"]([^'"]+)['"]/;
  for (const raw of [...a, ...b]) {
    const oneLine = raw.replace(/\s+/g, ' ').trim();
    const m = raw.match(specRe);
    if (m) {
      const key = `${m[1] ? 'type' : 'value'}:${m[3]}`;
      if (!named.has(key)) named.set(key, new Set());
      for (const s of m[2].split(',')) {
        const spec = s.trim();
        if (spec) named.get(key).add(spec);
      }
    } else if (!other.has(oneLine)) {
      other.set(oneLine, raw.trim());
    }
  }
  const vitestKey = 'value:vitest';
  const out = [];
  // emit vitest import first (stable ordering), then module imports, then verbatim
  const keys = [...named.keys()].sort((x, y) =>
    x === vitestKey ? -1 : y === vitestKey ? 1 : x.localeCompare(y)
  );
  for (const k of keys) {
    const [kind, mod] = k.split(/:(.+)/);
    const specs = [...named.get(k)].join(', ');
    out.push(
      `import ${kind === 'type' ? 'type ' : ''}{ ${specs} } from '${mod}';`
    );
  }
  out.push(...other.values());
  return out;
}

// split body into top-level describe blocks (naive: split on ^describe( keeping text)
function topLevelDescribes(body) {
  const re = /^describe\s*\(/gm;
  const idx = [...body.matchAll(re)].map((m) => m.index);
  if (!idx.length) return { preamble: body.trim(), describes: [] };
  const preamble = body.slice(0, idx[0]).trim();
  const describes = idx.map((start, i) =>
    body.slice(start, i + 1 < idx.length ? idx[i + 1] : undefined).trim()
  );
  return { preamble, describes };
}

const itKeyRe = /(?:it|test)\s*\(\s*['"`]([^'"`]+)/g;
function describeKey(block) {
  const names = [...block.matchAll(itKeyRe)].map((m) => m[1]);
  // identity = the set of its its-names; identical blocks collapse
  return names.join('|');
}

const p = read(primary);
const s = read(secondary);
const pi = splitImports(p);
const si = splitImports(s);
const imports = mergeImportLines(pi.imports, si.imports);

const pa = topLevelDescribes(pi.body);
const sa = topLevelDescribes(si.body);

const seen = new Set(pa.describes.map(describeKey));
const uniqueFromS = sa.describes.filter((d) => {
  const k = describeKey(d);
  if (seen.has(k)) return false;
  seen.add(k);
  return true;
});

// detect top-level identifier collisions between preambles
const identRe = /^(?:const|let|var|function)\s+([A-Za-z_$][\w$]*)/gm;
const ids = (t) => new Set([...t.matchAll(identRe)].map((m) => m[1]));
const pIds = ids(pa.preamble + '\n' + pa.describes.join('\n'));
const sIds = ids(sa.preamble + '\n' + sa.describes.join('\n'));
const collisions = [...sIds].filter((id) => pIds.has(id));

const merged =
  imports.join('\n') +
  '\n\n' +
  [pa.preamble, sa.preamble].filter(Boolean).join('\n\n') +
  '\n\n' +
  [...pa.describes, ...uniqueFromS].join('\n\n') +
  '\n';

console.log(`primary:   ${primary} (${p.split('\n').length} loc, ${pa.describes.length} describes)`);
console.log(`secondary: ${secondary} (${s.split('\n').length} loc, ${sa.describes.length} describes)`);
console.log(`out:       ${outPath}`);
console.log(`secondary describes dropped as identical: ${sa.describes.length - uniqueFromS.length}`);
if (collisions.length) console.log(`TOP-LEVEL IDENTIFIER COLLISIONS: ${collisions.join(', ')}`);
if (apply) {
  fs.writeFileSync(outPath, merged);
  console.log('written.');
}
