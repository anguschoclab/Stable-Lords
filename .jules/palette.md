## 2024-05-14 - Radix Dialog Requires Title

**Learning:** Radix UI Dialog components (and Shadcn's wrappers) require a `DialogTitle` inside `DialogContent` for accessibility. If one is missing, it will throw warnings and screen readers will lack context when the modal opens.
**Action:** When using `<DialogContent>` where a visual title isn't needed (or is handled by standard HTML tags like `<h3>`), always include `<DialogTitle className="sr-only">Contextual Title</DialogTitle>` to satisfy both the library's constraints and screen reader requirements.
