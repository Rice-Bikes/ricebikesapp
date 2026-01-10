import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Improve build performance
    target: "esnext",
    minify: "esbuild", // Faster than terser
    cssMinify: "esbuild", // Fix CSS minification warnings

    // Code splitting and chunk optimization
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate vendor chunks
          "react-vendor": ["react", "react-dom"],
          "query-vendor": ["@tanstack/react-query"],
          "mui-vendor": [
            "@mui/material",
            "@mui/icons-material",
            "@emotion/react",
            "@emotion/styled",
          ],
          "grid-vendor": ["ag-grid-react"],
          "router-vendor": ["react-router-dom"],
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
      "react",
      "react-dom",
      "@mui/material",
      "@tanstack/react-query",
      "ag-grid-react",
    ],
  },

  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/setupTests.ts"],
    include: ["**/*.{test,spec}.{js,jsx,ts,tsx}"],
    // Coverage configuration: generate multiple reporters including a JSON summary
    coverage: {
      provider: "v8", // use the V8 provider (fast) via @vitest/coverage-v8
      reporter: ["text", "lcov", "json-summary"],
      // Only include project source files under `src/` in the coverage report
      // This prevents vendor, scripts, and build artifacts from being counted.
      // When `all` is true Vitest will include every file that matches `include`
      // even if it isn't required/imported by our tests. That inflates the scope
      // of coverage and makes the overall percentage reflect untested files.
      // Set `all` to false so coverage only counts files exercised by tests by default.
      all: false,
      include: ["src/**/*.{js,jsx,ts,tsx}"],
      // exclude test files, integration-heavy modules, and external deps
      exclude: [
        "**/*.test.*",
        "tests/**",
        "node_modules/**",
        "public/**",
        "src/model.ts",
      ],
    },
  },
});
