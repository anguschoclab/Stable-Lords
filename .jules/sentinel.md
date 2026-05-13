## 2024-05-02 - [XSS via dynamically injected `<style>` tag]
**Vulnerability:** A React component `ChartStyle` utilized `dangerouslySetInnerHTML` to inject dynamic styling via a raw `<style>` tag. Values like CSS variables were generated from configuration strings. Even with simple regex scrubbing (e.g. `replace(/[<>"';{}]/g, '')`), this pattern is fundamentally risky and prone to bypasses leading to XSS or CSS injection.
**Learning:** Using `dangerouslySetInnerHTML` to build inline `<style>` tags from props is dangerous and brittle.
**Prevention:** Construct standard JavaScript objects for dynamic styles and pass them into the `style` prop of the React component wrapper (`<div style={{...styles}}>`). This utilizes React's built-in safe DOM manipulation mechanisms and naturally isolates CSS properties to the element without string injection risks.

## 2025-02-24 - [Electron Sandbox Disabled]
**Vulnerability:** The Electron main process explicitly disabled the sandbox for renderer processes (`sandbox: false` in `webPreferences`).
**Learning:** Disabling the Electron sandbox significantly weakens defense-in-depth, allowing a compromised renderer process (e.g., via XSS) to escape the Chromium sandbox.
**Prevention:** Rely on Electron's secure defaults. Never set `sandbox: false` unless there is a specific, well-understood requirement and alternative security measures are in place. Use `contextIsolation` and `nodeIntegration: false` in conjunction with the sandbox.
