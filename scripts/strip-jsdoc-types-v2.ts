import * as fs from "fs";
import * as path from "path";

const SRC_DIR = path.resolve(process.cwd(), "src");

function walkDir(dir: string, files: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      walkDir(full, files);
    } else if (stat.isFile() && (full.endsWith(".ts") || full.endsWith(".tsx")) && !full.endsWith(".d.ts")) {
      files.push(full);
    }
  }
  return files;
}

/**
 * Remove {type} annotations from JSDoc @param tags.
 * Handles both single-line and multi-line type annotations.
 */
function stripTypesFromJSDoc(text: string): string {
  // Replace @param { ... } with @param, handling multi-line types
  // Pattern: @param followed by optional whitespace, then { ... } (including newlines)
  return text.replace(
    /(@param\s+)\{[\s\S]*?\}/g,
    (match, prefix) => {
      // After removing the type, there might be a parameter name and description
      // The original match is like: @param {type} name - desc
      // We want: @param name - desc
      // But if the type spans multiple lines, we need to extract what's after }
      const afterBrace = match.slice(match.indexOf("}") + 1);
      return prefix + afterBrace.trimStart();
    }
  );
}

function processFile(filePath: string): boolean {
  const sourceText = fs.readFileSync(filePath, "utf-8");
  // Find all JSDoc comments (/** ... */)
  const jsdocRegex = /\/\*\*[\s\S]*?\*\//g;
  let modified = false;

  const newText = sourceText.replace(jsdocRegex, (match) => {
    const stripped = stripTypesFromJSDoc(match);
    if (stripped !== match) {
      modified = true;
      return stripped;
    }
    return match;
  });

  if (!modified) return false;

  fs.writeFileSync(filePath, newText, "utf-8");
  return true;
}

const files = walkDir(SRC_DIR);
let modifiedCount = 0;
for (const file of files) {
  try {
    if (processFile(file)) {
      modifiedCount++;
      console.log("Modified:", path.relative(process.cwd(), file));
    }
  } catch (e) {
    console.error("Error processing", file, e);
  }
}
console.log(`\nDone. Modified ${modifiedCount} files.`);
