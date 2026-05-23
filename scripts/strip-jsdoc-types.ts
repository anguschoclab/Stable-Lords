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
 * Remove {type} annotations from JSDoc tags like @param, @returns, etc.
 * Handles nested curly braces and optional markers.
 */
function stripTypesFromJSDoc(text: string): string {
  // Match JSDoc tags with type annotations:
  // @param {type} name - description
  // @returns {type} description
  // @type {type}
  // etc.
  // We want to remove {type} but keep the rest.

  // Split into lines and process each line that starts with ` * @`
  const lines = text.split("\n");
  const result: string[] = [];

  for (const line of lines) {
    // Match lines like ` * @param {SomeType} name - desc` or ` * @returns {SomeType} desc`
    // We need to find the first occurrence of `{...}` that appears before any non-whitespace
    // after the tag name.
    const trimmed = line.trimStart();
    if (trimmed.startsWith("* @")) {
      // Find position of the type annotation { ... }
      // It should be right after the tag name.
      const tagMatch = trimmed.match(/^\*\s+(@\w+)\s+(.*)$/);
      if (tagMatch) {
        const tag = tagMatch[1];
        const rest = tagMatch[2];
        // Check if rest starts with {type}
        if (rest.startsWith("{")) {
          // Find the matching closing brace
          let depth = 0;
          let end = -1;
          for (let i = 0; i < rest.length; i++) {
            if (rest[i] === "{") depth++;
            else if (rest[i] === "}") {
              depth--;
              if (depth === 0) {
                end = i;
                break;
              }
            }
          }
          if (end !== -1) {
            const afterType = rest.slice(end + 1).trimStart();
            const prefix = line.slice(0, line.indexOf(tag) + tag.length);
            result.push(`${prefix} ${afterType}`);
            continue;
          }
        }
      }
    }
    result.push(line);
  }

  return result.join("\n");
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
