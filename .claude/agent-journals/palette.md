# Palette's Journal

## 2026-11-22 - Attribute-level a11y is already covered; look for discoverability gaps

**Learning:** The obvious a11y sweep comes back empty here — TanStack `Link`
auto-adds `aria-current="page"` (`link.js` sets it when `isActive`), lucide
icons ship `aria-hidden="true"` by default, icon-only buttons have
`aria-label`s, toggles use `aria-pressed`/`aria-expanded`, inputs have labels,
and `motion-reduce:` coverage is guard-tested (`accessibilityMotionReduce`,
`UIPolishDedup`). The real wins are _feature discoverability_: five global
keyboard shortcuts lived only in `useKeyboardShortcuts` + a cryptic
`( / )` placeholder — now documented as a Codex accordion section.

**Action:** Before proposing aria/label fixes, verify the primitive doesn't
already inject them (TanStack Link, lucide, Radix). Better hunting grounds:
undocumented shortcuts, `title`-only affordances, silent async ops. If the
NAV_ROUTES list in `useKeyboardShortcuts.ts` changes, the
`KeyboardShortcutsSection` grid in `src/pages/help/sections.tsx` must be
updated to match — there is no test coupling them.
