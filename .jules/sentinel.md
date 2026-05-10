## 2024-05-02 - [XSS via dynamically injected `<style>` tag]
**Vulnerability:** A React component `ChartStyle` utilized `dangerouslySetInnerHTML` to inject dynamic styling via a raw `<style>` tag. Values like CSS variables were generated from configuration strings. Even with simple regex scrubbing (e.g. `replace(/[<>"';{}]/g, '')`), this pattern is fundamentally risky and prone to bypasses leading to XSS or CSS injection.
**Learning:** Using `dangerouslySetInnerHTML` to build inline `<style>` tags from props is dangerous and brittle.
**Prevention:** Construct standard JavaScript objects for dynamic styles and pass them into the `style` prop of the React component wrapper (`<div style={{...styles}}>`). This utilizes React's built-in safe DOM manipulation mechanisms and naturally isolates CSS properties to the element without string injection risks.

## 2024-05-09 - [Electron Renderer Sandbox Disabled]
**Vulnerability:** The Electron application was configured with `sandbox: false` in its `webPreferences`. This disabled the Chromium sandbox for the renderer processes, which would allow any potential RCE (Remote Code Execution) or untrusted code running in the renderer to have full access to the underlying OS.
**Learning:** Even when `nodeIntegration: false` and `contextIsolation: true` are set, explicitly setting `sandbox: false` undermines the defense-in-depth model of Electron applications, making renderer exploits significantly more dangerous.
**Prevention:** Always rely on Electron's default security configuration (where `sandbox` is enabled by default) or explicitly set `sandbox: true` when configuring `BrowserWindow` instances. Do not disable the sandbox unless absolutely required by a specific and isolated use-case.
