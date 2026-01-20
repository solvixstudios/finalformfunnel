import react from "@vitejs/plugin-react-swc";
import path from "path";
import { defineConfig } from "vite";

import { readFileSync } from "fs";

// Read version directly from package.json
const pkg = JSON.parse(
  readFileSync(path.resolve(__dirname, "package.json"), "utf-8"),
);
const APP_VERSION = pkg.version;

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "public",
    emptyOutDir: false,
    rollupOptions: {
      input: path.resolve(__dirname, "src/loader/index.tsx"),
      output: {
        entryFileNames: "finalform-loader.js",
        format: "iife",
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === "index.css") return "finalform-loader.css";
          return "assets/[name]-[hash][extname]";
        },
        manualChunks: undefined,
      },
    },
    minify: "esbuild",
    cssCodeSplit: false,
  },
  define: {
    "process.env.NODE_ENV": '"production"',
    __APP_VERSION__: JSON.stringify(APP_VERSION),
  },
});
