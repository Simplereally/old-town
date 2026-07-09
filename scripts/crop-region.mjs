// One-off visual crop helper: extract a rectangle from the menu sheet so it can
// be Read/inspected at full resolution. Usage: node crop-region.mjs x y w h out.png
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import pkg from "pngjs";

const { PNG } = pkg;
const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const SHEET = resolve(ROOT, "apps/client/public/assets/ui/menu-sheet.png");

const [, , xs, ys, ws, hs, out] = process.argv;
const x = +xs,
  y = +ys,
  w = +ws,
  h = +hs;
const src = PNG.sync.read(readFileSync(SHEET));
const dst = new PNG({ width: w, height: h });
for (let row = 0; row < h; row++) {
  for (let col = 0; col < w; col++) {
    const si = ((y + row) * src.width + (x + col)) * 4;
    const di = (row * w + col) * 4;
    dst.data[di] = src.data[si];
    dst.data[di + 1] = src.data[si + 1];
    dst.data[di + 2] = src.data[si + 2];
    dst.data[di + 3] = src.data[si + 3];
  }
}
writeFileSync(resolve(ROOT, out), PNG.sync.write(dst));
console.log(`wrote ${out} (${w}x${h}) from (${x},${y})`);
