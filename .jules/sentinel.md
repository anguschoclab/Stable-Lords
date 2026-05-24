## 2024-05-02 - [XSS via dynamically injected `<style>` tag]
**Vulnerability:** A React component `ChartStyle` utilized `dangerouslySetInnerHTML` to inject dynamic styling via a raw `<style>` tag. Values like CSS variables were generated from configuration strings. Even with simple regex scrubbing (e.g. `replace(/[<>"';{}]/g, '')`), this pattern is fundamentally risky and prone to bypasses leading to XSS or CSS injection.
**Learning:** Using `dangerouslySetInnerHTML` to build inline `<style>` tags from props is dangerous and brittle.
**Prevention:** Construct standard JavaScript objects for dynamic styles and pass them into the `style` prop of the React component wrapper (`<div style={{...styles}}>`). This utilizes React's built-in safe DOM manipulation mechanisms and naturally isolates CSS properties to the element without string injection risks.

## 2024-05-02 - [Missing Content Security Policy (CSP)]
**Vulnerability:** The application was missing a Content Security Policy (CSP) header, leaving it vulnerable to various types of injection attacks, including Cross-Site Scripting (XSS) and data injection. Without a CSP, the browser assumes any script or resource included in the page is safe to execute or load.
**Learning:** Even static or locally-run applications benefit from a baseline CSP to restrict unauthorized resource loading or execution. The CSP must be carefully balanced with the needs of the development environment (e.g., Vite's HMR requires `wss:` and `'unsafe-eval'`)
**Prevention:** Always include a baseline `<meta http-equiv="Content-Security-Policy">` tag in the root HTML file (`index.html`), defining strict `default-src` policies and whitelisting only necessary external domains (like fonts or specific APIs).

## 2025-02-24 - [Electron Sandbox Disabled]
**Vulnerability:** The Electron main process explicitly disabled the sandbox for renderer processes (`sandbox: false` in `webPreferences`).
**Learning:** Disabling the Electron sandbox significantly weakens defense-in-depth, allowing a compromised renderer process (e.g., via XSS) to escape the Chromium sandbox.
**Prevention:** Rely on Electron's secure defaults. Never set `sandbox: false` unless there is a specific, well-understood requirement and alternative security measures are in place. Use `contextIsolation` and `nodeIntegration: false` in conjunction with the sandbox.
## 2024-05-30 - Prevent Arbitrary URI Execution in Electron windowOpenHandler
**Vulnerability:** The Electron main process allowed any URL passed to `setWindowOpenHandler` to be opened via `shell.openExternal(url)`, risking execution of arbitrary URIs (e.g., `file://`, `smb://`).
**Learning:** In Electron, web content can try to open new windows with any URI scheme. If `shell.openExternal` is used without validation, it can lead to remote code execution or unauthorized access to local files.
**Prevention:** Always validate the protocol of the URL using `new URL(url).protocol` against an allowlist of safe protocols (like `http:`, `https:`, `mailto:`) before calling `shell.openExternal()`.
