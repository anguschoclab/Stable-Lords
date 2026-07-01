#!/usr/bin/env node
/**
 * Deduplicate narrative content arrays.
 * Scans narrativeContent.json for duplicate strings within each array
 * and reports/removes them.
 */
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONTENT_PATH = resolve(__dirname, '../src/data/narrativeContent.json');

const data = JSON.parse(readFileSync(CONTENT_PATH, 'utf-8'));

let totalRemoved = 0;

function dedupeArray(arr, label) {
  const seen = new Set();
  const unique = [];
  let removed = 0;
  for (const item of arr) {
    if (seen.has(item)) {
      removed++;
    } else {
      seen.add(item);
      unique.push(item);
    }
  }
  if (removed > 0) {
    console.log(`  ${label}: removed ${removed} duplicate(s)`);
    totalRemoved += removed;
  }
  return unique;
}

if (data.executions) {
  data.executions = dedupeArray(data.executions, 'executions');
}

if (data.combat) {
  for (const [key, section] of Object.entries(data.combat)) {
    if (Array.isArray(section)) {
      data.combat[key] = dedupeArray(section, `combat.${key}`);
    } else if (typeof section === 'object') {
      for (const [subKey, subArr] of Object.entries(section)) {
        if (Array.isArray(subArr)) {
          data.combat[key][subKey] = dedupeArray(subArr, `combat.${key}.${subKey}`);
        }
      }
    }
  }
}

if (data.meta) {
  for (const [key, section] of Object.entries(data.meta)) {
    if (typeof section === 'object') {
      for (const [subKey, subArr] of Object.entries(section)) {
        if (Array.isArray(subArr)) {
          data.meta[key][subKey] = dedupeArray(subArr, `meta.${key}.${subKey}`);
        }
      }
    }
  }
}

if (totalRemoved === 0) {
  console.log('No duplicates found.');
} else {
  writeFileSync(CONTENT_PATH, JSON.stringify(data, null, 2) + '\n', 'utf-8');
  console.log(`Total duplicates removed: ${totalRemoved}`);
  console.log('File updated.');
}
