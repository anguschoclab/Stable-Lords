## 2024-05-24 - [Add tooltip to QuestsWidget dismiss button]
**Learning:** Icon-only buttons used for dismissing/closing modals or widgets must have `title` attributes (or equivalent native/custom tooltips) in addition to `aria-label`s to be accessible and intuitive for sighted users hovering with a mouse.
**Action:** When adding new icon-only buttons, always ensure both `aria-label` (for screen readers) and `title` (or a UI tooltip wrapper) are present.
