---
name: run-electron
description: Runs or packages the desktop (Electron) build of the game
disable-model-invocation: true
---

Electron desktop workflows (from the repository root). Main-process code lives
in `electron/`; packaging uses electron-forge (config inside `package.json`).

```bash
bun run electron:compile    # bundle electron/main.ts → electron/main.js (CI gate)
bun run electron:dev        # compile + vite dev + electron-forge start (HMR shell)
bun run electron:pack       # vite build + compile + forge package (fast packaging smoke)
bun run electron:build      # vite build + compile + forge make (installer for host OS)
bun run electron:build:all  # makers for all platforms (squirrel, zip, dmg, deb, rpm)
```

The web build (`bun run build` → `dist/`) is separate — electron packaging
runs `vite build` first, then the forge pipeline.
