/**
 * Swaps low-resolution product photos for the sharper masters kept in
 * scripts/source/image-masters/.
 *
 *   node scripts/apply-image-masters.mjs
 *
 * Run it after `localize:images` and before `build:feed-images`. A catalogue
 * rebuild resets every image path to the plain `<id>-full.webp` form, and this
 * is what puts the sharper versions back.
 *
 * Several supplier photos top out at 440-900px, which the 620px gallery slot
 * shows visibly soft on any retina screen. Each master is named after the id
 * that `localize-images` gives the original photo, and is one of:
 *   - a sharper photo of the same product, where a clean one could be found, or
 *   - the original, upscaled 4x with Real-ESRGAN and scaled back to 1600px.
 * Upscaling happens offline, because the model is a native binary that cannot
 * run on Vercel. The masters are the result, committed so every build uses
 * them.
 *
 * Output goes to new `<id>-hq-*` filenames, not over the originals.
 * /product-images is served with an immutable cache header, so a changed file
 * behind an old URL would stay stale in browsers for a year. A new name also
 * makes Merchant Center fetch the image again instead of keeping its cached
 * copy.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const masterDir = path.join(root, 'scripts/source/image-masters');
const outDir = path.join(root, 'public/product-images');
const catalogPath = path.join(root, 'data/catalog.json');

/** Same widths and qualities as localize-images, so an hq file is a drop-in. */
const VARIANTS = {
  thumb: { width: 192, quality: 72 },
  card: { width: 640, quality: 74 },
  full: { width: 1100, quality: 76 },
};

const masters = fs
  .readdirSync(masterDir)
  .filter((f) => /^[0-9a-f]{16}\.webp$/.test(f))
  .map((f) => f.slice(0, 16));

let encoded = 0;
for (const id of masters) {
  const src = path.join(masterDir, `${id}.webp`);
  const srcTime = fs.statSync(src).mtimeMs;
  for (const [variant, { width, quality }] of Object.entries(VARIANTS)) {
    const dst = path.join(outDir, `${id}-hq-${variant}.webp`);
    // Re-encode when the master is newer, so replacing a master takes effect.
    if (fs.existsSync(dst) && fs.statSync(dst).mtimeMs >= srcTime) continue;
    await sharp(src)
      .resize({ width, withoutEnlargement: true })
      .webp({ quality, effort: 4 })
      .toFile(dst);
    encoded++;
  }
}

const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
const upgraded = new Set(masters);
let rewritten = 0;
for (const product of catalog.products) {
  for (const image of product.images) {
    for (const key of Object.keys(VARIANTS)) {
      const match = image[key]?.match?.(/^\/product-images\/([0-9a-f]{16})-(thumb|card|full)\.webp$/);
      if (match && upgraded.has(match[1])) {
        image[key] = `/product-images/${match[1]}-hq-${match[2]}.webp`;
        rewritten++;
      }
    }
  }
}
fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 1));

console.log(`${masters.length} masters, ${encoded} variants encoded, ${rewritten} catalog paths repointed`);
