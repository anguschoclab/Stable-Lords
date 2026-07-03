## 2023-11-20 - Keyboard Accessibility on Clickable DIVs
**Learning:** Found a clickable `div` acting as a button (`TacticalBarHeader`) that lacked keyboard and screen reader accessibility. This is a common pattern when adding interactive elements without using native `<button>` tags.
**Action:** Always add `role="button"`, `tabIndex={0}`, and an `onKeyDown` handler (listening for 'Enter' and ' ') to make interactive `div` elements fully accessible. Also use `focus-visible:` tailwind classes to provide clear visual feedback to keyboard users without affecting mouse users.

## 2023-11-22 - Design Token Consistency
**Learning:** Found several components using raw Tailwind color classes (`amber-500`, `emerald-500`, `violet-500`, `stone-400`, `blue-300`, `purple-400`) instead of the project's design tokens (`arena-gold`, `arena-fame`, `arena-pop`, `primary`, `muted-foreground`, `muted`).
**Action:** Always use design tokens defined in `src/index.css` instead of raw Tailwind colors. This ensures visual consistency across the arena UI and makes theme changes easier. Effect component colors (ParticleSystem, WeaponTrail, weather effects) are intentional artistic choices and exempt.

## 2023-11-22 - Aria Labels on Tactic Buttons
**Learning:** Tactic buttons in `PlanStep` had visible text labels but lacked `aria-label` attributes, making them harder for screen readers to identify in context.
**Action:** Add `aria-label={`Select Tactic: ${t.label}`}` to interactive buttons that have icon+text combinations, ensuring screen readers announce the action context clearly.
