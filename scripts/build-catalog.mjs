/**
 * Builds data/catalog.json from the raw source exports in scripts/source/.
 * Re-run with: node scripts/build-catalog.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const shopify = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'source/shopify-products.json'), 'utf8')
).products;
const gas = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'source/gas-products.json'), 'utf8')
);

/* ------------------------------------------------------------------ utils */

const NAMED_ENTITIES = {
  nbsp: ' ',
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  reg: '®',
  trade: '™',
  deg: '°',
  hellip: '…',
  mdash: '—',
  ndash: '–',
  rsquo: '\u2019',
  lsquo: '\u2018',
  ldquo: '\u201c',
  rdquo: '\u201d',
  times: '\u00d7',
};

/**
 * Decodes HTML entities. Numeric forms are handled generically because the
 * source exports mix `&amp;`, `&#038;` and `&#x26;` for the same character.
 * Runs repeatedly so double-encoded values (`&amp;#038;`) fully resolve.
 */
const decode = (input) => {
  let s = input == null ? '' : String(input);
  for (let pass = 0; pass < 3; pass++) {
    const before = s;
    s = s
      .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
      .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
      .replace(/&([a-z]+);/gi, (match, name) => {
        const value = NAMED_ENTITIES[name.toLowerCase()];
        return value === undefined ? match : value;
      });
    if (s === before) break;
  }
  return s;
};

const stripTags = (input) => {
  const html = input == null ? '' : String(input);
  return decode(
    html
      .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
      .replace(/<\/(p|div|li|h[1-6]|tr|br)>/gi, '\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
  )
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .join('\n')
    .trim();
};

const slugify = (s) =>
  decode(s)
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90);

/** Ask the Shopify CDN for a given render width (keeps payloads small). */
const shopifyImage = (src, width) => {
  if (!src) return src;
  const [base, query] = src.split('?');
  const resized = base.replace(/(\.[a-z]{3,4})$/i, `_${width}x$1`);
  return query ? `${resized}?${query}` : resized;
};

/* ------------------------------------------------- category configuration */

// Maps a raw source product_type onto a storefront collection.
const OUTDOOR_COLLECTIONS = {
  'Swing Sets': 'swing-sets',
  Playhouses: 'playhouses',
  Slides: 'slides',
  Gazebos: 'gazebos',
  Pergolas: 'pergolas',
  'Outdoor Kitchens': 'outdoor-kitchens',
  Grills: 'outdoor-kitchens',
  Saunas: 'saunas',
  Greenhouses: 'greenhouses',
  'Car Ports': 'carports',
  'Patio Accents': 'patio-accents',
  'Finished Goods': 'patio-accents',
  Animals: 'playhouses',
  Pets: 'patio-accents',
};

const GAS_COLLECTIONS = {
  'HVAC Refrigerants': 'hvac-refrigerants',
  'Commercial Refrigerants': 'commercial-refrigerants',
  'Specialty Refrigerants': 'specialty-refrigerants',
  'Legacy Refrigerants': 'legacy-refrigerants',
  'Bulk Pallets': 'bulk-pallets',
};

