/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Derive web-ready transparent variants from approved masters.
 * Makes near-Velocity-Navy plate pixels transparent without redrawing artwork.
 */
const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const DIR = path.join('public', 'brand', 'velocitymaid');
const NAVY = { r: 15, g: 28, b: 46 };
const TOL = 8;

function nearNavy(r, g, b) {
  return (
    Math.abs(r - NAVY.r) <= TOL &&
    Math.abs(g - NAVY.g) <= TOL &&
    Math.abs(b - NAVY.b) <= TOL
  );
}

function knockOutNavyPlate(srcName, destName) {
  const src = path.join(DIR, srcName);
  const png = PNG.sync.read(fs.readFileSync(src));
  const { data } = png;
  let cleared = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (nearNavy(data[i], data[i + 1], data[i + 2]) && data[i + 3] > 0) {
      data[i + 3] = 0;
      cleared++;
    }
  }
  fs.writeFileSync(path.join(DIR, destName), PNG.sync.write(png));
  console.log(`wrote ${destName} (cleared ${cleared} plate pixels)`);
}

function resizeMark(srcName, destName, size) {
  // nearest-neighbor style box sample for favicon sizes (no sharp)
  const src = PNG.sync.read(fs.readFileSync(path.join(DIR, srcName)));
  const out = new PNG({ width: size, height: size });
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const sx = Math.min(src.width - 1, Math.floor((x + 0.5) * src.width / size));
      const sy = Math.min(src.height - 1, Math.floor((y + 0.5) * src.height / size));
      const si = (src.width * sy + sx) << 2;
      const di = (size * y + x) << 2;
      out.data[di] = src.data[si];
      out.data[di + 1] = src.data[si + 1];
      out.data[di + 2] = src.data[si + 2];
      out.data[di + 3] = src.data[si + 3];
    }
  }
  fs.writeFileSync(path.join(DIR, destName), PNG.sync.write(out));
  console.log(`wrote ${destName} ${size}x${size}`);
}

knockOutNavyPlate('velocitymaid-reversed.png', 'velocitymaid-reversed-clear.png');
knockOutNavyPlate('velocitymaid-onecolor-white.png', 'velocitymaid-onecolor-white-clear.png');
resizeMark('velocitymaid-mark-dark.png', 'favicon-32.png', 32);
resizeMark('velocitymaid-mark-dark.png', 'favicon-180.png', 180);
resizeMark('velocitymaid-mark-dark.png', 'icon-192.png', 192);
resizeMark('velocitymaid-mark-dark.png', 'icon-512.png', 512);

// Copy primary as default logo.png for schema references
fs.copyFileSync(
  path.join(DIR, 'velocitymaid-primary.png'),
  path.join('public', 'logo.png')
);
console.log('wrote public/logo.png from primary');
