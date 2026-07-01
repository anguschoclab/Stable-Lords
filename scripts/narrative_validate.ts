/**
 * Narrative content validation script.
 * Validates narrativeContent.json for structural integrity:
 * - Valid JSON
 * - All template brackets {{...}} are balanced
 * - No duplicate entries within arrays
 * - Required top-level keys present
 */
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONTENT_PATH = resolve(__dirname, '../src/data/narrativeContent.json');

interface ValidationError {
  path: string;
  message: string;
}

const errors: ValidationError[] = [];

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
  } else if (Array.isArray(obj)) {
    if (obj.length > 0 && typeof obj[0] === 'string') {
      checkArrayForDuplicates(obj as string[], path);
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
  const raw = readFileSync(CONTENT_PATH, 'utf-8');
  const data = JSON.parse(raw);

  const REQUIRED_KEYS = ['ux_metadata', 'meta', 'offseason_events', 'kill_text'];
  for (const key of REQUIRED_KEYS) {
    if (!(key in data)) {
      errors.push({ path: key, message: 'Missing required top-level key' });
    }
  }

  walkStrings(data, '');

  if (errors.length === 0) {
    console.log('narrativeContent.json validation passed — no errors found.');
    process.exit(0);
  } else {
    console.error(`Validation failed with ${errors.length} error(s):`);
    for (const e of errors) {
      console.error(`  ${e.path}: ${e.message}`);
    }
    process.exit(1);
  }
} catch (err) {
  console.error('Failed to parse narrativeContent.json:', err);
  process.exit(1);
}