export const COLLECTIONS = [
  // --- Outdoor Living -----------------------------------------------------
  {
    slug: 'swing-sets',
    title: 'Swing Sets',
    group: 'Outdoor Living',
    tagline: 'Backyard playsets built to outlast childhood.',
    googleCategory: 'Toys & Games > Outdoor Play Equipment > Swing Sets & Playsets',
  },
  {
    slug: 'playhouses',
    title: 'Playhouses',
    group: 'Outdoor Living',
    tagline: 'Cedar cottages and clubhouses for imaginative play.',
    googleCategory: 'Toys & Games > Outdoor Play Equipment > Playhouses',
  },
  {
    slug: 'slides',
    title: 'Slides & Play Accessories',
    group: 'Outdoor Living',
    tagline: 'Add-on slides, swings and hardware.',
    googleCategory: 'Toys & Games > Outdoor Play Equipment > Swing Set & Playset Accessories',
  },
  {
    slug: 'gazebos',
    title: 'Gazebos',
    group: 'Outdoor Living',
    tagline: 'All-season shade structures with real roofs.',
    googleCategory:
      'Home & Garden > Lawn & Garden > Outdoor Living > Outdoor Structures > Canopies & Gazebos',
  },
  {
    slug: 'pergolas',
    title: 'Pergolas',
    group: 'Outdoor Living',
    tagline: 'Louvered, cantilever and traditional pergolas.',
    googleCategory:
      'Home & Garden > Lawn & Garden > Outdoor Living > Outdoor Structures > Garden Arches, Trellises, Arbors & Pergolas',
  },
  {
    slug: 'outdoor-kitchens',
    title: 'Outdoor Kitchens & Grills',
    group: 'Outdoor Living',
    tagline: 'Modular cabinetry, islands and grill stations.',
    googleCategory: 'Home & Garden > Kitchen & Dining > Kitchen Appliances > Outdoor Grills',
  },
  {
    slug: 'saunas',
    title: 'Saunas',
    group: 'Outdoor Living',
    tagline: 'Barrel, cube and cabin saunas for the backyard.',
    googleCategory: 'Home & Garden > Pool & Spa > Saunas',
  },
  {
    slug: 'greenhouses',
    title: 'Greenhouses',
    group: 'Outdoor Living',
    tagline: 'Grow a longer season with a hardened frame.',
    googleCategory: 'Home & Garden > Lawn & Garden > Gardening > Greenhouses',
  },
  {
    slug: 'carports',
    title: 'Carports & Shelters',
    group: 'Outdoor Living',
    tagline: 'Steel shelters for vehicles and equipment.',
    googleCategory: 'Home & Garden > Lawn & Garden > Outdoor Living > Outdoor Structures',
  },
  {
    slug: 'patio-accents',
    title: 'Patio Accents',
    group: 'Outdoor Living',
    tagline: 'Finishing pieces for the space you just built.',
    googleCategory: 'Home & Garden > Lawn & Garden > Outdoor Living',
  },
  // --- Refrigerants & Gases ----------------------------------------------
  {
    slug: 'hvac-refrigerants',
    title: 'HVAC Refrigerants',
    group: 'Refrigerants & Gases',
    tagline: 'R-410A and residential system charges.',
    googleCategory: 'Hardware > Heating, Ventilation & Air Conditioning',
  },
  {
    slug: 'commercial-refrigerants',
    title: 'Commercial Refrigerants',
    group: 'Refrigerants & Gases',
    tagline: 'R-404A, R-448A and R-449A for commercial racks.',
    googleCategory: 'Hardware > Heating, Ventilation & Air Conditioning',
  },
  {
    slug: 'specialty-refrigerants',
    title: 'Specialty Refrigerants',
    group: 'Refrigerants & Gases',
    tagline: 'R-1234yf, R-32 and low-GWP blends.',
    googleCategory: 'Hardware > Heating, Ventilation & Air Conditioning',
  },
  {
    slug: 'legacy-refrigerants',
    title: 'Legacy Refrigerants',
    group: 'Refrigerants & Gases',
    tagline: 'R-22, R-134a and drop-in replacements.',
    googleCategory: 'Hardware > Heating, Ventilation & Air Conditioning',
  },
  {
    slug: 'bulk-pallets',
    title: 'Bulk & Pallet Orders',
    group: 'Refrigerants & Gases',
    tagline: 'Full, half and quarter pallets with freight included.',
    googleCategory: 'Hardware > Heating, Ventilation & Air Conditioning',
  },
];

const COLLECTION_BY_SLUG = new Map(COLLECTIONS.map((c) => [c.slug, c]));

/* --------------------------------------------------------- normalisation */

const products = [];
const seenSlugs = new Set();

