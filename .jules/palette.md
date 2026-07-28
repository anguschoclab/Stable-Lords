## 2024-05-24 - [Explicit Label Associations for UI Inputs]
**Learning:** Found a common accessibility pattern issue where Radix UI primitives (`Switch`, `Slider`, `Select`) in forms and settings (like `ArenaSettings.tsx`) lacked explicit `id` attributes and their corresponding `<Label>` tags lacked `htmlFor` attributes. This prevents screen readers from correctly associating the text with the interactive element and prevents users from toggling/focusing the element by clicking the label itself.
**Action:** Always explicitly link `Label` components to their respective inputs (`Switch`, `Slider`, `Select`, etc.) using matching `htmlFor` and `id` attributes when building or modifying configuration panels and forms to maintain a11y compliance.

## 2026-07-28 - Radix UI Tooltip Context in Tests
**Learning:** When testing components in Vitest that utilize Radix UI Tooltips (like a custom Button component passing a `tooltip` prop), the component must be wrapped in a `<TooltipProvider>` to prevent "Tooltip must be used within TooltipProvider" errors.
**Action:** Ensure `<TooltipProvider>` from `@radix-ui/react-tooltip` wraps the component in the `render()` function within test files.
