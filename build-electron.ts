import { execSync } from 'child_process'
import { mkdirSync, existsSync } from 'fs'
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

  // Build main process using tsc
  execSync('npx tsc --project tsconfig.json', {
    cwd: path.join(process.cwd(), 'src/main'),
    stdio: 'inherit'
  })

  // Copy compiled file to output
  execSync('cp src/main/index.js out/main/index.js', {
    stdio: 'inherit'
  })

  // Build preload using tsc
  execSync('npx tsc --project tsconfig.json', {
    cwd: path.join(process.cwd(), 'src/preload'),
    stdio: 'inherit'
  })

  // Copy compiled file to output
  execSync('cp src/preload/index.js out/preload/index.js', {
    stdio: 'inherit'
  })

  console.log('Electron build complete')
}

build().catch(console.error)
