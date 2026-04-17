/**
 * Narrative archive validator — ensures every `{{TAG}}` referenced inside
 * `narrativeContent.json` resolves to a dictionary entry.
 *
 * Run via `bun scripts/validateNarrativeArchive.ts`. Exits non-zero on failure
 * so it can gate `bun run build`.
 */
import archive from "../src/data/narrativeContent.json";

const TAG_RE = /\{\{([A-Z_]+)\}\}/g;

type Json = string | number | boolean | null | Json[] | { [k: string]: Json };

function collectStrings(node: Json, out: string[]): void {
  if (typeof node === "string") {
    out.push(node);
  } else if (Array.isArray(node)) {
    for (const v of node) collectStrings(v, out);
  } else if (node && typeof node === "object") {
    for (const v of Object.values(node)) collectStrings(v as Json, out);
  }
}

function main(): number {
  const root = archive as unknown as Record<string, Json>;
  const dict = (root.dictionary ?? {}) as Record<string, Json>;
  const knownTags = new Set(Object.keys(dict).flatMap(k => [k, k.toUpperCase()]));

  const strings: string[] = [];
  collectStrings(root as unknown as Json, strings);

  const missing = new Map<string, number>();
  for (const s of strings) {
    for (const m of s.matchAll(TAG_RE)) {
      const tag = m[1];
      if (!knownTags.has(tag) && !knownTags.has(tag.toLowerCase())) {
        missing.set(tag, (missing.get(tag) ?? 0) + 1);
      }
    }
  }

  const dupKeys = Object.keys(dict).filter(k => Array.isArray(dict[k]) && (dict[k] as Json[]).length === 0);

  let ok = true;
  if (missing.size > 0) {
    ok = false;
    console.error(`[narrative-validator] ${missing.size} unresolved {{TAG}} reference(s):`);
    for (const [tag, count] of [...missing.entries()].sort()) {
      console.error(`  {{${tag}}} × ${count}`);
    }
  }
  if (dupKeys.length > 0) {
    ok = false;
    console.error(`[narrative-validator] empty dictionary entries: ${dupKeys.join(", ")}`);
  }

  if (ok) {
    console.log(`[narrative-validator] ok — ${strings.length} strings scanned, ${Object.keys(dict).length} dictionary entries.`);
    return 0;
  }
  return 1;
}

process.exit(main());
