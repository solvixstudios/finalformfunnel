import react from "@vitejs/plugin-react-swc";
import autoprefixer from "autoprefixer";
import path from "path";
import remToPx from "postcss-rem-to-pixel";
import tailwindcss from "tailwindcss";
import { defineConfig } from "vite";

import { readFileSync } from "fs";

// Read version directly from package.json
const pkg = JSON.parse(
  readFileSync(path.resolve(__dirname, "package.json"), "utf-8"),
);
const APP_VERSION = pkg.version;

export default defineConfig({
  plugins: [react()],
  css: {
    postcss: {
      plugins: [
        tailwindcss(),
        autoprefixer(),
        remToPx({
          rootValue: 16,
          propList: ["*"],
          selectorBlackList: [],
          replace: true,
          mediaQuery: false,
          minPixelValue: 0,
        }),
      ],
    },
  },
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
          if (assetInfo.name?.endsWith(".css")) return "finalform-loader.css";
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
