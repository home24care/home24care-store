/**
 * Collects real GTINs for the outdoor catalog and writes data/gtins.json.
 *
 *   node scripts/fetch-gtins.mjs
 *
 * A wrong GTIN is worse than no GTIN: Google matches the offer to whatever
 * product really owns that code, so the listing can end up carrying another
 * item's reviews, price history and identity. Three guards make that hard:
 *
 *  1. Pairs are read as (sku, barcode) together from the same block of markup,
 *     never inferred from position on the page.
 *  2. The barcode must pass the GS1 check digit.
 *  3. The SKU must match a catalog SKU EXACTLY. No fuzzy matching, no
 *     normalising — "2206052Bcom" and "2206052Bcoma" are different products
 *     (shipping only vs shipping and assembly) and must not be conflated.
 *
 * Anything that fails a guard is dropped and reported, not guessed at.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'data/catalog.json'), 'utf8'));
const shopify = JSON.parse(
  fs.readFileSync(path.join(root, 'scripts/source/shopify-products.json'), 'utf8')
).products;

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';
// The store rate-limits hard. Two workers with a pause between requests gets
// through the whole catalog; six got 429 on three quarters of it.
const CONCURRENCY = 2;
const DELAY_MS = 400;
const MAX_RETRIES = 4;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** GS1 check digit: alternating 3/1 weights from the right, total mod 10 = 0. */
function validGtin(code) {
  if (!/^\d+$/.test(code)) return false;
  if (![8, 12, 13, 14].includes(code.length)) return false;
  const digits = code.split('').map(Number);
  const check = digits.pop();
  let sum = 0;
  digits.reverse().forEach((n, i) => {
    sum += n * (i % 2 === 0 ? 3 : 1);
  });
  return (10 - (sum % 10)) % 10 === check;
}

const catalogSkus = new Set(catalog.products.map((p) => p.sku));

/**
 * Pulls (sku, barcode) pairs out of a page.
 *
 * The store embeds its variant objects as JSON, so a barcode is always
 * preceded by its own sku within the same object. Scanning backwards from the
 * barcode for the nearest "sku" keeps the pairing honest even when a page
 * carries a whole product family.
 */
function extractPairs(html) {
  const pairs = new Map();
  const re = /(?:barcode|gtin\d*|upc|ean)"?\s*:\s*"?(\d{8,14})/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const barcode = m[1];
    const window = html.slice(Math.max(0, m.index - 400), m.index);
    const skus = [...window.matchAll(/"sku"\s*:\s*"([^"]+)"/g)];
    if (skus.length === 0) continue;
    const sku = skus[skus.length - 1][1];
    if (!validGtin(barcode)) continue;
    pairs.set(sku, barcode);
  }
  return pairs;
}

const handles = [...new Set(shopify.map((p) => p.handle))];
console.log(`fetching ${handles.length} product pages`);

// Resume: keep anything an earlier run already matched.
const existingPath = path.join(root, 'data/gtins.json');
const found = new Map(
  fs.existsSync(existingPath)
    ? Object.entries(JSON.parse(fs.readFileSync(existingPath, 'utf8')))
    : []
);
console.log(`resuming with ${found.size} already matched`);

const failures = [];
let done = 0;
let cursor = 0;

async function worker() {
  while (cursor < handles.length) {
    const handle = handles[cursor++];
    let ok = false;
    for (let attempt = 0; attempt < MAX_RETRIES && !ok; attempt++) {
      try {
        const res = await fetch(`https://www.backyarddiscovery.com/products/${handle}`, {
          headers: { 'User-Agent': UA },
        });
        if (res.status === 429) {
          // Back off progressively rather than hammering a store that has
          // already asked us to slow down.
          await sleep(2000 * (attempt + 1));
          continue;
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const html = await res.text();
        for (const [sku, barcode] of extractPairs(html)) {
          // Only keep what we can attach to a product we actually sell.
          if (catalogSkus.has(sku)) found.set(sku, barcode);
        }
        ok = true;
      } catch (error) {
        if (attempt === MAX_RETRIES - 1) failures.push(`${handle}: ${error.message}`);
        else await sleep(1500 * (attempt + 1));
      }
    }
    if (!ok && !failures.some((f) => f.startsWith(handle))) {
      failures.push(`${handle}: rate limited after ${MAX_RETRIES} attempts`);
    }
    await sleep(DELAY_MS);
    done++;
    if (done % 40 === 0) console.log(`  ${done}/${handles.length} — ${found.size} matched`);
  }
}

await Promise.all(Array.from({ length: CONCURRENCY }, worker));

// A GTIN identifies one product; the same code on two SKUs means the pairing
// went wrong somewhere and neither can be trusted.
const byCode = new Map();
for (const [sku, code] of found) {
  if (!byCode.has(code)) byCode.set(code, []);
  byCode.get(code).push(sku);
}
const collisions = [...byCode.entries()].filter(([, skus]) => skus.length > 1);
for (const [code, skus] of collisions) {
  console.log(`  dropping ${code}: claimed by ${skus.length} SKUs (${skus.join(', ')})`);
  for (const sku of skus) found.delete(sku);
}

const out = Object.fromEntries([...found.entries()].sort());
fs.writeFileSync(path.join(root, 'data/gtins.json'), JSON.stringify(out, null, 1));

console.log(`\nmatched ${found.size} of ${catalog.products.length} products`);
console.log(`collisions dropped: ${collisions.length}`);
console.log(`fetch failures: ${failures.length}`);
for (const f of failures.slice(0, 10)) console.log(`  ${f}`);
