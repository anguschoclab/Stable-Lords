// One-shot codemod: raw hex/rgba literals → design-token rgba(var(--x-rgb), a)
// Preserves alpha exactly; normalizes browns/embers to the nearest minted
// palette triplet (channel deltas ≤10 — visually identical at these alphas).
import fs from 'fs';
import { collectUiAudit } from './ui-audit-scan.mjs';

// rgb triplet (normalized, space-separated) → css var name
const TRIPLET = {
  '60,42,22': '--oak-rgb',
  '100,70,36': '--umber-rgb',
  '80,56,28': '--sepia-rgb',
  '80,55,30': '--sepia-rgb',
  '70,48,26': '--sepia-rgb',
  '20,15,8': '--inkwash-rgb',
  '24,16,9': '--inkwash-rgb',
  '18,12,7': '--inkwash-rgb',
  '22,15,8': '--inkwash-rgb',
  '255,255,255': '--sheen-rgb',
  '255,245,220': '--sheen-warm-rgb',
  '200,140,20': '--ember-rgb',
  '200,120,20': '--ember-rgb',
  '200,130,20': '--ember-rgb',
  '180,100,10': '--ember-deep-rgb',
  '135,34,40': '--blood-glow-rgb',
  '201,151,42': '--gold-glow-rgb',
  '160,40,48': '--blood-mid-rgb',
  '100,20,26': '--blood-deep-rgb',
  '200,80,88': '--blood-soft-rgb',
  '200,0,0': '--blood-bright-rgb',
  '255,200,200': '--blush-rgb',
  '0,0,0': '--void-rgb',
};

// hex → nearest semantic token hsl var (exact unless noted)
const HEX = {
  '#e7d3af': 'hsl(var(--foreground))',
  '#0c0806': 'hsl(var(--background))',
  '#050506': 'hsl(var(--background))',
  '#080604': 'hsl(var(--background))',
  '#110c07': 'hsl(var(--popover))',
  '#150f08': 'hsl(var(--card))',
  '#872228': 'hsl(var(--primary))',
};

const files = new Set(collectUiAudit().findings['token-violation'].map((r) => r.file));

let changed = 0;
const misses = [];
for (const f of files) {
  let src = fs.readFileSync(f, 'utf8');
  const orig = src;

  src = src.replace(
    /rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([0-9.]+)\s*\)/g,
    (m, r, g, b, a) => {
      const key = `${r},${g},${b}`;
      const v = TRIPLET[key];
      if (!v) {
        misses.push(`${f} ${m}`);
        return m;
      }
      changed++;
      return `rgba(var(${v}), ${a})`;
    }
  );

  src = src.replace(/#([0-9a-fA-F]{6})\b/g, (m) => {
    const v = HEX[m.toLowerCase()];
    if (!v) {
      misses.push(`${f} ${m}`);
      return m;
    }
    changed++;
    return v;
  });

  if (src !== orig) fs.writeFileSync(f, src);
}
console.log('changed:', changed);
console.log('misses:', misses.join(' | ') || 'none');
