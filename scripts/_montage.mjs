import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import pkg from "pngjs";

const { PNG } = pkg;
const DIR = "apps/client/public/assets/ui/menu";
const names = readdirSync(DIR)
  .filter((f) => f.endsWith(".png"))
  .sort();
const cell = 124,
  cols = 7,
  pad = 6,
  rows = Math.ceil(names.length / cols);
const W = cols * (cell + pad) + pad,
  Hh = rows * (cell + pad + 12) + pad;
const out = new PNG({ width: W, height: Hh });
for (let i = 0; i < out.data.length; i += 4) {
  out.data[i] = 24;
  out.data[i + 1] = 24;
  out.data[i + 2] = 26;
  out.data[i + 3] = 255;
}
names.forEach((n, i) => {
  const im = PNG.sync.read(readFileSync(resolve(DIR, n)));
  const cx = (i % cols) * (cell + pad) + pad,
    cy = Math.floor(i / cols) * (cell + pad + 12) + pad;
  const s = Math.min(1, cell / Math.max(im.width, im.height));
  const dw = Math.round(im.width * s),
    dh = Math.round(im.height * s);
  for (let y = 0; y < dh; y++)
    for (let x = 0; x < dw; x++) {
      const sx = Math.floor(x / s),
        sy = Math.floor(y / s);
      const si = (sy * im.width + sx) * 4,
        di = ((cy + y) * W + (cx + x)) * 4;
      const a = im.data[si + 3] / 255;
      out.data[di] = Math.round(im.data[si] * a + out.data[di] * (1 - a));
      out.data[di + 1] = Math.round(im.data[si + 1] * a + out.data[di + 1] * (1 - a));
      out.data[di + 2] = Math.round(im.data[si + 2] * a + out.data[di + 2] * (1 - a));
    }
});
writeFileSync("/tmp/montage.png", PNG.sync.write(out));
console.log("wrote /tmp/montage.png", W, Hh, "names:", names.join(" "));
