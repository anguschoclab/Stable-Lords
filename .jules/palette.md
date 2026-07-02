## 2023-11-20 - Keyboard Accessibility on Clickable DIVs
**Learning:** Found a clickable `div` acting as a button (`TacticalBarHeader`) that lacked keyboard and screen reader accessibility. This is a common pattern when adding interactive elements without using native `<button>` tags.
**Action:** Always add `role="button"`, `tabIndex={0}`, and an `onKeyDown` handler (listening for 'Enter' and ' ') to make interactive `div` elements fully accessible. Also use `focus-visible:` tailwind classes to provide clear visual feedback to keyboard users without affecting mouse users.
## 2026-07-02 - Added aria-label to TacticBank buttons
**Learning:** By adding `aria-label` attributes constructed using template literals with the dynamic text (e.g. `${t.label}`), we can offer screen-reader users more descriptive information for buttons that only contain an icon, thus meeting WCAG 2.5.3 Name in Label criteria and ensuring they have explicit context rather than reading out the generic visible text.
**Action:** When creating icon-only buttons that map to a dynamic structure, explicitly include an `aria-label` describing the item.
