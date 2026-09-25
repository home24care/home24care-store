/**
 * Builds data/catalog.json from the raw source exports in scripts/source/.
 * Re-run with: node scripts/build-catalog.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

/*
  Three sources, all refrigerants. The outdoor (Shopify), original gas and
  equipment exports were dropped when the store narrowed to gas only; their
  files are left on disk but are no longer read.

    sentai    — primary catalogue, prices as published
    gasKeep   — the few products we stock that Sentai Gas does not
    freonwell — additional cylinders, prices as published, images borrowed
*/
const sentai = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'source/sentaigas-products.json'), 'utf8')
);
const gasKeep = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'source/gas-keep-products.json'), 'utf8')
);
const freonwell = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'source/freonwell-products.json'), 'utf8')
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

/**
 * A slug taken from a source export, made safe to put in a URL.
 *
 * WordPress stores non-ASCII slugs percent-encoded, and that encoding arrives
 * as literal text: one product's slug was the 61 characters
 * `craftsman-30%e2%80%b3-10-5-hp-...`, where `%e2%80%b3` is a double-prime.
 * A browser decodes those escapes before the route is matched, so the request
 * never equals the stored slug and the page 404s -- which it did for 11
 * products, live.
 *
 * Decoding first and then slugifying collapses the escape to nothing, leaving
 * plain ASCII. Slugs that are already clean pass through unchanged.
 */
