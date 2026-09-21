// Structural guard test for schema file comment hygiene.
// Catches the duplicate/stale JSDoc comment artifact left by the
// 8e48df37 "decompose schemaObjects.ts" refactor, where each schema
// ended up with two consecutive JSDoc blocks (one orphan) or a
// comment naming a schema that was moved to a different file.
//
// Pattern follows src/test/ui/sliderDuplicateId.test.ts: read the
// source file as text and assert structural invariants.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';

const SCHEMA_FILES = [
  'src/schemas/warriorSchemas.ts',
  'src/schemas/fightSchemas.ts',
  'src/schemas/economySchemas.ts',
].map((f) => path.resolve(process.cwd(), f));

describe('schema comment hygiene', () => {
  for (const filePath of SCHEMA_FILES) {
    const rel = path.relative(process.cwd(), filePath);

    describe(rel, () => {
      it('has no duplicate consecutive JSDoc blocks', () => {
        const content = readFileSync(filePath, 'utf-8');
        // A JSDoc close immediately followed by a blank line and
        // another JSDoc open is the signature of the duplicate-comment
        // artifact left by the schemaObjects.ts decompose refactor.
        expect(content).not.toMatch(/\*\/\n\n\/\*\*/);
      });

      it('every JSDoc schema comment is followed by a matching export', () => {
        const content = readFileSync(filePath, 'utf-8');
        // Match a JSDoc block naming "<Name> schema", then the following const decl.
        const commentRegex =
          /\/\*\*\s*\n\s*\*\s*(\w+)\s+schema[\s\S]*?\*\/\n\n(?:export\s+)?const\s+(\w+)/g;
        let match;
        while ((match = commentRegex.exec(content)) !== null) {
          const commentName = match[1]!;
          const constName = match[2]!;
          // The comment name should match the const name (minus "Schema" suffix)
          expect(constName.startsWith(commentName)).toBe(true);
        }
      });
    });
  }
});
