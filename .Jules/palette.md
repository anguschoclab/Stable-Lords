## 2023-11-20 - Keyboard Accessibility on Clickable DIVs
**Learning:** Found a clickable `div` acting as a button (`TacticalBarHeader`) that lacked keyboard and screen reader accessibility. This is a common pattern when adding interactive elements without using native `<button>` tags.
**Action:** Always add `role="button"`, `tabIndex={0}`, and an `onKeyDown` handler (listening for 'Enter' and ' ') to make interactive `div` elements fully accessible. Also use `focus-visible:` tailwind classes to provide clear visual feedback to keyboard users without affecting mouse users.
