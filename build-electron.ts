import * as esbuild from 'esbuild'
import { copyFileSync, mkdirSync, existsSync } from 'fs'
import path from 'path'

async function build() {
  // Ensure output directory exists
  const outDir = 'out'
  if (!existsSync(outDir)) {
    mkdirSync(outDir, { recursive: true })
  }
  if (!existsSync(path.join(outDir, 'main'))) {
    mkdirSync(path.join(outDir, 'main'), { recursive: true })
  }
  if (!existsSync(path.join(outDir, 'preload'))) {
    mkdirSync(path.join(outDir, 'preload'), { recursive: true })
  }

  // Build main process
  await esbuild.build({
    entryPoints: ['src/main/index.ts'],
    bundle: false,
    platform: 'node',
    target: 'node18',
    format: 'cjs',
    outfile: 'out/main/index.js',
    logLevel: 'info'
  })

  // Build preload
  await esbuild.build({
    entryPoints: ['src/preload/index.ts'],
    bundle: false,
    platform: 'node',
    target: 'node18',
    format: 'cjs',
    outfile: 'out/preload/index.js',
    logLevel: 'info'
  })

  console.log('Electron build complete')
}

build().catch(console.error)
