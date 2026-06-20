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
    // Enable better minification (oxc is the default in Vite 8)
    minify: 'oxc',
    rollupOptions: {
      output: {
        // Manual chunk splitting strategy:
        //  - react + react-dom stay in index (splitting them adds RTT waterfall worsening LCP)
        //  - recharts isolated: only loaded when charts render (~286 kB gzip 88 kB)
        //  - lucide-react isolated: icon library tree-shaken but still significant
        //  - three.js isolated: only loaded via Globe3D lazy import (~510 kB)
        manualChunks(id) {
          if (id.includes('node_modules/react-router-dom/') || id.includes('node_modules/react-router/')) {
            return 'vendor-router'
          }
          if (id.includes('node_modules/recharts/') || id.includes('node_modules/d3-') || id.includes('node_modules/victory-')) {
            return 'vendor-charts'
          }
          if (id.includes('node_modules/lucide-react/')) {
            return 'vendor-icons'
          }
          if (id.includes('node_modules/three/')) {
            return 'vendor-three'
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

