import { readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkgPath = join(__dirname, "..", "package.json");

// Files containing hardcoded LOADER_VERSION that need to be synced
const filesToSync = [
  join(__dirname, "..", "src", "lib", "integrations", "adapters", "shopify.ts")
];

// WooCommerce plugin files
const wcPluginFile = join(__dirname, "..", "plugins", "finalform-woocommerce", "finalform-woocommerce.php");
const wcInfoJson = join(__dirname, "..", "public", "plugin-info.json");

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

  // Sync WooCommerce plugin
  try {
    let wcContent = readFileSync(wcPluginFile, "utf8");
    // Update Plugin Header Version
    wcContent = wcContent.replace(/(\* Version:\s+)([^\n]+)/, `$1${newVersion}`);
    // Update constant definition
    wcContent = wcContent.replace(/(define\(\s*'FINALFORM_WC_VERSION',\s*')([^']+)('\s*\);)/, `$1${newVersion}$3`);
    writeFileSync(wcPluginFile, wcContent, "utf8");
    console.log(`✅ Synced version to ${newVersion} in finalform-woocommerce.php`);

    // Generate info.json for Plugin Update Checker
    const infoJson = {
      name: "Final Form for WooCommerce",
      version: newVersion,
      slug: "finalform-woocommerce",
      download_url: "https://finalform.app/finalform-woocommerce.zip",
      requires: "5.8",
      tested: "6.4",
      requires_php: "7.4",
      last_updated: new Date().toISOString().replace('T', ' ').substring(0, 19),
      sections: {
        description: "Connect your WooCommerce store to Final Form — the premium order form builder for e-commerce."
      }
    };
    writeFileSync(wcInfoJson, JSON.stringify(infoJson, null, 2) + "\n", "utf8");
    console.log(`✅ Generated ${wcInfoJson}`);

  } catch (err) {
    console.warn(`⚠️ Could not process WooCommerce files: ${err.message}`);
  }

} catch (e) {
  console.error("Failed to bump version", e);
  process.exit(1);
}
