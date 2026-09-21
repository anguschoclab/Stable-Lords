/**
 * Narrative content validation script.
 * Validates split domain JSON files for structural integrity:
 * - Valid JSON
 * - All template brackets {{...}} are balanced
 * - No duplicate entries within arrays
 * - No mock/placeholder markers (N1: (Mock, TODO, FIXME, PLACEHOLDER, LOREM, XXX, TBD)
 * - Required top-level keys present
 *
 * Canonical narrative tokens (%A, %D, %W, %BP, %H) are NOT flagged — they are
 * legitimate per narrativePBPUtils.ts:23.
 */
import { readFileSync, readdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const NARRATIVE_DIR = resolve(__dirname, '../src/data/narrative');

interface ValidationError {
  path: string;
  message: string;
}

const errors: ValidationError[] = [];

/**
 * Placeholder markers that indicate mock/contaminated narrative content.
 * Canonical %A-style tokens are NOT included here — they are legitimate.
 */
const PLACEHOLDER_MARKERS = ['(Mock', 'TODO', 'FIXME', 'PLACEHOLDER', 'LOREM', 'XXX', 'TBD'];

/**
 * Check a string array for placeholder/mock markers.
 * Returns an array of error messages for strings containing markers.
 * Canonical %A/%D/%W/%BP/%H tokens are NOT flagged.
 */
export function checkForPlaceholderMarkers(arr: string[]): string[] {
  const offenders: string[] = [];
  for (const item of arr) {
    if (typeof item !== 'string') continue;
    for (const marker of PLACEHOLDER_MARKERS) {
      if (item.includes(marker)) {
        offenders.push(`"${item}" (marker: ${marker})`);
        break;
      }
    }
  }
  return offenders;
}

function checkTemplateBrackets(str: string, path: string): void {
  let depth = 0;
  for (let i = 0; i < str.length; i++) {
    if (str[i] === '{' && str[i + 1] === '{') {
      depth++;
      i++;
    } else if (str[i] === '}' && str[i + 1] === '}') {
      depth--;
      i++;
      if (depth < 0) {
        errors.push({ path, message: `Unmatched closing }} at position ${i}` });
        depth = 0;
      }
    }
  }
  if (depth > 0) {
    errors.push({ path, message: `Unclosed template bracket (depth ${depth})` });
  }
}

function checkArrayForDuplicates(arr: string[], path: string): void {
  const seen = new Map<string, number>();
  for (let i = 0; i < arr.length; i++) {
    const item = arr[i];
    if (seen.has(item)) {
      errors.push({ path: `${path}[${i}]`, message: `Duplicate of index ${seen.get(item)}` });
    } else {
      seen.set(item, i);
    }
  }
}

function walkStrings(obj: unknown, path: string): void {
  if (typeof obj === 'string') {
    checkTemplateBrackets(obj, path);
    // N1: check for mock/placeholder markers in individual strings
    for (const marker of PLACEHOLDER_MARKERS) {
      if (obj.includes(marker)) {
        errors.push({ path, message: `Placeholder marker "${marker}" found in string` });
      }
    }
  } else if (Array.isArray(obj)) {
    if (obj.length > 0 && typeof obj[0] === 'string') {
      checkArrayForDuplicates(obj as string[], path);
      // N1: check string arrays for placeholder markers
      const offenders = checkForPlaceholderMarkers(obj as string[]);
      for (const offender of offenders) {
        errors.push({ path, message: `Placeholder marker found: ${offender}` });
      }
    }
    for (let i = 0; i < obj.length; i++) {
      walkStrings(obj[i], `${path}[${i}]`);
    }
  } else if (obj && typeof obj === 'object') {
    for (const [key, val] of Object.entries(obj)) {
      walkStrings(val, path ? `${path}.${key}` : key);
    }
  }
}

try {
  // Read and merge all domain files
  const files = readdirSync(NARRATIVE_DIR).filter(f => f.endsWith('.json'));
  const data: Record<string, unknown> = {};
  for (const file of files) {
    const raw = readFileSync(resolve(NARRATIVE_DIR, file), 'utf-8');
    const parsed = JSON.parse(raw);
    for (const [key, val] of Object.entries(parsed)) {
      data[key] = val;
    }
  }

  const REQUIRED_KEYS = ['ux_metadata', 'meta', 'offseason_events', 'kill_text'];
  for (const key of REQUIRED_KEYS) {
    if (!(key in data)) {
      errors.push({ path: key, message: 'Missing required top-level key' });
    }
  }

  walkStrings(data, '');

  if (errors.length === 0) {
    console.log('narrative domain files validation passed — no errors found.');
  } else {
    console.error(`Validation failed with ${errors.length} error(s):`);
    for (const e of errors) {
      console.error(`  ${e.path}: ${e.message}`);
    }
    process.exit(1);
  }
} catch (err) {
  console.error('Failed to parse narrative domain files:', err);
  process.exit(1);
}
