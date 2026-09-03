import { STABLE_PREFIXES, STABLE_SUFFIXES, STABLE_ALT } from './src/data/names/stableNames.ts';
import { OWNER_FIRST, OWNER_LAST } from './src/data/names/ownerNames.ts';
import { WARRIOR_NAMES } from './src/data/names/warriorNames.ts';

function findDupes(arr, label) {
  const seen = new Map();
  const dupes = [];
  for (let i = 0; i < arr.length; i++) {
    const v = arr[i];
    if (seen.has(v)) {
      dupes.push({ value: v, firstIndex: seen.get(v), dupIndex: i });
    } else {
      seen.set(v, i);
    }
  }
  if (dupes.length > 0) {
    console.log(label + ' (' + arr.length + ' entries):');
    for (const d of dupes) {
      console.log('  dupe: "' + d.value + '" at index ' + d.dupIndex + ' (first at ' + d.firstIndex + ')');
    }
  } else {
    console.log(label + ': no dupes (' + arr.length + ' entries)');
  }
}

findDupes(STABLE_PREFIXES, 'STABLE_PREFIXES');
findDupes(STABLE_SUFFIXES, 'STABLE_SUFFIXES');
findDupes(STABLE_ALT, 'STABLE_ALT');
findDupes(OWNER_FIRST, 'OWNER_FIRST');
findDupes(OWNER_LAST, 'OWNER_LAST');
findDupes(WARRIOR_NAMES, 'WARRIOR_NAMES');
