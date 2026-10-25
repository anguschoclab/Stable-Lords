---
name: guard-ratchet
description: Author megaplan guard/ratchet tests and their backing scan scripts. Use when adding a new structural invariant (no dead code, no skill-doc drift, naming/budget/filing rules), writing a scripts/*.mjs audit scanner, or creating a *.guard(.slow).test.ts under src/test/megaplan/. Covers the scanner+report+guard-test+allowlist pattern and the domain-filing rule testQualityAudit enforces.
---

# guard-ratchet

This codebase ratchets quality with paired **scan scripts** + **guard tests**.
The pattern: a zero-dep scanner emits a JSON report; a megaplan test execs it
and asserts the bad-thing list stays empty (or never grows past an allowlist).

## The pattern

1. **Scanner** — `scripts/<name>.mjs`, zero dependencies, Node+bun compatible.
   Writes `scripts/out/<name>.json` (always written, even on failure) + stdout
   summary. `process.exit(1)` when violations exist → CI gate. Precedent:
   `orphan-scan.mjs`, `data-array-dup-scan.mjs`, `skill-path-scan.mjs`.
2. **Guard test** — `src/test/megaplan/<name>.guard(.slow).test.ts`:
   - `.slow.test.ts` suffix when it execs a subprocess or is heavy —
     excluded from `bun run test`, runs under `bun run test:slow` (nightly gate).
   - `execFileSync('node', [script])` in `beforeAll` (**not** describe scope —
     a describe-level subprocess fires during collection even for filtered runs).
   - Swallow the non-zero exit and read the report anyway — the assertion diff
     is the readable failure.
3. **Allowlist baseline** — a `Set` of known-OK entries with a comment
   explaining each, asserted as `novel = found.filter(x => !ALLOWED.has(x))`.
   Count ratchets (`expect(count).toBeLessThanOrEqual(N)`) for surfaces that
   legitimately mix live + dead entries; named lists for zero-tolerance rules.

## Filing rules (testQualityAudit enforces)

- Specs live under `src/test/<domain>/` matching their subject's domain —
  megaplan = repo-structure/tooling guards.
- `*.slow.test.*` if it simulates many weeks, execs a subprocess, or runs >~2s.
- e2e specs get `{ tag: '@slow' }` if they drive long sessions.
- See `docs/TESTING.md` for the full conventions.

## Checklist for a new ratchet

- [ ] Scanner prints *what* violated, not just a count — the guard failure
      message is only as good as the report.
- [ ] Report written before `process.exit(1)` so the test can read it.
- [ ] Scanner is idempotent and read-only on `src/` (writes only `scripts/out/`).
- [ ] False-positive escape hatch: named allowlist with per-entry comments,
      not a blanket `skip`.
- [ ] Verified both directions: passes clean, fails on a planted violation.

## Notes

- `scripts/out/` is the report dir — gitignored or committed artifacts vary;
  match what neighboring scans do.
- Prefer file-content scans over typecheck-dependent logic in scanners —
  they must run fast (~seconds) and not flake on unrelated breakage.
