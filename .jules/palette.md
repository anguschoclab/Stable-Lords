
## 2025-01-31 - Tooltip buttons need ARIA labels
**Learning:** Icon-only buttons wrapped in `TooltipTrigger asChild` still need an explicit `aria-label` because `TooltipContent` isn't always reliably announced as the button's accessible name by screen readers.
**Action:** Always add `aria-label` to icon-only `<Button>`s even when inside a `<Tooltip>`.
