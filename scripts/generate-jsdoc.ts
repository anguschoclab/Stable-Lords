import * as ts from "typescript";
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

function splitCamelCase(name: string): string {
  return name
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .toLowerCase();
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function inferDescription(name: string, kind: string, isReactComponent: boolean): string {
  if (isReactComponent) {
    return `Render the ${name} component.`;
  }
  const words = splitCamelCase(name);
  switch (kind) {
    case "function":
      if (name.startsWith("get") || name.startsWith("compute") || name.startsWith("calculate")) {
        return capitalize(words) + ".";
      }
      if (name.startsWith("is") || name.startsWith("has") || name.startsWith("can")) {
        return capitalize(words) + ".";
      }
      if (name.startsWith("handle") || name.startsWith("on")) {
        return `Handle ${words.replace(/^handle /, "").replace(/^on /, "")}.`;
      }
      if (name.startsWith("use")) {
        return `React hook: ${words}.`;
      }
      return capitalize(words) + ".";
    case "class":
      return `The ${name} class.`;
    case "interface":
      return `Defines the shape of ${words}.`;
    case "type":
      return `${capitalize(words)} type.`;
    case "variable":
      return `${capitalize(words)}.`;
    case "enum":
      return `${name} enumeration.`;
    default:
      return `${capitalize(words)}.`;
  }
}

function inferParamDescription(paramName: string): string {
  const words = splitCamelCase(paramName);
  return capitalize(words) + ".";
}

function isReactComponent(name: string, node: ts.Node): boolean {
  if (!/^[A-Z]/.test(name)) return false;
  // Check if it returns JSX
  if (ts.isFunctionDeclaration(node) && node.body) {
    return hasJsxReturn(node.body);
  }
  if (ts.isVariableDeclaration(node) && node.initializer) {
    if (ts.isArrowFunction(node.initializer) || ts.isFunctionExpression(node.initializer)) {
      if (node.initializer.body) {
        return hasJsxReturn(node.initializer.body);
      }
    }
  }
  return false;
}

function hasJsxReturn(node: ts.Node): boolean {
  let found = false;
  ts.forEachChild(node, function visit(child) {
    if (found) return;
    if (ts.isReturnStatement(child) && child.expression) {
      if (
        ts.isJsxElement(child.expression) ||
        ts.isJsxSelfClosingElement(child.expression) ||
        ts.isJsxFragment(child.expression)
      ) {
        found = true;
        return;
      }
    }
    ts.forEachChild(child, visit);
  });
  return found;
}

function buildJSDoc(
  name: string,
  kind: string,
  isReactComponent: boolean,
  params: { name: string; hasQuestion?: boolean }[],
  hasReturn: boolean
): string {
  const lines: string[] = [];
  lines.push(`/**`);
  lines.push(` * ${inferDescription(name, kind, isReactComponent)}`);

  for (const p of params) {
    const opt = p.hasQuestion ? " (optional)" : "";
    lines.push(` * @param ${p.name} - ${inferParamDescription(p.name)}${opt}`);
  }

  if (hasReturn) {
    lines.push(` * @returns The result.`);
  }

  lines.push(` */`);
  return lines.join("\n");
}

function getExportedDeclarations(sourceFile: ts.SourceFile): ts.Node[] {
  const result: ts.Node[] = [];

  ts.forEachChild(sourceFile, (node) => {
    if (!ts.canHaveModifiers(node)) return;
    const mods = ts.getModifiers(node);
    if (!mods || !mods.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)) return;

    if (
      ts.isFunctionDeclaration(node) ||
      ts.isClassDeclaration(node) ||
      ts.isInterfaceDeclaration(node) ||
      ts.isTypeAliasDeclaration(node) ||
      ts.isEnumDeclaration(node) ||
      ts.isVariableStatement(node)
    ) {
      result.push(node);
    }
  });

  return result;
}

function getLeadingJSDocCommentRanges(sourceFile: ts.SourceFile, node: ts.Node): ts.CommentRange[] | undefined {
  const ranges = ts.getLeadingCommentRanges(sourceFile.text, node.getFullStart());
  if (!ranges) return undefined;
  return ranges.filter((r) => r.kind === ts.SyntaxKind.MultiLineCommentTrivia && sourceFile.text[r.pos + 1] === "*");
}

function processFile(filePath: string): boolean {
  const sourceText = fs.readFileSync(filePath, "utf-8");
  const sourceFile = ts.createSourceFile(filePath, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

  const exports = getExportedDeclarations(sourceFile);
  if (exports.length === 0) return false;

  let modified = false;
  const edits: { start: number; end: number; text: string }[] = [];

  for (const decl of exports) {
    const jsdocRanges = getLeadingJSDocCommentRanges(sourceFile, decl);
    if (jsdocRanges && jsdocRanges.length > 0) continue;

    let name = "";
    let kind = "";
    let params: { name: string; hasQuestion?: boolean }[] = [];
    let hasReturn = false;
    let isReact = false;

    if (ts.isFunctionDeclaration(decl)) {
      name = decl.name?.getText() || "";
      kind = "function";
      isReact = isReactComponent(name, decl);
      params = (decl.parameters || []).map((p) => ({
        name: p.name.getText(),
        hasQuestion: !!p.questionToken,
      }));
      hasReturn = !!decl.type || decl.body !== undefined;
    } else if (ts.isClassDeclaration(decl)) {
      name = decl.name?.getText() || "";
      kind = "class";
    } else if (ts.isInterfaceDeclaration(decl)) {
      name = decl.name.getText();
      kind = "interface";
    } else if (ts.isTypeAliasDeclaration(decl)) {
      name = decl.name.getText();
      kind = "type";
    } else if (ts.isEnumDeclaration(decl)) {
      name = decl.name.getText();
      kind = "enum";
    } else if (ts.isVariableStatement(decl)) {
      for (const vd of decl.declarationList.declarations) {
        if (!ts.isIdentifier(vd.name)) continue;
        name = vd.name.getText();
        kind = "variable";
        if (vd.initializer && (ts.isArrowFunction(vd.initializer) || ts.isFunctionExpression(vd.initializer))) {
          kind = "function";
          isReact = isReactComponent(name, vd);
          const fn = vd.initializer;
          params = (fn.parameters || []).map((p) => ({
            name: p.name.getText(),
            hasQuestion: !!p.questionToken,
          }));
          hasReturn = !!fn.type || fn.body !== undefined;
        }
        // Only process first exported variable for now (usually one per statement)
        break;
      }
    }

    if (!name) continue;

    const comment = buildJSDoc(name, kind, isReact, params, hasReturn);
    const insertPos = decl.getFullStart();
    const leadingTriviaWidth = decl.getLeadingTriviaWidth(sourceFile);
    const triviaStart = insertPos;

    // Insert before any leading trivia (like comments or blank lines)
    edits.push({ start: triviaStart, end: triviaStart, text: comment + "\n" });
    modified = true;
  }

  if (!modified) return false;

  // Apply edits in reverse order so positions don't shift
  edits.sort((a, b) => b.start - a.start);
  let newText = sourceText;
  for (const edit of edits) {
    newText = newText.slice(0, edit.start) + edit.text + newText.slice(edit.end);
  }

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
