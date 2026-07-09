// Deconstruct the menu sprite sheet into named sprite PNGs + a manifest.
//
// The sheet (apps/client/public/assets/ui/menu-sheet.png) is an OSRS-style UI
// kit: 7 top tab icons, the stone window 9-slice frame + pillars, 7 bottom
// buttons, item icons, slot/panel backgrounds, and number/quantity glyphs.
//
// Sprite coordinates were locked from a connected-components probe
// (`--probe`) cross-checked against the full-resolution sheet. Clean isolated
// sprites use exact boxes; frame chrome uses a generous window that we trim to
// the tight foreground bounding box. Run: `node scripts/slice-menu-sheet.mjs`.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import pkg from "pngjs";

const { PNG } = pkg;
const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const SHEET = resolve(ROOT, "apps/client/public/assets/ui/menu-sheet.png");
const OUT_DIR = resolve(ROOT, "apps/client/public/assets/ui/menu");

const png = PNG.sync.read(readFileSync(SHEET));
const { width: W, height: H, data } = png;
const idx = (x, y) => (y * W + x) * 4;
const bg = [data[0], data[1], data[2]];
const isFg = (x, y) => {
  const i = idx(x, y);
  if (data[i + 3] < 24) return false;
  const d = Math.max(
    Math.abs(data[i] - bg[0]),
    Math.abs(data[i + 1] - bg[1]),
    Math.abs(data[i + 2] - bg[2]),
  );
  return d > 38;
};

// Tight foreground bounding box within a window (for frame chrome pieces).
function trim(wx, wy, ww, wh, pad = 1) {
  let minX = wx + ww,
    maxX = wx,
    minY = wy + wh,
    maxY = wy;
  for (let y = wy; y < wy + wh; y++) {
    for (let x = wx; x < wx + ww; x++) {
      if (!isFg(x, y)) continue;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  if (maxX < minX) return { x: wx, y: wy, w: ww, h: wh };
  return {
    x: Math.max(0, minX - pad),
    y: Math.max(0, minY - pad),
    w: Math.min(W - 1, maxX + pad) - Math.max(0, minX - pad) + 1,
    h: Math.min(H - 1, maxY + pad) - Math.max(0, minY - pad) + 1,
  };
}

function crop({ x, y, w, h }) {
  const out = new PNG({ width: w, height: h });
  for (let row = 0; row < h; row++) {
    for (let col = 0; col < w; col++) {
      const si = ((y + row) * W + (x + col)) * 4;
      const di = (row * w + col) * 4;
      out.data[di] = data[si];
      out.data[di + 1] = data[si + 1];
      out.data[di + 2] = data[si + 2];
      out.data[di + 3] = data[si + 3];
    }
  }
  return out;
}

// name -> exact box {x,y,w,h} OR window {win:[x,y,w,h], pad?} to auto-trim.
const SPRITES = {
  // top tab icons (left -> right)
  "tab-combat": { x: 32, y: 54, w: 113, h: 108 },
  "tab-skills": { x: 153, y: 53, w: 112, h: 109 },
  "tab-quests": { x: 272, y: 54, w: 113, h: 108 },
  "tab-inventory": { x: 392, y: 54, w: 111, h: 108 },
  "tab-equipment": { x: 511, y: 53, w: 112, h: 108 },
  "tab-prayer": { x: 629, y: 53, w: 113, h: 109 },
  "tab-magic": { x: 750, y: 53, w: 115, h: 109 },
  // bottom buttons (left -> right)
  "btn-clan": { x: 31, y: 914, w: 113, h: 109 },
  "btn-friends": { x: 151, y: 914, w: 112, h: 109 },
  "btn-account": { x: 270, y: 914, w: 113, h: 108 },
  "btn-logout": { x: 390, y: 914, w: 113, h: 102 },
  "btn-settings": { x: 510, y: 914, w: 112, h: 108 },
  "btn-emotes": { x: 629, y: 914, w: 112, h: 109 },
  "btn-music": { x: 750, y: 914, w: 113, h: 109 },
  // inventory slot backgrounds
  slot: { x: 911, y: 739, w: 114, h: 110 },
  "slot-selected": { x: 1063, y: 738, w: 116, h: 112 },
  "slot-alt": { x: 1249, y: 738, w: 115, h: 111 },
  // window chrome (trimmed from windows)
  "pillar-left": { win: [28, 238, 88, 600] },
  "pillar-right": { win: [758, 238, 88, 600] },
  "frame-top": { win: [254, 228, 378, 62] },
  "frame-bottom": { win: [250, 752, 392, 80] },
  "frame-corner-tl": { win: [150, 228, 96, 96] },
  "frame-corner-tr": { win: [626, 232, 104, 96] },
  "frame-corner-bl": { win: [150, 636, 100, 104] },
  "frame-corner-br": { win: [624, 636, 104, 104] },
  panel: { x: 300, y: 420, w: 80, h: 80 },
};

mkdirSync(OUT_DIR, { recursive: true });
const manifest = { sheet: "menu-sheet.png", bg: `rgb(${bg.join(",")})`, sprites: {} };
for (const [name, def] of Object.entries(SPRITES)) {
  const box = def.win ? trim(def.win[0], def.win[1], def.win[2], def.win[3], def.pad ?? 1) : def;
  writeFileSync(resolve(OUT_DIR, `${name}.png`), PNG.sync.write(crop(box)));
  manifest.sprites[name] = { w: box.w, h: box.h };
}

// Sample representative colors for CSS fallbacks.
const sample = (x, y) => `rgb(${data[idx(x, y)]},${data[idx(x, y) + 1]},${data[idx(x, y) + 2]})`;
manifest.colors = {
  panel: sample(340, 460), // brown center panel
  stone: sample(70, 500), // pillar stone
  stoneDark: sample(46, 760),
};

writeFileSync(resolve(OUT_DIR, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`sliced ${Object.keys(SPRITES).length} sprites -> ${OUT_DIR}`);
console.log("colors:", manifest.colors);
