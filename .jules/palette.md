## 2023-11-20 - Keyboard Accessibility on Clickable DIVs
**Learning:** Found a clickable `div` acting as a button (`TacticalBarHeader`) that lacked keyboard and screen reader accessibility. This is a common pattern when adding interactive elements without using native `<button>` tags.
**Action:** Always add `role="button"`, `tabIndex={0}`, and an `onKeyDown` handler (listening for 'Enter' and ' ') to make interactive `div` elements fully accessible. Also use `focus-visible:` tailwind classes to provide clear visual feedback to keyboard users without affecting mouse users.
## 2026-06-30 - Dynamic ARIA Labels for Stateful Elements
**Learning:** When adding accessibility to stateful components like save buttons, static aria-labels like 'Save status' fail to provide current state context to screen readers.
**Action:** Always dynamically update aria-labels based on state (e.g., `aria-label={lastSavedAt ? 'Auto-Saved' : 'Not Saved'}`) to ensure accurate announcements.
