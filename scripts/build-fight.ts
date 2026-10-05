/**
 * Build the fight runner into a single bundle, stubbing UI-only deps
 * (icons, audio, toast, etc.) that the engine transitively imports.
 *
 * Usage: bun scripts/build-fight.ts && bun scripts/.build/run-fight.js [seed] [styleA] [styleD]
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Bun-only build API — this repo doesn't depend on @types/bun, so declare the
// slice of Bun.build this script actually uses.
declare const Bun: {
  build(options: {
    entrypoints: string[];
    outdir: string;
    target: string;
    plugins?: {
      name: string;
      setup(build: {
        onResolve(
          options: { filter: RegExp },
          callback: (args: { path: string; importer: string }) => { path: string } | undefined
        ): void;
      }): void;
    }[];
  }): Promise<{ success: boolean; logs: unknown[]; outputs: { path: string }[] }>;
};

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(scriptDir, '..');
const stubDir = path.join(scriptDir, 'stubs');

const STUBS: Record<string, string> = {
  'lucide-react': path.join(stubDir, 'lucide-react.ts'),
  howler: path.join(stubDir, 'howler.ts'),
};

const result = await Bun.build({
  entrypoints: [path.join(scriptDir, 'run-fight.ts')],
  outdir: path.join(scriptDir, '.build'),
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