const sourceSlug = (raw, fallbackName) => {
  const text = raw || '';

  /*
    A slug that is already URL-safe is returned byte for byte, never re-run
    through slugify(). slugify() truncates at 90 characters, and 35 of these
    slugs are longer than that, so normalising every slug "for consistency"
    would silently rewrite 35 URLs that work today -- breaking live pages and
    the links already sitting in the Merchant feed. Only the broken ones move.
  */
  if (/^[a-z0-9-]+$/.test(text)) return text;

  let decoded = text;
  try {
    decoded = decodeURIComponent(text);
  } catch {
    // Malformed escapes (a stray % that is not a valid sequence): slugify the
    // raw text instead, which strips the % either way.
  }
  return slugify(decoded) || slugify(fallbackName);
};

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
    slug: 'maintenance-supplies',
    title: 'Maintenance Supplies',
    group: 'Refrigerants & Gases',
    tagline: 'Flush, leak detection and service consumables for HVAC work.',
    googleCategory: 'Hardware > Building Consumables > Chemicals',
  },
  {
    slug: 'bulk-pallets',
    title: 'Bulk & Pallet Orders',
    group: 'Refrigerants & Gases',
    tagline: 'Full, half and quarter pallets with freight included.',
    googleCategory: 'Hardware > Heating, Ventilation & Air Conditioning',
  },

  /* --- Grills & Outdoor Cooking ----------------------------------------
     googleCategory values below are verbatim rows from Google's official
     product taxonomy (taxonomy-with-ids.en-US), not approximations: an
     unrecognised category string is ignored by Merchant, which silently
     loses the categorisation it was added for. */
  {
    slug: 'gas-grills',
    title: 'Gas Grills',
    group: 'Grills & Outdoor Cooking',
    tagline: 'Built-in and freestanding gas barbecues for real outdoor cooking.',
    googleCategory: 'Home & Garden > Kitchen & Dining > Kitchen Appliances > Outdoor Grills',
  },
  {
    slug: 'pellet-grills',
    title: 'Pellet Grills',
    group: 'Grills & Outdoor Cooking',
    tagline: 'Wood-fired pellet cookers for low, slow and hands-off smoking.',
    googleCategory: 'Home & Garden > Kitchen & Dining > Kitchen Appliances > Outdoor Grills',
  },

  /* --- Outdoor Power Equipment ----------------------------------------- */
  {
    slug: 'portable-generators',
    title: 'Portable Generators',
    group: 'Outdoor Power Equipment',
    tagline: 'Backup power for outages, job sites and off-grid weekends.',
    googleCategory: 'Hardware > Power & Electrical Supplies > Generators',
  },
  {
    slug: 'riding-mowers',
    title: 'Riding Mowers',
    group: 'Outdoor Power Equipment',
    tagline: 'Zero-turn and lawn tractors for properties measured in acres.',
    googleCategory:
      'Home & Garden > Lawn & Garden > Outdoor Power Equipment > Lawn Mowers > Riding Mowers',
  },
  {
    slug: 'walk-behind-mowers',
    title: 'Walk-Behind Mowers',
    group: 'Outdoor Power Equipment',
    tagline: 'Self-propelled and push mowers for everyday lawns.',
    googleCategory:
      'Home & Garden > Lawn & Garden > Outdoor Power Equipment > Lawn Mowers > Walk-Behind Mowers',
  },

  /* --- Garage & Workshop ------------------------------------------------ */
  {
    slug: 'car-lifts',
    title: 'Car Lifts',
    group: 'Garage & Workshop',
    tagline: 'Two-post, four-post and scissor lifts for home and pro garages.',
    googleCategory:
      'Vehicles & Parts > Vehicle Parts & Accessories > Vehicle Maintenance, Care & Decor > Vehicle Repair & Specialty Tools',
  },
  {
    slug: 'shop-machinery',
    title: 'Shop Machinery',
    group: 'Garage & Workshop',
    tagline: 'Forklifts, hoists and heavy equipment for warehouse and yard.',
    googleCategory: 'Business & Industrial > Heavy Machinery',
  },

  /* --- Home Systems ----------------------------------------------------- */
  {
    slug: 'tankless-water-heaters',
    title: 'Tankless Water Heaters',
    group: 'Home Systems',
    tagline: 'On-demand hot water without a storage tank.',
    googleCategory: 'Home & Garden > Household Appliances > Water Heaters',
  },
  {
    slug: 'ranges-cooktops',
    title: 'Ranges & Cooktops',
    group: 'Home Systems',
    tagline: 'Professional dual-fuel and gas ranges for the kitchen.',
    googleCategory: 'Home & Garden > Kitchen & Dining > Kitchen Appliances > Ranges',
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

// ---- Sentai Gas (RSS product feed) ---------------------------------------

/**
 * The storefront is refrigerants only. The outdoor, equipment and original
 * gas sources were removed with that change; their loaders and price
 * overrides went with them.
 *
 * Sentai Gas is the primary source and its prices are used as published.
 * Brand is rewritten to the house name for its own-label stock, because a
 * shopper buying here is buying from this store; genuine manufacturer brands
 * (Honeywell, Chemours, ICOR, RGAS) are kept, since those identify who made
 * the refrigerant and Merchant matches on them.
 */
const SENTAI_COLLECTIONS = {
  'Bulk Pallets & Packs': 'bulk-pallets',
  'Legacy Refrigerants': 'legacy-refrigerants',
  'Specialty Refrigerants': 'specialty-refrigerants',
  'HVAC Refrigerants': 'hvac-refrigerants',
  'Commercial Refrigerants': 'commercial-refrigerants',
  'Maintenance Supplies': 'maintenance-supplies',
};

const priceCents = (raw) => {
  const n = parseFloat(String(raw ?? '').replace(/[^\d.]/g, ''));
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
};

for (const p of sentai) {
  const tier = (p.product_type || '').split('>').map((s) => s.trim())[1];
  const collectionSlug = SENTAI_COLLECTIONS[tier] || 'specialty-refrigerants';

  const price = priceCents(p.sale_price || p.price);
  if (!price) continue;
  const regular = priceCents(p.price);

  const srcs = [p.image, ...(p.additional_images || [])].filter(Boolean);
  if (!srcs.length) continue;
  const images = srcs.slice(0, 8).map((src) => ({
    thumb: src, card: src, full: src, alt: decode(p.title), width: null, height: null,
  }));

  const brand = p.brand && p.brand !== 'Sentai Gas' ? decode(p.brand) : 'Home24Care';
  const body = stripTags(p.description);

  products.push({
    id: `sg-${p.id}`,
    slug: uniqueSlug(sourceSlug(null, p.title)),
    title: decode(p.title),
    brand,
    collection: collectionSlug,
    productType: tier || 'Refrigerants',
    sku: p.mpn || `H24-SG-${p.id}`,
    price,
    compareAtPrice: regular > price ? regular : null,
    currency: 'USD',
    available: (p.availability || 'in_stock') !== 'out_of_stock',
    preorder: false,
    description: body,
    excerpt: body.split('\n')[0]?.slice(0, 220) || '',
    images,
    highlights: (p.highlights || []).slice(0, 8),
    badges: [],
    shippingIncluded: true,
    requiresShipping: true,
    weightGrams: 0,
    regulated: true,
    source: 'sentai',
  });
}

// ---- Refrigerants we stock that Sentai Gas does not ----------------------

/*
  Carried over verbatim from the previous catalogue, images and copy included,
  because these are products the store already sells and already has rewritten
  copy for. They are the only survivors of the old catalogue.
*/
for (const p of gasKeep) {
  products.push({ ...p, slug: uniqueSlug(p.slug), source: 'legacy-gas' });
}

// ---- Freonwell (Shopify export, prices as published) ---------------------

/*
  Freonwell's own photographs carry their watermark, so none are used. Each
  product here borrows an image from a cylinder of the SAME refrigerant AND
  the same size, matched at extraction time -- an approximate match would put
  a 30 lb cylinder on a 5 lb listing, which misleads the buyer and is a
  mismatch under Merchant's image rules. Products with no exact match were
  left out rather than shown with the wrong picture.
*/
for (const p of freonwell) {
  const price = Math.round((p.price_usd || 0) * 100);
  if (!price || !p.borrowed_image) continue;
  const body = String(p.body || '').trim();

  products.push({
    id: `fw-${p.handle}`,
    slug: uniqueSlug(sourceSlug(p.handle, p.title)),
    title: decode(p.title),
    brand: 'Home24Care',
    collection: 'commercial-refrigerants',
    productType: 'Refrigerants',
    sku: p.sku || `H24-FW-${p.handle}`.slice(0, 40),
    price,
    compareAtPrice: null,
    currency: 'USD',
    available: true,
    preorder: false,
    description: body,
    excerpt: body.split('\n')[0]?.slice(0, 220) || '',
    images: [{ thumb: p.borrowed_image, card: p.borrowed_image, full: p.borrowed_image,
               alt: decode(p.title), width: null, height: null }],
    highlights: [],
    badges: [],
    shippingIncluded: true,
    requiresShipping: true,
    weightGrams: p.grams || 0,
    regulated: true,
    source: 'freonwell',
  });
}


/* ------------------------------------------------- outdoor range trim */

/**
 * The Outdoor Living range is trimmed to the slugs in data/outdoor-keep.json.
 *
 * This lives in the build rather than as a one-off edit to data/catalog.json,
 * because catalog.json is generated: any later `node scripts/build-catalog.mjs`
 * would rebuild all 233 products straight back in, and the removal would look
 * like it had silently undone itself.
 *
 * Collections left with no products are dropped automatically further down
 * (COLLECTIONS is filtered by `used`), so this cannot strand an empty category
 * page or a nav link pointing at one.
 */
const keepPath = path.join(root, 'data/outdoor-keep.json');
if (fs.existsSync(keepPath)) {
  const keep = new Set(JSON.parse(fs.readFileSync(keepPath, 'utf8')));
  const isOutdoor = (p) => COLLECTION_BY_SLUG.get(p.collection)?.group === 'Outdoor Living';
  const before = products.filter(isOutdoor).length;
  for (let i = products.length - 1; i >= 0; i--) {
    if (isOutdoor(products[i]) && !keep.has(products[i].slug)) products.splice(i, 1);
  }
  const after = products.filter(isOutdoor).length;
  console.log(`outdoor trim: ${before} -> ${after} (removed ${before - after})`);
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
/*
  1 = charge what the source charges. The 0.40 markdown belonged to the
  outdoor range, which no longer exists; leaving it in place would have
  discounted the maintenance supplies by 60% purely because they sit outside
  the exempt list.
*/
const PRICE_MULTIPLIER = 1;
const DISCOUNT_EXEMPT_GROUPS = new Set([
  'Refrigerants & Gases',
  // Equipment is listed at its source price, not marked down.
  'Grills & Outdoor Cooking',
  'Outdoor Power Equipment',
  'Garage & Workshop',
  'Home Systems',
]);

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
