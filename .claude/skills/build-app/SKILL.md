---
name: build-app
description: Creates production build of the application
disable-model-invocation: true
---

Create a production build of the React/Vite application (from the repository
root):

```bash
bun run build       # vite build → dist/
bun run build:dev   # development-mode build
```

Electron packaging is a separate lane (`electron:pack` / `electron:build`) —
see the `run-electron` skill.
