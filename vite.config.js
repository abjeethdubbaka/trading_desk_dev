import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5176,
    strictPort: true
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        // Split large, slow-changing vendor libs into their own cacheable
        // chunks instead of letting them all land in the main entry bundle.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('firebase')) return 'vendor-firebase';
          if (id.includes('recharts') || id.includes('d3-')) return 'vendor-charts';
          if (id.includes('react-router') || id.includes('/react-dom/') || id.includes('/react/')) return 'vendor-react';
          if (id.includes('@tanstack')) return 'vendor-query';
          return undefined;
        },
      },
    },
  },
  base: './',
})
