import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

export default defineConfig({
  main: {
    build: {
      rollupOptions: {
        external: ['electron', 'path', 'fs', 'os']
      }
    }
  },
  preload: {
    build: {
      rollupOptions: {
        external: ['electron']
      }
    }
  },
  renderer: {
    root: '.',
    build: {
      outDir: 'dist',
      rollupOptions: {
        input: path.resolve(__dirname, 'index.html')
      }
    },
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src')
      }
    }
  }
})
