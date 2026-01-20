import react from "@vitejs/plugin-react-swc";
import path from "path";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "public", // Output directly to public to replace existing files
    emptyOutDir: false, // Don't delete other files in public
    rollupOptions: {
      input: path.resolve(__dirname, "src/loader/index.tsx"),
      output: {
        entryFileNames: "finalform-loader.js",
        format: "iife",
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === "index.css") return "finalform-loader.css";
          return "assets/[name]-[hash][extname]";
        },
        // Ensure we don't code-split excessively for this single-file usage
        manualChunks: undefined,
      },
    },
    // We want a production build
    minify: "esbuild",
    cssCodeSplit: false, // Extract all CSS into one file
  },
  define: {
    "process.env.NODE_ENV": '"production"',
  },
});
