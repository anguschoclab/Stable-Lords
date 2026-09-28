import * as fs from 'fs';
import * as path from 'path';

/** Concatenated source of the three lore data shards, for content assertions. */
export const LORE_SOURCE = ['origins', 'childhoodTraits', 'definingMoments']
  .map((f) =>
    fs.readFileSync(
      path.resolve(__dirname, '../../../../engine/narrative/lore/' + f + '.ts'),
      'utf-8'
    )
  )
  .join('\n');

export function extractStringArray(source: string, varName: string): string[] {
  const regex = new RegExp(`(?:export )?const ${varName}.*?= \\[([\\s\\S]*?)\\];`);
  const m = regex.exec(source);
  if (!m || !m[1]) throw new Error(`Could not find ${varName} in loreGenerator.ts`);
  const items = m[1].match(/'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"/g);
  if (!items) return [];
  return items.map((s) => {
    const quote = s[0];
    const content = s.slice(1, -1);
    if (quote === "'") return content.replace(/\\'/g, "'");
    return content.replace(/\\"/g, '"');
  });
}
