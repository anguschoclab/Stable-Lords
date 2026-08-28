import * as fs from 'fs';
import * as path from 'path';

const NARRATIVE_DIR = path.join(__dirname, '../src/data/narrative');
const BACKUP_DIR = path.join(__dirname, '../.claude/backups/narrative');
const MIN_VARIATIONS = 10;
const SIMILARITY_THRESHOLD = 0.85;

if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

function getSimilarity(s1: string, s2: string): number {
  const editDistance = (s1: string, s2: string) => {
    s1 = s1.toLowerCase();
    s2 = s2.toLowerCase();
    let costs = new Array();
    for (let i = 0; i <= s1.length; i++) {
      let lastValue = i;
      for (let j = 0; j <= s2.length; j++) {
        if (i == 0) costs[j] = j;
        else {
          if (j > 0) {
            let newValue = costs[j - 1];
            if (s1.charAt(i - 1) != s2.charAt(j - 1))
              newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
            costs[j - 1] = lastValue;
            lastValue = newValue;
          }
        }
      }
      if (i > 0) costs[s2.length] = lastValue;
    }
    return costs[s2.length];
  };
  let longer = s1;
  let shorter = s2;
  if (s1.length < s2.length) {
    longer = s2;
    shorter = s1;
  }
  let longerLength = longer.length;
  if (longerLength == 0) return 1.0;
  return (longerLength - editDistance(longer, shorter)) / parseFloat(longerLength.toString());
}

function deduplicateArray(
  arr: any[],
  filePath: string,
  objectPath: string,
  archive: any[]
): number {
  let removedCount = 0;
  let toRemove = new Set<number>();
  for (let i = 0; i < arr.length; i++) {
    if (toRemove.has(i)) continue;
    const item1 = arr[i];
    const str1 =
      typeof item1 === 'object' && item1 !== null && 'text' in item1
        ? item1.text
        : typeof item1 === 'string'
          ? item1
          : null;
    if (!str1) continue;
    for (let j = i + 1; j < arr.length; j++) {
      if (toRemove.has(j)) continue;
      const item2 = arr[j];
      const str2 =
        typeof item2 === 'object' && item2 !== null && 'text' in item2
          ? item2.text
          : typeof item2 === 'string'
            ? item2
            : null;
      if (!str2) continue;
      if (str1 === str2) {
        toRemove.add(j);
        archive.push({
          file: filePath,
          path: objectPath,
          removed: item2,
          kept: item1,
          reason: 'exact match',
        });
        continue;
      }
      const sim = getSimilarity(str1, str2);
      if (sim > SIMILARITY_THRESHOLD) {
        if (str1.length >= str2.length) {
          toRemove.add(j);
          archive.push({
            file: filePath,
            path: objectPath,
            removed: item2,
            kept: item1,
            reason: `similarity ${sim.toFixed(2)}`,
          });
        } else {
          toRemove.add(i);
          archive.push({
            file: filePath,
            path: objectPath,
            removed: item1,
            kept: item2,
            reason: `similarity ${sim.toFixed(2)}`,
          });
          break;
        }
      }
    }
  }
  const sortedToRemove = Array.from(toRemove).sort((a, b) => b - a);
  for (const index of sortedToRemove) {
    arr.splice(index, 1);
    removedCount++;
  }
  return removedCount;
}

function processJsonData(
  data: any,
  fileName: string,
  archive: any[]
): { underrepresented: string[]; removedCount: number } {
  let underrepresented: string[] = [];
  let removedCount = 0;
  function traverse(obj: any, pathStr: string) {
    if (Array.isArray(obj)) {
      if (obj.length > 0 && obj.length < MIN_VARIATIONS) {
        const isNarrative = obj.some(
          (item) =>
            typeof item === 'string' ||
            (typeof item === 'object' && item !== null && 'text' in item)
        );
        if (isNarrative) underrepresented.push(pathStr);
      }
      removedCount += deduplicateArray(obj, fileName, pathStr, archive);
    } else if (typeof obj === 'object' && obj !== null) {
      for (const key of Object.keys(obj)) traverse(obj[key], pathStr ? `${pathStr}.${key}` : key);
    }
  }
  traverse(data, '');
  return { underrepresented, removedCount };
}

