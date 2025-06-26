import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react-swc"
import { defineConfig } from "vitest/config"
/// <reference types="vitest" />

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    chunkSizeWarningLimit: 1000,
  },
  server: {
    proxy: {
      '/api/deny': {
        target: 'https://lists.blockcore.net',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/deny/, '/deny')
      }
    }
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    onConsoleLog(log: string) {
      return !log.includes("React Router Future Flag Warning");
    },
  }
})