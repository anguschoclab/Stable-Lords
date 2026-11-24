# Fix secret-scanning block on push (.env in history)

A real `GEMINI_API_KEY` was committed in `7bfb896bd Create .env` and merged in `532d98e76`; GitHub push protection rejects the push. The entire unpushed delta is that one file, so we drop both local commits and keep `.env` on disk, untracked and gitignored.

## Root cause

- `origin/main` = `8107c2c9e`. Local `main` is 2 commits ahead: `7bfb896bd` (adds `.env` with a live `GEMINI_API_KEY`) and `532d98e76` (merge whose only content vs origin is `.env`).
- `git diff --stat origin/main..HEAD` → only `.env | 1 +`. Nothing else is unpushed.
- `.env` is already in `.gitignore:79` — the commit bypassed intent (likely created via GitHub web/Desktop on a stray branch, then pulled).
- `7bfb896bd` is on no remote ref — the key has not reached `origin` yet.
- `.env.example` already exists with placeholders and stays tracked.

## Implementation steps

1. **Preserve the key**: `cp .env /tmp/stable-lords-env-backup` (file is 68 bytes, just `GEMINI_API_KEY=...`).
2. **Safety net**: `git branch backup/pre-reset-env-fix` — keeps the merge + `.env` commit reachable until we're sure nothing else was lost.
3. **Verify remote hasn't moved**: `git fetch origin && git status` — confirm still "ahead by 2", `origin/main` still `8107c2c9e`.
4. **Drop the offending commits**: `git reset --hard origin/main` — removes `532d98e76` and `7bfb896bd` from `main`, deletes the tracked `.env` from the worktree. Working tree is already clean, so nothing else is lost.
5. **Restore local config**: `cp /tmp/stable-lords-env-backup .env` — back on disk, now untracked + gitignored.
6. **Verify**: `git status` clean, `git status --ignored` shows `.env` as ignored, `git log origin/main..HEAD` empty, `git ls-files .env` empty.
7. **Done pushing**: local == origin; `git push` is a no-op success. Optionally delete `backup/pre-reset-env-fix` once confirmed.

## Files / commands

- No file edits — `.gitignore` already covers `.env`.
- Commands: `cp`, `git fetch`, `git branch`, `git reset --hard origin/main`, `git push`, plus read-only verification.

## Verification

- [x] `git status` → `up to date with 'origin/main'`, clean tree
- [x] `.env` present on disk with the key; `git check-ignore .env` exits 0 (`.gitignore:79`)
- [x] `git log --all --oneline -- .env` shows only the orphaned `7bfb896bd` on the backup branch (not on `main`)
- [x] `git push` succeeds without push-protection error → `Everything up-to-date`

## Outcome

`main` reset to `8107c2c9e` (== `origin/main`); `532d98e76` + `7bfb896bd` dropped from `main`, still reachable via local `backup/pre-reset-env-fix`. `.env` restored to worktree, untracked + gitignored. **Pending: rotate the leaked `GEMINI_API_KEY` in Google AI Studio and update `.env`; delete `backup/pre-reset-env-fix` when satisfied.**

## Risks / considerations

- **`git reset --hard` is destructive** — mitigated by clean worktree + the `backup/pre-reset-env-fix` branch keeping both dropped commits recoverable.
- **Rotate the API key.** Recommended: the key lived in plaintext in git objects and (per the web-style "Create .env" commit authored via `users.noreply.github.com`) likely transited GitHub. Revoke it in Google AI Studio and put the new key in `.env`. Not strictly required to unblock the push, but strongly advised.
- If `git fetch` reveals `origin/main` moved, re-check the delta before resetting — plan assumes only `.env` is unpushed.
