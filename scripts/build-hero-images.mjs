/**
 * Generates wide `-hero.webp` variants for the handful of images rendered
 * full-bleed at 100vw.
 *
 * The standard `full` variant is 1100px, sized for the 620px product-gallery
 * slot. Pointing a 100vw hero at it upscales roughly 1.3x on a 1440px display
 * and 2.3x on a 2560px one. These are re-encoded from the original CDN sources
 * in scripts/source/, which are 2500px square.
 *
 *   node scripts/build-hero-images.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const outDir = path.join(root, 'public/product-images');

/** Slugs used as full-bleed art. Keep in sync with the pages that use them. */
const HERO_SLUGS = [
  'bristol-point-wooden-swing-set',
  'lennon-2-4-person-outdoor-cube-sauna',
  'bellerose-greenhouse',
];

const WIDTH = 1920;
// The hero renders as a wide band and `object-cover` throws the rest away, so
// crop to that shape here rather than shipping a 1920x1920 square and letting
// the browser discard half the bytes.
const HEIGHT = 1000;
const QUALITY = 70;
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

const shopify = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'source/shopify-products.json'), 'utf8')
).products;

const sourceKey = (url) => url.split('?')[0].replace(/_\d+x(\.[a-z]{3,4})$/i, '$1');
const idFor = (url) => crypto.createHash('sha1').update(sourceKey(url)).digest('hex').slice(0, 16);

for (const slug of HERO_SLUGS) {
  const product = shopify.find((p) => p.handle === slug);
  if (!product?.images?.length) {
    console.log(`  SKIP ${slug} — not found in the source export`);
    continue;
  }

  // Match the id the localize script derived, so the hero variant sits beside
  // its thumb/card/full siblings.
  const src = product.images[0].src;
  const base = src.split('?')[0];
  const withSize = base.replace(/(\.[a-z]{3,4})$/i, '_1600x$1');
  const id = idFor(withSize);
  const out = path.join(outDir, `${id}-hero.webp`);

  if (fs.existsSync(out)) {
    console.log(`  cached ${slug} -> ${id}-hero.webp`);
    continue;
  }

  const res = await fetch(src, { headers: { 'User-Agent': UA } });
  if (!res.ok) {
    console.log(`  FAIL ${slug} — HTTP ${res.status}`);
    continue;
  }
  const buf = Buffer.from(await res.arrayBuffer());
  const info = await sharp(buf)
    .resize({ width: WIDTH, height: HEIGHT, fit: 'cover', position: 'attention', withoutEnlargement: true })
    .webp({ quality: QUALITY, effort: 4 })
    .toFile(out);

  console.log(
    `  ${slug} -> ${id}-hero.webp  ${info.width}x${info.height}  ${(info.size / 1024).toFixed(0)} KB`
  );
}
