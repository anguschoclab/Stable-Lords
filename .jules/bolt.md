## 2024-05-18 - [Performance Micro-Optimizations]
**Learning:** Consolidating multiple array passes (like chaining `.filter().reduce().filter()`) into a single `for` loop in React hooks prevents redundant iteration and unnecessary intermediate array allocations (which trigger garbage collection). Using `useMemo` when returning objects from hooks prevents child components from unnecessarily re-rendering.
**Action:** Actively scan for instances where arrays are iterated over multiple times to produce derived state, especially inside UI components or hooks, and combine them into a single pass.

## 2024-05-18 - [Bun Package Manager Side-Effects]
**Learning:** Running `bun install` locally on this project's configuration can sometimes inadvertently downgrade the `bun.lock` format (e.g., from v3 to v1), causing massive git diffs that pollute PRs and break CI/CD pipelines.
**Action:** Avoid running `bun install` unless strictly necessary for the prompt. If run, explicitly `git restore bun.lock` before creating a patch or committing, to ensure isolated source code changes.