const uniqueSlug = (base) => {
  let slug = base || 'product';
  let n = 2;
  while (seenSlugs.has(slug)) slug = `${base}-${n++}`;
  seenSlugs.add(slug);
  return slug;
};

// ---- Outdoor living products (Shopify export) ----------------------------
for (const p of shopify) {
  const collectionSlug = OUTDOOR_COLLECTIONS[p.product_type];
  if (!collectionSlug) continue;

  const variant = p.variants?.[0];
  if (!variant) continue;

  const price = Math.round(parseFloat(variant.price) * 100);
  if (!Number.isFinite(price) || price <= 0) continue;

  const compareAt = variant.compare_at_price
    ? Math.round(parseFloat(variant.compare_at_price) * 100)
    : null;

  const images = (p.images || [])
    .slice(0, 8)
    .map((img) => ({
      thumb: shopifyImage(img.src, 600),
      card: shopifyImage(img.src, 900),
      full: shopifyImage(img.src, 1600),
      alt: decode(img.alt || p.title),
      width: img.width,
      height: img.height,
    }));
  if (!images.length) continue;

  const body = stripTags(p.body_html);
  const tags = (p.tags || []).map((t) => t.toLowerCase());

  products.push({
    id: `bd-${p.id}`,
    slug: uniqueSlug(p.handle || slugify(p.title)),
    title: decode(p.title),
    brand: decode(p.vendor) || 'Backyard Discovery',
    collection: collectionSlug,
    productType: p.product_type,
    sku: variant.sku || `H24-${p.id}`,
    price,
    compareAtPrice: compareAt && compareAt > price ? compareAt : null,
    currency: 'USD',
    available: Boolean(variant.available),
    preorder: tags.includes('pre-order'),
    description: body,
    excerpt: body.split('\n')[0]?.slice(0, 220) || '',
    images,
    highlights: [],
    badges: [
      tags.includes('best seller') ? 'Best Seller' : null,
      tags.includes('new arrival') || tags.some((t) => t.includes('label-new arrival'))
        ? 'New Arrival'
        : null,
      tags.some((t) => t.includes('top seller')) ? 'Top Seller' : null,
    ].filter(Boolean),
    shippingIncluded: /shipping included/i.test(variant.title || ''),
    requiresShipping: variant.requires_shipping !== false,
    weightGrams: variant.grams || 0,
    source: 'outdoor',
  });
}

/**
 * Merchant Center matches offers on brand, so prefer the real manufacturer
 * named in the title over a generic store brand. Falls back to the retailer
 * name only when no manufacturer is identifiable.
 */
const GAS_BRANDS = ['Honeywell', 'Chemours', 'Arkema', 'DuPont', 'Solstice', 'National Refrigerants'];

const gasBrand = (p) => {
  const declared = decode(p.brands?.[0]?.name || '');
  if (declared) return declared;
  const haystack = decode(`${p.name} ${p.short_description || ''}`);
  const found = GAS_BRANDS.find((b) => new RegExp(`\\b${b}\\b`, 'i').test(haystack));
  // Solstice is a Honeywell product line, not a standalone brand.
  if (found === 'Solstice') return 'Honeywell';
  return found || 'Home24Care';
};

