import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    // Globe3D (Three.js ~510 kB) and CategoricalChart (recharts ~286 kB) are
    // intentionally large lazy chunks — only loaded on demand. Raise limit to
    // suppress the expected warning without hiding real oversights.
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // Only split router away from the main React bundle.
        // react + react-dom intentionally stay together in index — splitting them
        // adds a second waterfall RTT before the app can boot, worsening LCP.
        manualChunks(id) {
          if (id.includes('node_modules/react-router-dom/') || id.includes('node_modules/react-router/')) {
            return 'vendor-router'
          }
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
  },
})
