import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import fs from 'fs';
import { TanStackRouterVite } from '@tanstack/router-vite-plugin';
import { VitePWA } from 'vite-plugin-pwa';

// Strips the react-refresh runtime preamble that @vitejs/plugin-react-swc
// injects into every transformed file. Web workers crash on it because they
// have no `window`. Must run AFTER the react plugin (enforce: "post").
function stripWorkerRefresh(): Plugin {
  return {
    name: 'strip-worker-refresh',
    enforce: 'post',
    transform(code, id) {
      if (!id.match(/engine\/(worker|storage\/archiveWorker)\.ts/) && !id.match(/engine\/(worker|storage\/archiveWorker)\?/)) return;
      // Remove the RefreshRuntime preamble block inserted by the SWC plugin
      return {
        code: code
          .replace(
            /import\s+\*\s+as\s+\w+\s+from\s+["']@react-refresh["'];?[\s\S]*?\/\/ (end of [^\n]*\n)?/g,
            ''
          )
          .replace(/import\s+\{[^}]*\}\s+from\s+["']@react-refresh["'];?[^\n]*/g, '')
          .replace(/if\s*\(import\.meta\.hot\)[\s\S]*?}\s*\n/g, ''),
        map: null,
      };
    },
  };
}

// Fixes howler.js spatial plugin scoping issue.
// howler's dist/howler.js has two IIFEs: the core IIFE declares
// `var HowlerGlobal/Howler/Howl/Sound` and sets them on `window`. The
// spatial plugin IIFE references these as bare variables, which in
// non-strict mode resolve to `window.X`. But ESM strict mode throws
// ReferenceError for undeclared variables. Vite's pre-bundler wraps
// both IIFEs in a single function, preserving their closures, so the
// spatial plugin can't access the core's `var` declarations.
// This plugin intercepts howler at the module resolution level, patches
// the spatial plugin's bare references to use `globalThis.X`, and adds ESM
// exports — bypassing pre-bundling entirely.
function fixHowler(): Plugin {
  const VIRTUAL_ID = '\0howler-patched';
  let cachedCode: string | null = null;

  function getPatchedCode(): string {
    if (cachedCode) return cachedCode;
    const source = fs.readFileSync(
      path.resolve(import.meta.dirname, 'node_modules/howler/dist/howler.js'),
      'utf-8'
    );
    const marker = '/*!\n *  Spatial Plugin';
    const idx = source.indexOf(marker);
    if (idx === -1) {
      cachedCode = source;
      return source;
    }
    const core = source.slice(0, idx);
    let spatial = source.slice(idx);
    // Replace bare references with globalThis.X in the spatial plugin only.
    // globalThis works in both main thread (window) and worker contexts.
    // Word boundaries ensure HowlerGlobal is not partially matched by Howler, etc.
    spatial = spatial
      .replace(/\bHowlerGlobal\b/g, 'globalThis.HowlerGlobal')
      .replace(/\bHowler\b/g, 'globalThis.Howler')
      .replace(/\bHowl\b/g, 'globalThis.Howl')
      .replace(/\bSound\b/g, 'globalThis.Sound');
    // Wrap spatial plugin in a guard so it only runs when HowlerGlobal is available
    // (main thread). In workers, the spatial plugin is skipped.
    spatial = 'if (typeof globalThis.HowlerGlobal !== "undefined") {\n' + spatial + '\n}\n';
    // Add ESM exports — howler sets these on globalThis during the core IIFE
    // (main thread only). In workers, globalThis.Howl is undefined, so we
    // fall back to a no-op constructor to avoid crashes. The worker doesn't
    // actually use howler — it just gets pulled into the module graph.
    cachedCode = core + spatial + `
var __howl = globalThis.Howl || function() { this.play = function(){}; this.stop = function(){}; this.volume = function(){}; this.mute = function(){}; this.unload = function(){}; this.state = function(){return 'unloaded';}; this.on = function(){return this;}; this.once = function(){return this;}; this.off = function(){return this;}; };
var __howler = globalThis.Howler || { ctx: null, _enabled: false, _muted: false, mute: function(){}, volume: function(){}, stop: function(){}, unload: function(){}, codecs: function(){return false;}, usingWebAudio: false, usingHTML5Audio: false, noAudio: false, autoUnlock: false, autoSuspend: false, mobileAutoEnable: false, _pos: [0,0,0], _orientation: [0,0,-1,0,1,0] };
export { __howl as Howl, __howler as Howler };
`;
    return cachedCode;
  }

  return {
    name: 'fix-howler',
    enforce: 'pre',
    resolveId(source) {
      if (source === 'howler') return VIRTUAL_ID;
    },
    load(id) {
      if (id !== VIRTUAL_ID) return;
      return getPatchedCode();
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: '::',
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    fixHowler(),
    TanStackRouterVite({
      autoCodeSplitting: true,
    }),
    react(),
    stripWorkerRefresh(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icons/icon-192.png', 'icons/icon-512.png'],
    }),
  ],
  worker: {
    format: 'es',
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id: string) => {
          if (
            id.includes('node_modules/react/') ||
            id.includes('node_modules/react-dom/') ||
            id.includes('node_modules/framer-motion/')
          )
            return 'vendor-core';
          if (
            id.includes('node_modules/lucide-react/') ||
            id.includes('node_modules/date-fns/')
          )
            return 'vendor-ui';
          if (
            id.includes('src/engine/simulate.ts') ||
            id.includes('src/engine/impacts/index.ts') ||
            id.includes('src/engine/recruitment.ts')
          )
            return 'engine-core';
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
});
