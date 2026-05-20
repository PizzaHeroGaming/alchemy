// Copies the web files into www/ for Capacitor to bundle into the
// native Android shell. Keeps the existing root-level layout intact so
// the browser test flow (python -m http.server against the repo root)
// keeps working unchanged.
//
// Usage:
//   npm run build         # just rebuilds www/
//   npm run sync          # build + cap sync (push to android/app/src/main/assets/public)
//   npm run android       # build + sync + open in Android Studio
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT  = path.join(ROOT, 'www');

// Everything the runtime touches. Anything not in this list is left
// out of the APK — node_modules/, android/, scripts/, .git/, etc.
const INCLUDES = [
  'index.html',
  'manifest.json',
  'css',
  'js',
  'data',
  'assets',
];

function rmrf(p) {
  if (!fs.existsSync(p)) return;
  fs.rmSync(p, { recursive: true, force: true });
}

function copyRec(src, dst) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dst, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      copyRec(path.join(src, entry), path.join(dst, entry));
    }
  } else {
    fs.copyFileSync(src, dst);
  }
}

console.log('[build-www] cleaning', OUT);
rmrf(OUT);
fs.mkdirSync(OUT);

for (const item of INCLUDES) {
  const src = path.join(ROOT, item);
  const dst = path.join(OUT, item);
  if (!fs.existsSync(src)) {
    console.warn('[build-www] skipping missing:', item);
    continue;
  }
  console.log('[build-www] copy', item);
  copyRec(src, dst);
}

console.log('[build-www] done -> ' + OUT);