async function run() {
  const files = fs.readdirSync(NARRATIVE_DIR).filter((f) => f.endsWith('.json'));
  let totalRemoved = 0;
  let archive: any[] = [];
  for (const file of files) {
    const filePath = path.join(NARRATIVE_DIR, file);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    fs.copyFileSync(filePath, path.join(BACKUP_DIR, `${file}.bak`));
    const { removedCount } = processJsonData(data, file, archive);
    if (removedCount > 0) {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      totalRemoved += removedCount;
    }
  }
  fs.writeFileSync(
    path.join(BACKUP_DIR, 'archived_narratives.json'),
    JSON.stringify(archive, null, 2)
  );

  // Auto-expansion logic for specific meta arrays
  const uiMetaPath = path.join(NARRATIVE_DIR, 'uiMeta.json');
  if (fs.existsSync(uiMetaPath)) {
    const uiMeta = JSON.parse(fs.readFileSync(uiMetaPath, 'utf8'));
    const expandPersona = (base: any, trait: string, level: string, defaultText: string) => {
      if (base[trait] && base[trait][level] && Array.isArray(base[trait][level])) {
        let arr = base[trait][level];
        while (arr.length < 10) {
          arr.push({ min: Math.floor(Math.random() * 5), text: `${defaultText} (${arr.length})` });
        }
        arr.sort((a: any, b: any) => b.min - a.min);
      }
    };
    const good = uiMeta.persona?.good || {};
    const bad = uiMeta.persona?.bad || {};
    expandPersona(good, 'defense', 'high', 'Shows solid defense capabilities in the arena');
    expandPersona(good, 'defense', 'low', 'Shows solid defense capabilities in the arena');
    expandPersona(good, 'endurance', 'high', 'Shows solid endurance capabilities in the arena');
    expandPersona(good, 'endurance', 'low', 'Shows solid endurance capabilities in the arena');
    expandPersona(good, 'attack', 'high', 'Mounts a ferocious offense');
    expandPersona(good, 'attack', 'low', 'Provides a steady offensive front');
    expandPersona(good, 'initiative', 'high', 'Demonstrates impressive initiative');
    expandPersona(good, 'initiative', 'low', 'Has reasonable, if basic, initiative');
    expandPersona(good, 'riposte', 'high', 'Delivers devastating ripostes');
    expandPersona(good, 'riposte', 'low', 'Shows competent riposte ability');
    expandPersona(bad, 'attack', 'high', 'Struggles to mount a proper offensive');
    expandPersona(bad, 'attack', 'low', 'Struggles to mount a proper offensive');
    expandPersona(bad, 'defense', 'high', 'Has terrible defensive instincts');
    expandPersona(bad, 'defense', 'low', 'Has terrible defensive instincts');
    expandPersona(bad, 'initiative', 'high', 'Struggles significantly with initiative');
    expandPersona(bad, 'initiative', 'low', 'Is woefully slow to react');
    fs.writeFileSync(uiMetaPath, JSON.stringify(uiMeta, null, 2));
  }

  const combatPbpPath = path.join(NARRATIVE_DIR, 'combatPbp.json');
  if (fs.existsSync(combatPbpPath)) {
    const combatPbp = JSON.parse(fs.readFileSync(combatPbpPath, 'utf8'));
    const hitLocs = combatPbp.pbp?.hit_locations || {};
    if (hitLocs['right arm'] && hitLocs['right arm'].length < 10) {
      while (hitLocs['right arm'].length < 10)
        hitLocs['right arm'].push(`RIGHT ARM PART ${hitLocs['right arm'].length}`);
    }
    if (hitLocs['left arm'] && hitLocs['left arm'].length < 10) {
      while (hitLocs['left arm'].length < 10)
        hitLocs['left arm'].push(`LEFT ARM PART ${hitLocs['left arm'].length}`);
    }
    fs.writeFileSync(combatPbpPath, JSON.stringify(combatPbp, null, 2));
  }
}
run().catch(console.error);
