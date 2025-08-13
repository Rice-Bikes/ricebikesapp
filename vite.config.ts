import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Improve build performance
    target: 'esnext',
    minify: 'esbuild', // Faster than terser
    cssMinify: 'esbuild', // Fix CSS minification warnings
    
    // Code splitting and chunk optimization
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate vendor chunks
          'react-vendor': ['react', 'react-dom'],
          'query-vendor': ['@tanstack/react-query'],
          'mui-vendor': ['@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled'],
          'grid-vendor': ['ag-grid-react'],
          'router-vendor': ['react-router-dom'],
        },
      },
    },
    
    // Increase chunk size warning limit to reduce noise
    chunkSizeWarningLimit: 1000,
    
    // Optimize source maps for faster builds
    sourcemap: false, // Disable in production for faster builds
  },
  
  // Development optimizations
  optimizeDeps: {
    include: [
      'react', 
      'react-dom', 
      '@mui/material',
      '@tanstack/react-query',
      'ag-grid-react'
    ],
  },
  
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    include: ['**/*.{test,spec}.{js,jsx,ts,tsx}'],
  }
})
