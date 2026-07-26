## 2024-05-14 - Radix Dialog Requires Title

**Learning:** Radix UI Dialog components (and Shadcn's wrappers) require a `DialogTitle` inside `DialogContent` for accessibility. If one is missing, it will throw warnings and screen readers will lack context when the modal opens.
**Action:** When using `<DialogContent>` where a visual title isn't needed (or is handled by standard HTML tags like `<h3>`), always include `<DialogTitle className="sr-only">Contextual Title</DialogTitle>` to satisfy both the library's constraints and screen reader requirements.

## 2024-05-15 - Built-in Tooltips in Custom Button Component

**Learning:** The project's custom `Button` component (in `src/components/ui/button.tsx`) has a built-in behavior that automatically wraps the button in a Radix UI `Tooltip` if a `title` or `tooltip` prop is provided. We don't need to manually wrap it with `<Tooltip>` every time.
**Action:** For icon-only buttons (or any buttons that need a tooltip), prefer using the `title` or `tooltip` prop on the `<Button>` component instead of manually wrapping it with `<Tooltip>`, `<TooltipTrigger asChild>`, and `<TooltipContent>`.