// ---- Refrigerant / gas products (WooCommerce Store API export) -----------
for (const p of gas) {
  const catName = p.categories?.[0]?.name;
  const collectionSlug = GAS_COLLECTIONS[catName] || 'specialty-refrigerants';

  const price = parseInt(p.prices?.price ?? '0', 10);
  if (!Number.isFinite(price) || price <= 0) continue;

  const regular = parseInt(p.prices?.regular_price ?? '0', 10);

  const images = (p.images || []).slice(0, 8).map((img) => {
    const src = typeof img === 'string' ? img : img.src;
    return {
      thumb: src,
      card: src,
      full: src,
      alt: decode((typeof img === 'object' && img.alt) || p.name),
      width: null,
      height: null,
    };
  });
  if (!images.length) continue;

  const body = stripTags(p.description || p.short_description);

  products.push({
    id: `gas-${p.id}`,
    slug: uniqueSlug(p.slug || slugify(p.name)),
    title: decode(p.name),
    brand: gasBrand(p),
    collection: collectionSlug,
    productType: catName || 'Refrigerants',
    sku: p.sku || `H24-GAS-${p.id}`,
    price,
    compareAtPrice: regular > price ? regular : null,
    currency: 'USD',
    available: p.is_in_stock !== false,
    preorder: false,
    description: body,
    excerpt: stripTags(p.short_description).split('\n')[0]?.slice(0, 220) || body.slice(0, 220),
    images,
    highlights: (p.attributes || [])
      .flatMap((a) => (a.terms || []).map((t) => `${a.name}: ${decode(t.name)}`))
      .slice(0, 6),
    badges: [],
    shippingIncluded: true,
    requiresShipping: true,
    weightGrams: p.weight ? Math.round(parseFloat(p.weight) * 453.592) : 0,
    // Refrigerants are regulated: flag them so the storefront and the
    // Merchant feed can attach the right compliance copy.
    regulated: true,
    source: 'gas',
  });
}

/* ------------------------------------------------------------- enrichment */

// Pull a few scannable spec bullets out of the long description.
for (const p of products) {
  if (p.highlights.length) continue;
  const lines = p.description
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 25 && l.length < 160 && !/^[A-Z\s]{10,}$/.test(l));
  p.highlights = lines.slice(1, 5);
}

products.sort((a, b) => a.title.localeCompare(b.title));

/* -------------------------------------------------------- price overrides */

/**
 * Corrections for prices the upstream source publishes wrongly.
 *
 * Keyed by SKU in data/price-overrides.json. Applied here rather than edited
 * into data/catalog.json, because the catalogue is regenerated from source and
 * a direct edit would be silently reverted on the next build.
 *
 * Every entry has to carry a `reason`, so a year from now it is clear why this
 * store disagrees with its supplier about a price. An override that names a
 * SKU which no longer exists is an error, not a no-op: it means the catalogue
 * moved and the correction is now unattached.
 */
const overridePath = path.join(root, 'data/price-overrides.json');
const overrides = fs.existsSync(overridePath)
  ? JSON.parse(fs.readFileSync(overridePath, 'utf8'))
  : {};

const bySku = new Map(products.map((p) => [p.sku, p]));
const overrideApplied = [];

for (const [sku, entry] of Object.entries(overrides)) {
  const product = bySku.get(sku);
  if (!product) {
    throw new Error(
      `price override for SKU "${sku}" matches no product — the catalogue changed, so re-check the correction`
    );
  }
  if (typeof entry.priceUsd !== 'number' || !(entry.priceUsd > 0)) {
    throw new Error(`price override for "${sku}" has no positive priceUsd`);
  }
  if (!entry.reason) {
    throw new Error(`price override for "${sku}" has no reason`);
  }

  overrideApplied.push({
    sku,
    title: product.title,
    from: product.price / 100,
    to: entry.priceUsd,
  });

  product.price = Math.round(entry.priceUsd * 100);
  // The source's compare-at was derived from the wrong price, so it cannot be
  // carried over — a sale price above the list price is an instant disapproval.
  product.compareAtPrice = null;
  product.priceOverridden = true;
}

/* ----------------------------------------------------------- price policy */

/**
 * Store-wide markdown.
 *
 * PRICE_MULTIPLIER is what every price is multiplied by, so 0.40 is "60% off".
 * Set it to 1 to sell at the imported prices again — that is the whole revert.
 *
 * DISCOUNT_EXEMPT_GROUPS are collection groups the markdown does not touch.
 * Refrigerant is a regulated commodity bought against a supplier invoice, and
 * its margin does not survive a cut like this, so it stays at list.
 *
 * compareAtPrice is scaled by the same factor rather than left at the imported
 * figure. Leaving it would advertise a saving against a price this shop has
 * never charged, which is exactly what Google means by an inflated reference
 * price; scaling both keeps each product's stated discount the one it already
 * had. If the intent is instead to advertise the markdown itself, stop scaling
 * compareAtPrice here — but the "was" price then has to be one that was really
 * charged for long enough to count.
 */
