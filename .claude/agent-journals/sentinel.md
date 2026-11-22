# Sentinel Journal

## 2026-11-22 - Untrusted file reads are split across a helper AND inline duplicates

**Vulnerability:** No size limit on any renderer file-read path — a hostile
multi-GB picked file would be `readAsText`'d, `JSON.parse`/`parseYaml`'d, and
zod-validated in full (renderer DoS). Three entry points existed:
`src/utils/fileInput.ts` (`readFileInput`, used by ImportExport + Mods) plus
**inline `new FileReader()` reads** in `src/pages/AdminTools/hooks/adminActions.ts`
and `src/pages/startGame/startGameOps.ts` that bypass the helper entirely.
**Learning:** `readFileInput` looks like the single funnel for file input, but
it isn't — hardening only the helper would have left two gaps. The 10 MB cap
(`MAX_FILE_INPUT_BYTES`) was chosen to mirror the existing `save-game` IPC
payload limit in `electron/main.ts` (~line 501), so the renderer and main
process enforce one consistent policy.
**Prevention:** When auditing or hardening file input, always
`grep -rn "new FileReader\|readAsText" src/` — do not assume `readFileInput`
covers every call site. New file-input code should reuse the helper (or at
minimum the shared `MAX_FILE_INPUT_BYTES` constant).
