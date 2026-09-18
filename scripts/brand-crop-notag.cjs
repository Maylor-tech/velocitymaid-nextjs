/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Crop approved horizontal masters to wordmark+swoosh (no tagline) for nav use.
 */
const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const DIR = path.join('public', 'brand', 'velocitymaid');

function cropTop(srcName, destName, keepRatio = 0.72) {
  const src = PNG.sync.read(fs.readFileSync(path.join(DIR, srcName)));
  const newH = Math.max(1, Math.floor(src.height * keepRatio));
  const out = new PNG({ width: src.width, height: newH });
  for (let y = 0; y < newH; y++) {
    for (let x = 0; x < src.width; x++) {
      const si = (src.width * y + x) << 2;
      const di = (src.width * y + x) << 2;
      out.data[di] = src.data[si];
      out.data[di + 1] = src.data[si + 1];
      out.data[di + 2] = src.data[si + 2];
      out.data[di + 3] = src.data[si + 3];
    }
  }
  fs.writeFileSync(path.join(DIR, destName), PNG.sync.write(out));
  console.log(`wrote ${destName} ${src.width}x${newH}`);
}

cropTop('velocitymaid-primary.png', 'velocitymaid-primary-notag.png', 0.70);
cropTop('velocitymaid-reversed-clear.png', 'velocitymaid-reversed-notag.png', 0.70);
cropTop('velocitymaid-onecolor-navy.png', 'velocitymaid-onecolor-navy-notag.png', 0.70);
cropTop('velocitymaid-onecolor-white-clear.png', 'velocitymaid-onecolor-white-notag.png', 0.70);
