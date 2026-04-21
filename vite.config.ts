import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { TanStackRouterVite } from "@tanstack/router-vite-plugin";

// Strips the react-refresh runtime preamble that @vitejs/plugin-react-swc
// injects into every transformed file. Web workers crash on it because they
// have no `window`. Must run AFTER the react plugin (enforce: "post").
function stripWorkerRefresh(): Plugin {
  return {
    name: "strip-worker-refresh",
    enforce: "post",
    transform(code, id) {
      if (!id.includes("engine/worker.ts") && !id.includes("engine/worker?")) return;
      // Remove the RefreshRuntime preamble block inserted by the SWC plugin
      return {
        code: code
          .replace(/import\s+\*\s+as\s+\w+\s+from\s+["']@react-refresh["'];?[\s\S]*?\/\/ (end of [^\n]*\n)?/g, "")
          .replace(/import\s+\{[^}]*\}\s+from\s+["']@react-refresh["'];?[^\n]*/g, "")
          .replace(/if\s*\(import\.meta\.hot\)[\s\S]*?}\s*\n/g, ""),
        map: null,
      };
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    TanStackRouterVite({
      autoCodeSplitting: true,
    }),
    react(),
    stripWorkerRefresh(),
  ],
  worker: {
    format: "es",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    'global.HowlerGlobal': '{}',
  },
}));
