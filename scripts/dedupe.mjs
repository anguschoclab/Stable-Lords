#!/usr/bin/env node
/**
 * Deduplicate narrative content arrays.
 * Scans narrative domain JSON files for duplicate strings within each array
 * and reports/removes them.
 */
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const NARRATIVE_DIR = resolve(__dirname, '../src/data/narrative');

const files = readdirSync(NARRATIVE_DIR).filter(f => f.endsWith('.json'));
const data = {};
for (const file of files) {
  const parsed = JSON.parse(readFileSync(resolve(NARRATIVE_DIR, file), 'utf-8'));
  for (const [key, val] of Object.entries(parsed)) {
    data[key] = val;
  }
}

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
  // Write back to domain files
  const DOMAIN_FILES = {
    combatPbp: ['pbp', 'crowd_reactions'],
    combatStrikes: ['strikes'],
    combatKillText: ['kill_text'],
    combatConclusions: ['conclusions'],
    combatPassives: ['passives'],
    gazette: ['gazette', 'ux_metadata'],
    recruitment: ['recruitment'],
    offseason: ['offseason_events', 'events'],
    announcer: ['blurbs', 'commentary', 'recap'],
    uiMeta: ['fanfare', 'meta', 'persona', 'memorials'],
  };
  for (const [file, keys] of Object.entries(DOMAIN_FILES)) {
    const filePath = resolve(NARRATIVE_DIR, `${file}.json`);
    const existing = JSON.parse(readFileSync(filePath, 'utf-8'));
    for (const key of keys) {
      if (data[key] !== undefined) existing[key] = data[key];
    }
    writeFileSync(filePath, JSON.stringify(existing, null, 2) + '\n', 'utf-8');
  }
  console.log(`Total duplicates removed: ${totalRemoved}`);
  console.log('Domain files updated.');
}
