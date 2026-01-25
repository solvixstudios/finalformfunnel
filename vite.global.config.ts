import path from "path";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    outDir: "public",
    emptyOutDir: false, // Don't delete the loader built by the other config
    rollupOptions: {
      input: path.resolve(__dirname, "src/loader/global.ts"),
      output: {
        entryFileNames: "finalform-global.js",
        format: "iife",
        name: "FinalFormGlobal", // Global variable name for IIFE
      },
    },
    minify: "esbuild",
  },
  define: {
    "process.env.NODE_ENV": '"production"',
  },
});
