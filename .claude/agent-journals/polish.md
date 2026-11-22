# Polish Journal

## 2026-11-24 - fileBudget.test.ts ratchets function length

**Issue:** A small dialog addition to `src/pages/Bookmarks.tsx` pushed the `Bookmarks` page
component over 80 lines, failing `src/test/megaplan/fileBudget.test.ts`
("functions >80" baseline of 19 became 20).
**Learning:** The repo enforces a _ratcheted_ budget: the count of functions >80 lines may only
go down. Any JSX addition to an already-long page component can trip it — the guard is global,
not per-file, so the failure surfaces far from the diff.
**Rule:** Before editing a page-level component, check its current length (~70+ lines means no
headroom). Pre-emptively extract static JSX into zero-prop sibling components in the same file
(e.g. `BookmarksEmptyState`, `ClearBookmarksDialog`) so the page function stays under 80.
