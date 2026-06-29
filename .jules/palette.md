## 2023-11-20 - Keyboard Accessibility on Clickable DIVs
**Learning:** Found a clickable `div` acting as a button (`TacticalBarHeader`) that lacked keyboard and screen reader accessibility. This is a common pattern when adding interactive elements without using native `<button>` tags.
**Action:** Always add `role="button"`, `tabIndex={0}`, and an `onKeyDown` handler (listening for 'Enter' and ' ') to make interactive `div` elements fully accessible. Also use `focus-visible:` tailwind classes to provide clear visual feedback to keyboard users without affecting mouse users.
## 2024-06-29 - Dynamic ARIA labels and Focus Styles
**Learning:** Interactive div elements need proper keyboard support and focus states. In addition, static aria-labels on stateful buttons (like Save) don't provide sufficient context to screen readers.
**Action:** Use dynamic aria-labels for stateful actions and always ensure custom clickable components have focus-visible styles that match their context (e.g. ring-destructive for reset).
