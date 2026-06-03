## 2024-06-03 - [Fix nested interactive elements]
**Learning:** Found `<Button>` components nested inside `<Link>` elements, which creates invalid HTML (a `<button>` within an `<a>`) and causes accessibility issues for keyboard and screen-reader users.
**Action:** Use the Shadcn UI `asChild` prop on `<Button>` to wrap `<Link>` elements instead (e.g., `<Button asChild><Link>...</Link></Button>`). This preserves styles while rendering a single valid interactive element.
