## 2026-07-04 - Interactive Divs Must Be Fully Accessible
**Learning:** In React, adding an `onClick` handler to a `div` or `span` isn't enough. It creates an inaccessible interactive element. A recurring issue in this app was clickable divs (e.g., tournament bracket slots, editable text components) lacking proper ARIA labels and keyboard support.
**Action:** When an interactive `div` cannot be changed to a `<button>`, always add `role="button"`, `tabIndex={0}`, `onKeyDown` (for Enter/Space), and `focus-visible:` tailwind styles.
