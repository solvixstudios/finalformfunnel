import { readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkgPath = join(__dirname, "..", "package.json");

// Files containing hardcoded LOADER_VERSION that need to be synced
const filesToSync = [
  join(__dirname, "..", "src", "lib", "integrations", "adapters", "shopify.ts")
];

function updateLoaderVersionInFile(filePath, newVersion) {
  try {
    let content = readFileSync(filePath, "utf8");
    // Regex to match: export const LOADER_VERSION = '1.1.0';
    const regex = /(export\s+const\s+LOADER_VERSION\s*=\s*['"])([^'"]+)(['"])/g;

    if (regex.test(content)) {
      content = content.replace(regex, `$1${newVersion}$3`);
      writeFileSync(filePath, content, "utf8");
      console.log(`✅ Synced LOADER_VERSION to ${newVersion} in ${filePath}`);
    } else {
      console.warn(`⚠️ LOADER_VERSION not found in ${filePath}`);
    }
  } catch (err) {
    // Only warn if file doesn't exist, as index.ts might not have it yet
    console.warn(`⚠️ Could not process ${filePath}: ${err.message}`);
  }
}

try {
  const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
  const versionParts = pkg.version.split(".").map(Number);

  // Smart Bump Logic
  if (versionParts[2] < 9) {
    versionParts[2] += 1; // Increment patch
  } else {
    versionParts[2] = 0; // Reset patch
    if (versionParts[1] < 9) {
      versionParts[1] += 1; // Increment minor
    } else {
      versionParts[1] = 0; // Reset minor
      versionParts[0] += 1; // Increment major
    }
  }

  const newVersion = versionParts.join(".");

  pkg.version = newVersion;
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");

  console.log(`🚀 Bumped package.json version to ${newVersion}`);

  // Sync the TS files
  filesToSync.forEach(file => updateLoaderVersionInFile(file, newVersion));

} catch (e) {
  console.error("Failed to bump version", e);
  process.exit(1);
}
