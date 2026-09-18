/**
 * Build the fight runner into a single bundle, stubbing UI-only deps
 * (icons, audio, toast, etc.) that the engine transitively imports.
 *
 * Usage: bun scripts/build-fight.ts && bun scripts/.build/run-fight.js [seed] [styleA] [styleD]
 */
import path from 'node:path';

const root = path.join(import.meta.dir, '..');
const stubDir = path.join(import.meta.dir, 'stubs');

const STUBS: Record<string, string> = {
  'lucide-react': path.join(stubDir, 'lucide-react.ts'),
  howler: path.join(stubDir, 'howler.ts'),
};

const result = await Bun.build({
  entrypoints: [path.join(import.meta.dir, 'run-fight.ts')],
  outdir: path.join(import.meta.dir, '.build'),
  target: 'bun',
  plugins: [
    {
      name: 'headless-ui-stubs',
      setup(build) {
        build.onResolve({ filter: /^[^./@]/ }, (args) => {
          if (STUBS[args.path]) return { path: STUBS[args.path] };
          console.log(`  [import] ${args.path}  <-  ${path.relative(root, args.importer)}`);
          return undefined;
        });
      },
    },
  ],
});

if (!result.success) {
  for (const m of result.logs) console.error(m);
  process.exit(1);
}
console.log('built:', result.outputs.map((o) => o.path).join('\n'));
