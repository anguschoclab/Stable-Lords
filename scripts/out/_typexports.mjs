import ts from 'typescript';
import fs from 'fs';
for (const f of ['/Users/amauricia/Documents/GitHub/stable-lords/src/types/state.types.ts','/Users/amauricia/Documents/GitHub/stable-lords/src/types/shared.types.ts']) {
  const sf = ts.createSourceFile(f, fs.readFileSync(f,'utf8'), ts.ScriptTarget.Latest, true);
  const names = [];
  ts.forEachChild(sf, (n) => {
    const isExp = ts.canHaveModifiers?.(n) ? (ts.getModifiers(n)??[]).some(m=>m.kind===ts.SyntaxKind.ExportKeyword) : false;
    const isTypeExp = ts.isExportDeclaration(n);
    if (isExp && (ts.isInterfaceDeclaration(n)||ts.isTypeAliasDeclaration(n)||ts.isEnumDeclaration(n)||ts.isClassDeclaration(n)||ts.isVariableStatement(n)||ts.isFunctionDeclaration(n))) {
      if (ts.isVariableStatement(n)) for(const d of n.declarationList.declarations) names.push(d.name.getText(sf));
      else names.push(n.name?.getText(sf));
    } else if (isTypeExp && n.exportClause && ts.isNamedExports(n.exportClause)) {
      for (const e of n.exportClause.elements) names.push(e.name.getText(sf));
    }
  });
  console.log('===', f.split('/').pop(), names.length);
  console.log(names.filter(Boolean).join(', '));
}