const PRICE_MULTIPLIER = 0.40;
const DISCOUNT_EXEMPT_GROUPS = new Set(['Refrigerants & Gases']);

const groupOfCollection = new Map(COLLECTIONS.map((c) => [c.slug, c.group]));
const marked = [];

if (PRICE_MULTIPLIER !== 1) {
  for (const product of products) {
    const group = groupOfCollection.get(product.collection);
    if (DISCOUNT_EXEMPT_GROUPS.has(group)) continue;

    const before = product.price;
    product.price = Math.round(product.price * PRICE_MULTIPLIER);
    if (product.compareAtPrice) {
      product.compareAtPrice = Math.round(product.compareAtPrice * PRICE_MULTIPLIER);
      // A rounded sale price must still sit below its rounded list price, or
      // the item is disapproved for a sale price above the list price.
      if (product.compareAtPrice <= product.price) product.compareAtPrice = null;
    }
    // A price of zero reads as "free" to Shopping and breaks checkout.
    if (product.price < 1) product.price = 1;
    marked.push({ sku: product.sku, from: before / 100, to: product.price / 100 });
  }
}

/* ------------------------------------------------------------ price audit */

// Single cylinders priced like pallets are almost always a data-entry error
// upstream. We keep the source price but surface it for review — unless an
// override has already corrected it.
const priceReview = products
  .filter((p) => p.source === 'gas')
  .filter((p) => !p.priceOverridden)
  .filter((p) => p.price > 300000 && !/pallet|bulk pack|quarter pallet/i.test(p.title))
  .map((p) => ({ slug: p.slug, title: p.title, price: p.price / 100 }));

/* --------------------------------------------------------------- write it */

const used = new Set(products.map((p) => p.collection));
const collections = COLLECTIONS.filter((c) => used.has(c.slug)).map((c) => ({
  ...c,
  count: products.filter((p) => p.collection === c.slug).length,
}));

fs.mkdirSync(path.join(root, 'data'), { recursive: true });
fs.writeFileSync(
  path.join(root, 'data/catalog.json'),
  JSON.stringify({ collections, products }, null, 1)
);

if (priceReview.length) {
  const md = [
    '# Price review',
    '',
    'Prices were imported exactly as published on the source sites. These',
    'refrigerant listings are priced like pallet quantities despite being sold',
    'as single cylinders, which usually means a decimal-point error upstream.',
    'Google Merchant Center flags price/value mismatches, so confirm each one',
    'before submitting the feed.',
    '',
    '| Product | Imported price |',
    '| --- | ---: |',
    ...priceReview.map((r) => `| ${r.title} | $${r.price.toLocaleString('en-US')} |`),
    '',
  ].join('\n');
  fs.writeFileSync(path.join(root, 'PRICE-REVIEW.md'), md);
}

console.log(`products:    ${products.length}`);
console.log(`collections: ${collections.length}`);
for (const c of collections) console.log(`  ${String(c.count).padStart(3)}  ${c.slug}`);
if (overrideApplied.length) {
  console.log(`price overrides applied: ${overrideApplied.length}`);
  for (const o of overrideApplied) {
    console.log(
      `  ${o.sku.padEnd(14)} $${o.from.toLocaleString('en-US')} -> $${o.to.toLocaleString('en-US')}  ${o.title.slice(0, 46)}`
    );
  }
}
if (marked.length) {
  console.log(
    `price multiplier ${PRICE_MULTIPLIER} applied to ${marked.length} products ` +
      `(${products.length - marked.length} exempt)`
  );
}
console.log(`flagged for price review: ${priceReview.length}`);
