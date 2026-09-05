/**
 * Downloads every product image and pre-encodes it to WebP at the three sizes
 * the storefront actually renders, then rewrites data/catalog.json to point at
 * the local files.
 *
 *   node scripts/localize-images.mjs            # all products
 *   node scripts/localize-images.mjs --limit 30 # sample run, to gauge size
 *
 * Why this matters: while images live on a third-party CDN, every cold request
 * costs a network round-trip *plus* a sharp encode inside next/image. Measured
 * on a 40-image collection page that is ~18s on a cold cache. Pre-encoded local
 * files are served straight off disk with an immutable cache header, so the
 * optimizer never runs at request time.
 *
 * Safe to re-run: existing outputs are skipped.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const outDir = path.join(root, 'public/product-images');
const catalogPath = path.join(root, 'data/catalog.json');

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

const CONCURRENCY = 8;

/** Widths must cover the `sizes` hints in src/lib/image.ts. */
/**
 * Widths chosen against the `sizes` hints in src/lib/image.ts, then benchmarked
 * on 25 real product photos. Each is roughly 2x its largest CSS slot so retina
 * screens stay sharp without paying for pixels nobody sees:
 *   thumb  84px rail  -> 192px   (~6 KB)
 *   card  320px slot  -> 640px   (~40 KB)
 *   full  620px slot  -> 1100px  (~89 KB)
 */
const VARIANTS = {
  thumb: { width: 192, quality: 72 },
  card: { width: 640, quality: 74 },
  full: { width: 1100, quality: 76 },
};

const args = process.argv.slice(2);
const limitFlag = args.indexOf('--limit');
const LIMIT = limitFlag !== -1 ? parseInt(args[limitFlag + 1], 10) : Infinity;

fs.mkdirSync(outDir, { recursive: true });
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

/**
 * Shopify serves the same asset at many widths via a `_800x` filename token.
 * Strip it so all three variants of one photo resolve to a single download.
 */
const sourceKey = (url) =>
  url.split('?')[0].replace(/_\d+x(\.[a-z]{3,4})$/i, '$1');

const idFor = (url) =>
  crypto.createHash('sha1').update(sourceKey(url)).digest('hex').slice(0, 16);

/** Highest-resolution URL we know of for a given source asset. */
const bestSourceUrl = (image) => image.full || image.card || image.thumb;

// ---- Collect the work: one entry per distinct source asset ---------------
const assets = new Map(); // id -> { url, variants:Set }
const products = catalog.products.slice(0, LIMIT);

for (const product of products) {
  for (const image of product.images) {
    const url = bestSourceUrl(image);
    if (typeof url !== 'string' || !url.startsWith('http')) continue;
    const id = idFor(url);
    if (!assets.has(id)) assets.set(id, { url, variants: new Set() });
    for (const key of ['thumb', 'card', 'full']) {
      if (typeof image[key] === 'string' && image[key].startsWith('http')) {
        assets.get(id).variants.add(key);
      }
    }
  }
}

const list = [...assets.entries()];
console.log(
  `${list.length} distinct source images -> up to ${list.length * 3} WebP files`
);

let done = 0;
let downloaded = 0;
let skipped = 0;
const failures = [];
const undersized = [];

async function processAsset([id, { url, variants }]) {
  const targets = [...variants].filter(
    (v) => !fs.existsSync(path.join(outDir, `${id}-${v}.webp`))
  );
  if (targets.length === 0) {
    skipped++;
    return;
  }

  let buf;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    buf = Buffer.from(await res.arrayBuffer());
    if (buf.length === 0) throw new Error('empty response');
    downloaded++;
  } catch (error) {
    failures.push(`${url} — ${error.message}`);
    return;
  }

  for (const variant of targets) {
    const { width, quality } = VARIANTS[variant];
    try {
      const info = await sharp(buf)
        // `withoutEnlargement` keeps a small source from being upscaled into
        // a needlessly large file — but it can also silently emit a variant
        // far below the target, so anything well short of it is reported.
        .resize({ width, withoutEnlargement: true })
        .webp({ quality, effort: 4 })
        .toFile(path.join(outDir, `${id}-${variant}.webp`));

      if (info.width < width * 0.75) {
        undersized.push(`${id}-${variant}.webp is ${info.width}px (wanted ${width}px) — ${url}`);
      }
    } catch (error) {
      failures.push(`${url} [${variant}] — ${error.message}`);
    }
  }
}

let cursor = 0;
async function worker() {
  while (cursor < list.length) {
    const entry = list[cursor++];
    await processAsset(entry);
    done++;
    if (done % 100 === 0) {
      console.log(`  ${done}/${list.length} (${downloaded} fetched, ${skipped} cached)`);
    }
  }
}

await Promise.all(Array.from({ length: CONCURRENCY }, worker));

console.log(`processed ${done}, fetched ${downloaded}, already cached ${skipped}`);
if (failures.length) {
  console.log(`failures: ${failures.length}`);
  for (const f of failures.slice(0, 20)) console.log(`  ${f}`);
}

// ---- Rewrite the catalog, but only where the file really exists ----------
let rewritten = 0;
let stillRemote = 0;

for (const product of catalog.products) {
  for (const image of product.images) {
    const url = bestSourceUrl(image);
    if (typeof url !== 'string' || !url.startsWith('http')) continue;
    const id = idFor(url);
    for (const key of ['thumb', 'card', 'full']) {
      if (typeof image[key] !== 'string' || !image[key].startsWith('http')) continue;
      if (fs.existsSync(path.join(outDir, `${id}-${key}.webp`))) {
        image[key] = `/product-images/${id}-${key}.webp`;
        rewritten++;
      } else {
        stillRemote++;
      }
    }
  }
}

// Verify every path in the catalog actually resolves on disk before claiming
// the catalog is localized. `stillRemote === 0` alone is not enough: it only
// counts paths that are *currently* remote, and after one successful run no
// path is, so a no-op re-run would re-affirm localized:true even if the files
// had been deleted.
let missingOnDisk = 0;
for (const product of catalog.products) {
  for (const image of product.images) {
    for (const key of ['thumb', 'card', 'full']) {
      const value = image[key];
      if (typeof value !== 'string' || value.startsWith('http')) continue;
      if (!fs.existsSync(path.join(root, 'public', value))) missingOnDisk++;
    }
  }
}

catalog.localized = stillRemote === 0 && missingOnDisk === 0;

fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 1));

const bytes = fs
  .readdirSync(outDir)
  .reduce((n, f) => n + fs.statSync(path.join(outDir, f)).size, 0);

console.log(`rewrote ${rewritten} paths, ${stillRemote} still remote, ${missingOnDisk} missing on disk`);
console.log(`public/product-images: ${fs.readdirSync(outDir).length} files, ${(bytes / 1024 / 1024).toFixed(1)} MB`);
if (undersized.length) {
  console.log(`\n${undersized.length} variant(s) smaller than target (source was low-res):`);
  for (const u of undersized.slice(0, 10)) console.log(`  ${u}`);
}

console.log(`catalog.localized = ${catalog.localized}`);
console.log('Rebuild to pick up the local images.');
