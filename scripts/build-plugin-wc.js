import fs from 'fs';
import path from 'path';
import archiver from 'archiver';

// Read version from package.json
const pkgPath = path.resolve('package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
const version = pkg.version;

// Read VITE_BACKEND_URL from .env
const envPath = path.resolve('.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const backendUrlMatch = envContent.match(/VITE_BACKEND_URL=(.+)/);
const backendUrl = backendUrlMatch ? backendUrlMatch[1].trim() : '';

const appUrlMatch = envContent.match(/VITE_APP_URL=(.+)/);
const appUrl = appUrlMatch ? appUrlMatch[1].trim() : '';

if (!backendUrl) {
  console.error('❌ VITE_BACKEND_URL not found in .env — cannot build plugin.');
  process.exit(1);
}

if (!appUrl) {
  console.error('❌ VITE_APP_URL not found in .env — cannot build plugin.');
  process.exit(1);
}

console.log(`⚡ Backend URL: ${backendUrl}`);
console.log(`⚡ App URL: ${appUrl}`);

const pluginDir = path.resolve('plugins', 'finalform-woocommerce');
const outputFilename = `finalform-woocommerce-${version}.zip`;
const publicOutputPath = path.resolve('public', outputFilename);
const distOutputPath = path.resolve('dist', outputFilename);

// Create a temp directory for the build with injected values
const tmpDir = path.resolve('plugins', '.wc-build-tmp', 'finalform-woocommerce');

console.log(`Building ${outputFilename}...`);

// Clean up
if (fs.existsSync(publicOutputPath)) fs.unlinkSync(publicOutputPath);
if (fs.existsSync(distOutputPath)) fs.unlinkSync(distOutputPath);
if (fs.existsSync(path.resolve('plugins', '.wc-build-tmp'))) {
  fs.rmSync(path.resolve('plugins', '.wc-build-tmp'), { recursive: true });
}

// Copy plugin files to temp dir, replacing placeholders in PHP files
function copyDirWithReplacements(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirWithReplacements(srcPath, destPath);
    } else {
      let content = fs.readFileSync(srcPath);

      // Only do replacements on PHP files
      if (entry.name.endsWith('.php')) {
        let text = content.toString('utf8');
        // Replace the placeholder with the actual backend URL
        text = text.replace(/%%FINALFORM_BACKEND_URL%%/g, backendUrl);
        // Replace the app URL placeholder (used for loader script)
        text = text.replace(/%%FINALFORM_APP_URL%%/g, appUrl);
        fs.writeFileSync(destPath, text, 'utf8');
      } else {
        fs.writeFileSync(destPath, content);
      }
    }
  }
}

copyDirWithReplacements(pluginDir, tmpDir);

// Create the ZIP from the temp directory
const output = fs.createWriteStream(distOutputPath);
const archive = archiver('zip', {
  zlib: { level: 9 }
});

output.on('close', function () {
  console.log('✅ Successfully built ' + outputFilename);
  console.log(archive.pointer() + ' total bytes');
  // Also copy to public so we retain it 
  fs.copyFileSync(distOutputPath, publicOutputPath);
  // Clean up temp dir
  fs.rmSync(path.resolve('plugins', '.wc-build-tmp'), { recursive: true });
});

archive.on('warning', function (err) {
  if (err.code === 'ENOENT') {
    console.warn(err);
  } else {
    throw err;
  }
});

archive.on('error', function (err) {
  throw err;
});

archive.pipe(output);

// Archive from the temp build directory
archive.directory(tmpDir, 'finalform-woocommerce');

archive.finalize();
