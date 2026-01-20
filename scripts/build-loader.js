/**
 * Build script for FinalForm Loader
 * Post-processes the Vite build output (obfuscation)
 *
 * Usage: npm run build:loader (which runs vite build first, then this)
 */

import { mkdirSync, readFileSync, writeFileSync } from "fs";
import JavaScriptObfuscator from "javascript-obfuscator";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const PUBLIC = join(ROOT, "public");
const DIST = join(ROOT, "dist");

// Ensure dist directory exists
mkdirSync(DIST, { recursive: true });

async function postProcessLoader() {
  console.log("🔧 Post-processing FinalForm Loader...\n");

  const loaderJsPath = join(PUBLIC, "finalform-loader.js");
  const loaderCssPath = join(PUBLIC, "finalform-loader.css");

  // 1. Read the JS file (bundled by Vite)
  console.log("📄 Reading JS file...");
  let jsContent = "";
  try {
    jsContent = readFileSync(loaderJsPath, "utf-8");
  } catch (e) {
    console.error(
      "❌ Could not read public/finalform-loader.js. Did the Vite build fail?",
    );
    process.exit(1);
  }

  console.log(`   JS Size: ${jsContent.length} bytes`);

  // 2. Obfuscate
  console.log("🔒 Obfuscating...");
  const obfuscated = JavaScriptObfuscator.obfuscate(jsContent, {
    compact: true,
    controlFlowFlattening: false, // Keep performance
    deadCodeInjection: false, // Keep size small
    debugProtection: false,
    disableConsoleOutput: false, // Keep console logs for debugging
    identifierNamesGenerator: "mangled-shuffled",
    log: false,
    numbersToExpressions: false,
    renameGlobals: false,
    selfDefending: false,
    simplify: true,
    splitStrings: false,
    stringArray: true,
    stringArrayCallsTransform: false,
    stringArrayEncoding: [],
    stringArrayIndexShift: true,
    stringArrayRotate: true,
    stringArrayShuffle: true,
    stringArrayWrappersCount: 1,
    stringArrayWrappersChainedCalls: true,
    stringArrayWrappersParametersMaxCount: 2,
    stringArrayWrappersType: "variable",
    stringArrayThreshold: 0.5,
    target: "browser",
    transformObjectKeys: false,
    unicodeEscapeSequence: false,
  });
  const obfuscatedCode = obfuscated.getObfuscatedCode();
  console.log(`   Obfuscated: ${jsContent.length} → ${obfuscatedCode.length} chars`);

  // 3. Write output files to DIST
  console.log("\n📦 Writing output files to dist/...");

  writeFileSync(join(DIST, "finalform-loader.js"), obfuscatedCode);
  console.log(`   ✅ dist/finalform-loader.js (${obfuscatedCode.length} bytes)`);

  // Copy CSS to dist as well
  try {
    const cssContent = readFileSync(loaderCssPath, "utf-8");
    writeFileSync(join(DIST, "finalform-loader.css"), cssContent);
    console.log(`   ✅ dist/finalform-loader.css (${cssContent.length} bytes)`);
  } catch (e) {
    console.warn(
      "⚠️  Could not read public/finalform-loader.css. Maybe no CSS was generated?",
    );
  }

  console.log("\n✅ Build & Post-process complete!\n");
}

postProcessLoader().catch(console.error);
