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
  const exportNames = new Set<string>();

  function visit(node: ts.Node) {
    // Collect names from export { foo, bar } and export { type Foo }
    if (ts.isExportDeclaration(node) && node.exportClause && ts.isNamedExports(node.exportClause)) {
      for (const elem of node.exportClause.elements) {
        const localName = (elem.propertyName || elem.name).getText();
        exportNames.add(localName);
      }
    }

    if (ts.canHaveModifiers(node)) {
      const mods = ts.getModifiers(node);
      if (mods && mods.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)) {
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
      }
    }

    if (ts.isClassDeclaration(node)) {
      for (const member of node.members) {
        if (
          ts.isMethodDeclaration(member) ||
          ts.isConstructorDeclaration(member) ||
          ts.isGetAccessorDeclaration(member) ||
          ts.isSetAccessorDeclaration(member)
        ) {
          result.push(member);
        }
      }
    }

    if (
      !ts.isFunctionDeclaration(node) &&
      !ts.isClassDeclaration(node)
    ) {
      ts.forEachChild(node, visit);
    }
  }

  ts.forEachChild(sourceFile, visit);

  // Second pass: find declarations matching export { ... } names
  function findExportedByName(node: ts.Node) {
    if (ts.isFunctionDeclaration(node) && node.name && exportNames.has(node.name.getText())) {
      if (!result.includes(node)) result.push(node);
    }
    if (ts.isClassDeclaration(node) && node.name && exportNames.has(node.name.getText())) {
      if (!result.includes(node)) result.push(node);
    }
    if (ts.isInterfaceDeclaration(node) && exportNames.has(node.name.getText())) {
      if (!result.includes(node)) result.push(node);
    }
    if (ts.isTypeAliasDeclaration(node) && exportNames.has(node.name.getText())) {
      if (!result.includes(node)) result.push(node);
    }
    if (ts.isEnumDeclaration(node) && exportNames.has(node.name.getText())) {
      if (!result.includes(node)) result.push(node);
    }
    if (ts.isVariableStatement(node)) {
      for (const vd of node.declarationList.declarations) {
        if (ts.isIdentifier(vd.name) && exportNames.has(vd.name.getText())) {
          if (!result.includes(node)) result.push(node);
        }
      }
    }
    ts.forEachChild(node, findExportedByName);
  }

  ts.forEachChild(sourceFile, findExportedByName);

  return result;
}

function getLeadingJSDocRanges(sourceFile: ts.SourceFile, node: ts.Node): ts.CommentRange[] {
  const ranges = ts.getLeadingCommentRanges(sourceFile.text, node.getFullStart());
  if (!ranges) return [];
  return ranges.filter((r) => r.kind === ts.SyntaxKind.MultiLineCommentTrivia && sourceFile.text[r.pos + 1] === "*");
}

/**
 * Check if a JSDoc comment is properly placed before a node.
 * A properly placed JSDoc ends with a newline before the node's token.
 */
function isJSDocProperlyPlaced(sourceFile: ts.SourceFile, node: ts.Node, jsdocRange: ts.CommentRange): boolean {
  // The JSDoc ends at jsdocRange.end. Check if the next character is a newline.
  const text = sourceFile.text;
  let pos = jsdocRange.end;
  while (pos < node.getStart() && (text[pos] === " " || text[pos] === "\t")) {
    pos++;
  }
  return pos < node.getStart() && text[pos] === "\n";
}

function processFile(filePath: string): boolean {
  const sourceText = fs.readFileSync(filePath, "utf-8");
  const sourceFile = ts.createSourceFile(filePath, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

  const exports = getExportedDeclarations(sourceFile);
  if (exports.length === 0) return false;

  let modified = false;
  const edits: { start: number; end: number; text: string }[] = [];

  for (const decl of exports) {
    const jsdocRanges = getLeadingJSDocRanges(sourceFile, decl);
    const hasProperJSDoc = jsdocRanges.some((r) => isJSDocProperlyPlaced(sourceFile, decl, r));

    if (hasProperJSDoc) {
      // If proper JSDoc exists, we don't need to add one.
      continue;
    }

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
        break;
      }
    } else if (ts.isMethodDeclaration(decl)) {
      name = decl.name.getText();
      kind = "function";
      params = (decl.parameters || []).map((p) => ({
        name: p.name.getText(),
        hasQuestion: !!p.questionToken,
      }));
      hasReturn = !!decl.type || decl.body !== undefined;
    } else if (ts.isConstructorDeclaration(decl)) {
      name = "constructor";
      kind = "function";
      params = (decl.parameters || []).map((p) => ({
        name: p.name.getText(),
        hasQuestion: !!p.questionToken,
      }));
      hasReturn = false;
    } else if (ts.isGetAccessorDeclaration(decl)) {
      name = decl.name.getText();
      kind = "function";
      params = [];
      hasReturn = true;
    } else if (ts.isSetAccessorDeclaration(decl)) {
      name = decl.name.getText();
      kind = "function";
      params = (decl.parameters || []).map((p) => ({
        name: p.name.getText(),
        hasQuestion: !!p.questionToken,
      }));
      hasReturn = false;
    }

    if (!name) continue;

    const comment = buildJSDoc(name, kind, isReact, params, hasReturn);

    // Remove any malformed JSDoc in the leading trivia
    for (const r of jsdocRanges) {
      edits.push({ start: r.pos, end: r.end, text: "" });
      modified = true;
    }

    // Insert new JSDoc at decl.getStart() (before the token, after trivia)
    const insertPos = decl.getStart();
    edits.push({ start: insertPos, end: insertPos, text: comment + "\n" });
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
