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

## 2026-05-31 - [CRITICAL] Arbitrary Window Navigation in Electron

**Vulnerability:** Arbitrary window navigation was unhandled in the `webContents`, which could allow external websites or malicious payloads to navigate the main application window to unsafe domains or protocols (like `file://` loading unexpected local files or remote SMB shares if not properly sandboxed).
**Learning:** Checking only the protocol (`http:`, `https:`) in the `setWindowOpenHandler` is not enough. The `will-navigate` event on `webContents` must also be handled to prevent navigating the existing window. In development, restrict it strictly to `localhost` or `127.0.0.1`. In production, restrict it strictly to local `file:` protocol.
**Prevention:** Always add a `web-contents-created` listener to the `app` object and hook into the `will-navigate` event on the created `webContents`. Validate the exact `origin` or protocol strictly and block all other external domains using `event.preventDefault()`.

## 2024-05-24 - [CRITICAL] Fix dev mode flag and secure web contents

**Vulnerability:** The Electron main process had a hardcoded `const isDev = true;` flag which would have forced development mode (and relaxed security checks) in the production build. Additionally, arbitrary webview creation was not blocked globally, and window opening rules were not applied securely to all created web contents.
**Learning:** Hardcoding environment variables for local testing can easily leak into production. Global security configurations in Electron must be attached to `app.on('web-contents-created')` rather than a specific `BrowserWindow` instance to ensure coverage for all new windows and frames.
**Prevention:** Always use dynamic checks like `app.isPackaged` for environment detection. Apply global security policies using `app.on('web-contents-created')` and block features like webviews using `contents.on('will-attach-webview', (e) => e.preventDefault())`.

## 2026-06-14 - [Remove 'unsafe-eval' from CSP]

**Vulnerability:** The Content-Security-Policy (CSP) in `index.html` allowed `'unsafe-eval'` in the `script-src` directive, potentially exposing the application to Cross-Site Scripting (XSS) via dynamic code execution.
**Learning:** The application does not natively rely on `eval()` or similar functions. Including `'unsafe-eval'` in the CSP is an unnecessary risk, especially for an Electron application where XSS can have severe consequences even with `nodeIntegration` disabled.
**Prevention:** Always follow the principle of least privilege in CSP configurations. Ensure `'unsafe-eval'` and `'unsafe-inline'` are omitted unless absolutely required by a specific, well-understood framework constraint.

## 2026-06-15 - [Remove 'unsafe-inline' from CSP script-src]

**Vulnerability:** The Content-Security-Policy (CSP) in `index.html` allowed `'unsafe-inline'` in the `script-src` directive. This was required for a small inline initialization script for HowlerGlobal, but it broadly exposed the application to Cross-Site Scripting (XSS) via injected inline scripts.
**Learning:** Even a tiny inline script necessitates opening up the CSP significantly. In an Electron context, XSS can lead to severe privilege escalation if the sandbox or context isolation is ever weakened.
**Prevention:** Extract all inline scripts into separate JS files (e.g., `/init-howler.js`) and load them via `<script src="...">`. Then, strictly remove `'unsafe-inline'` from `script-src` to ensure only external scripts from approved sources can run.

2024-06-17: When expanding game narrative systems (e.g., adding traits, lore, origins), always trace how the new properties physically hook into the simulation. A Trait without a handler in `getDynamicTraitMods()` is inert. Always cross-check the interface and the application layer.

## 2024-05-24 - Default Electron Permissions
**Vulnerability:** Arbitrary permission requests (camera, microphone, geolocation) can be made by web contents.
**Learning:** Electron does not deny permissions by default, which can expose the application if a webview or malicious script requests them.
**Prevention:** Implement session.defaultSession.setPermissionRequestHandler to explicitly deny unneeded permissions by default.
