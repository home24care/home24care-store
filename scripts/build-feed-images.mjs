/**
 * Generates the JPEG copies the Google Merchant feed needs.
 *
 *   node scripts/build-feed-images.mjs
 *
 * Merchant Center does not accept WebP. Its documented formats for
 * `image_link` are GIF, JPEG, PNG, BMP and TIFF — WebP is absent, which is why
 * a feed of .webp URLs fails with "Use an image in the accepted format (JPEG,
 * PNG, GIF)". Google Search is happy with WebP; Merchant is not.
 *
 * So the storefront keeps serving WebP, which is what makes it fast, and the
 * feed points at JPEG copies generated here: the main image plus FEED_EXTRA
 * additional ones.
 *
 * FEED_EXTRA is 7 because the richest products carry 8 images and Google
 * accepts 11 (one main plus ten additional), so every image this catalogue
 * has fits with room spare. It was 4 at first, to hold the repository down,
 * which silently dropped 675 images across 226 products — Shopping shows
 * several per listing, so those were worth the ~66 MB.
 *
 * 900px comfortably clears Google's 800x800 recommendation (the hard minimum
 * is 100x100).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const imageDir = path.join(root, 'public/product-images');
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'data/catalog.json'), 'utf8'));

const WIDTH = 900;
const QUALITY = 80;
const CONCURRENCY = 8;

/** Must match FEED_EXTRA in src/app/feeds/google/route.ts. */
export const FEED_EXTRA = 7;

/** `/product-images/abc-full.webp` -> `/product-images/abc-feed.jpg` */
export const feedImagePath = (webpPath) =>
  webpPath.replace(/-(?:thumb|card|full)\.webp$/, '-feed.jpg');

const wanted = new Set();
for (const product of catalog.products) {
  for (const image of product.images.slice(0, 1 + FEED_EXTRA)) {
    if (typeof image.full === 'string' && image.full.startsWith('/product-images/')) {
      wanted.add(image.full);
    }
  }
}

const jobs = [...wanted];
console.log(`${jobs.length} feed images to generate`);

let done = 0;
let made = 0;
let skipped = 0;
const failures = [];
let cursor = 0;

async function worker() {
  while (cursor < jobs.length) {
    const webpUrl = jobs[cursor++];
    const src = path.join(root, 'public', webpUrl);
    const dst = path.join(root, 'public', feedImagePath(webpUrl));

    done++;
    if (fs.existsSync(dst) && fs.statSync(dst).size > 0) {
      skipped++;
      continue;
    }
    if (!fs.existsSync(src)) {
      failures.push(`${webpUrl}: source missing`);
      continue;
    }

    try {
      await sharp(src)
        .resize({ width: WIDTH, withoutEnlargement: true })
        // Flatten onto white: a transparent WebP would otherwise composite to
        // black in JPEG, which has no alpha channel.
        .flatten({ background: '#ffffff' })
        .jpeg({ quality: QUALITY, mozjpeg: true })
        .toFile(dst);
      made++;
    } catch (error) {
      failures.push(`${webpUrl}: ${error.message}`);
    }

    if (done % 200 === 0) console.log(`  ${done}/${jobs.length}`);
  }
}

await Promise.all(Array.from({ length: CONCURRENCY }, worker));

const files = fs.readdirSync(imageDir).filter((f) => f.endsWith('-feed.jpg'));
const bytes = files.reduce((n, f) => n + fs.statSync(path.join(imageDir, f)).size, 0);

console.log(`generated ${made}, already present ${skipped}, failed ${failures.length}`);
for (const f of failures.slice(0, 10)) console.log(`  ${f}`);
console.log(`public/product-images: ${files.length} JPEGs, ${(bytes / 1048576).toFixed(0)} MB`);
