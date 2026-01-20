import { readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkgPath = join(__dirname, "..", "package.json");

try {
  const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
  const versionParts = pkg.version.split(".").map(Number);
  // Bump patch
  versionParts[2] += 1;
  const newVersion = versionParts.join(".");

  pkg.version = newVersion;
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");

  console.log(`🚀 Bumped version to ${newVersion}`);
} catch (e) {
  console.error("Failed to bump version", e);
  process.exit(1);
}
