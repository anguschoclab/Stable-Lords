## 2026-07-04 - Interactive Divs Must Be Fully Accessible
**Learning:** In React, adding an `onClick` handler to a `div` or `span` isn't enough. It creates an inaccessible interactive element. A recurring issue in this app was clickable divs (e.g., tournament bracket slots, editable text components) lacking proper ARIA labels and keyboard support.
**Action:** When an interactive `div` cannot be changed to a `<button>`, always add `role="button"`, `tabIndex={0}`, `onKeyDown` (for Enter/Space), and `focus-visible:` tailwind styles.
## 2026-07-08 - Accessible Dialogs/Sheets Need Descriptions
**Learning:** When using Radix UI or shadcn/ui components like `<DialogContent>` or `<SheetContent>`, passing `aria-describedby={undefined}` to bypass accessibility warnings is a poor UX anti-pattern. Screen readers are left without proper context when the flyout or modal opens.
**Action:** Instead of suppressing the warning, always explicitly import and insert `<DialogDescription className="sr-only">` or `<SheetDescription className="sr-only">` with meaningful text to properly announce the content to assistive technologies.
