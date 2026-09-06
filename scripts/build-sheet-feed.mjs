/**
 * Builds the Google Merchant Center spreadsheet feed.
 *
 *   node scripts/build-sheet-feed.mjs
 *
 * Writes data/merchant-sheet.csv, ready to load into the Google Sheet that
 * Merchant Center generated, via File > Import > Replace current sheet.
 *
 * The column list below reproduces that template's own 40 columns in its own
 * order, then appends the eight it omits but this catalogue needs
 * (google_product_category, product_type, shipping, shipping_weight and the
 * four handling/transit times). Merchant Center matches columns by header
 * name rather than position, so appending is safe; keeping the template's
 * order first just makes the sheet recognisable to a human.
 *
 * Values are the text-feed formats, which are NOT the Merchant API's: price
 * is "349.99 USD" rather than micros, and the transit times are their own
 * columns rather than nested inside shipping. Every value matches
 * src/app/feeds/google/route.ts exactly.
 *
 * Two properties of this catalogue decide how the file is written:
 *
 *   237 descriptions contain a newline, as a paragraph break. Newlines are
 *   legal in a description, so they are preserved by quoting the field
 *   (RFC 4180) rather than stripped. This is why the output is CSV and not
 *   TSV: pasting tab-separated text into Sheets would split those 237
 *   products across two rows each.
 *
 *   118 of 396 product highlights contain a comma. Google offers two ways to
 *   submit a repeated attribute in a Sheet — one cell with comma-separated
 *   values, or several columns holding one value each. The first would shred
 *   those 118 into fragments at their own commas, so this uses the second.
 *   Same for the additional images.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'data/catalog.json'), 'utf8'));

const SITE = (process.env.NEXT_PUBLIC_SITE_URL || 'https://home24care.com')
  .trim()
  .replace(/\/+$/, '');

/** Must match FEED_EXTRA in src/lib/image.ts. */
const FEED_EXTRA = 4;
/** Highlights per product; the catalogue tops out at 4. */
const HIGHLIGHTS = 4;

/* ----------------------------------------------------------------- values */

/**
 * The offer id, capped at Google's 50 characters.
 *
 * Identical to feedId() in src/app/feeds/google/route.ts and offerId() in
 * scripts/upload-merchant.mjs. The offer id is a product's permanent handle,
 * so all three have to agree or Google sees several offers for one item.
 */
const offerId = (sku) => {
  const trimmed = sku.trim();
  if (trimmed.length <= 50) return trimmed;
  const hash = crypto.createHash('sha1').update(trimmed).digest('hex').slice(0, 8);
  return `${trimmed.slice(0, 41)}-${hash}`;
};

/** Merchant rejects WebP, so every feed cites the JPEG copies. */
const feedImage = (src) => src.replace(/-(?:thumb|card|full)\.webp$/, '-feed.jpg');
const absolute = (src) => (/^https?:\/\//i.test(src) ? src : `${SITE}${src}`);

/** Catalogue money is integer cents; a text feed wants "349.99 USD". */
const money = (cents, currency) => `${(cents / 100).toFixed(2)} ${currency}`;

const collections = new Map(catalog.collections.map((c) => [c.slug, c]));

const availabilityOf = (p) =>
  !p.available ? 'out_of_stock' : p.preorder ? 'preorder' : 'in_stock';

const descriptionOf = (p) =>
  // The template's cell says "up to 200 characters", but that is advice: the
  // product data specification puts the limit at 5000. The longest here is 977.
  p.description.slice(0, 4900) ||
  `${p.title} from ${p.brand}, sold by Home24Care with free standard shipping.`;

const extraImages = (p) =>
  p.images.slice(1, 1 + FEED_EXTRA).map((img) => absolute(feedImage(img.full)));

const highlightsOf = (p) => p.highlights.slice(0, HIGHLIGHTS).map((h) => h.slice(0, 150));

/* ---------------------------------------------------------------- columns */

/** One value out of a repeated attribute, or '' when the product has fewer. */
const nth = (fn, i) => (p) => fn(p)[i] ?? '';

/**
 * Columns, in the template's own order, with the repeats expanded and the
 * missing attributes appended.
 *
 * A blank value means the attribute is not submitted. That is deliberate for
 * identifier_exists: the specification says to omit it when the product has a
 * brand and an MPN, which every product here does. Sending "no" would tell
 * Google to ignore the 185 GTINs.
 */
const COLUMNS = [
  ['id', (p) => offerId(p.sku)],
  ['title', (p) => p.title.slice(0, 150)],
  ['description', descriptionOf],
  ['availability', availabilityOf],
  ['availability_date', () => ''],
  ['expiration_date', () => ''],
  ['link', (p) => `${SITE}/products/${p.slug}`],
  ['mobile_link', () => ''],
  ['image_link', (p) => absolute(feedImage(p.images[0].full))],
  ['price', (p) => money(p.compareAtPrice ?? p.price, p.currency)],
  ['sale_price', (p) => (p.compareAtPrice ? money(p.price, p.currency) : '')],
  ['sale_price_effective_date', () => ''],
  ['identifier_exists', () => ''],
  ['gtin', (p) => p.gtin ?? ''],
  ['mpn', (p) => p.sku],
  ['brand', (p) => p.brand],
  ...Array.from({ length: HIGHLIGHTS }, (_, i) => ['product_highlight', nth(highlightsOf, i)]),
  ['product_detail', () => ''],
  ...Array.from({ length: FEED_EXTRA }, (_, i) => ['additional_image_link', nth(extraImages, i)]),
  ['condition', () => 'new'],
  ['adult', () => 'no'],
  ['color', (p) => p.color ?? ''],
  ['size', (p) => p.size ?? ''],
  ['size_type', () => ''],
  ['size_system', () => ''],
  ['gender', () => ''],
  ['material', () => ''],
  ['pattern', () => ''],
  ['age_group', () => ''],
  ['multipack', (p) => (p.multipack ? String(p.multipack) : '')],
  // The template spells this one with a space rather than an underscore.
  ['is bundle', (p) => (p.isBundle ? 'yes' : 'no')],
  ['unit_pricing_measure', (p) => p.unitPricingMeasure ?? ''],
  ['unit_pricing_base_measure', () => ''],
  ['energy_efficiency_class', () => ''],
  ['min_energy_efficiency_class', () => ''],
  ['max_energy_efficiency', () => ''],
  ['item_group_id', (p) => p.itemGroupId ?? ''],
  ['video_link', () => ''],
  ['virtual_model_link', () => ''],
  ['cost_of_goods_sold', () => ''],

  // Not in the generated template, but needed. Merchant Center reads any valid
  // attribute name as a column header.
  ['google_product_category', (p) => collections.get(p.collection)?.googleCategory ?? 'Home & Garden'],
  [
    'product_type',
    (p) => {
      const c = collections.get(p.collection);
      return `${c?.group ?? 'Home'} > ${c?.title ?? p.productType}`;
    },
  ],
  // country:region:service:price - region empty for a nationwide rate.
  ['shipping', () => 'US:::0.00 USD'],
  ['shipping_weight', (p) => (p.shippingWeightLb ? `${p.shippingWeightLb} lb` : '')],
  ['min_handling_time', () => '0'],
  ['max_handling_time', () => '1'],
  ['min_transit_time', () => '1'],
  ['max_transit_time', () => '3'],
];

/* -------------------------------------------------------------- rendering */

/**
 * RFC 4180 quoting. Quote whenever the value carries a comma, a quote or a
 * newline; double any embedded quote. Sheets' importer reads this correctly,
 * which is what lets the 237 multi-paragraph descriptions survive intact.
 */
const cell = (value) => {
  const s = String(value ?? '');
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const products = catalog.products.filter((p) => p.images.length > 0 && p.price > 0);
const header = COLUMNS.map(([name]) => name);
const rows = products.map((p) => COLUMNS.map(([, get]) => get(p)));

const csv = [header, ...rows].map((r) => r.map(cell).join(',')).join('\r\n') + '\r\n';
fs.writeFileSync(path.join(root, 'data/merchant-sheet.csv'), csv, 'utf8');

/* -------------------------------------------------------------- reporting */

const filled = (name) => {
  const cols = header.map((h, i) => (h === name ? i : -1)).filter((i) => i >= 0);
  return rows.filter((r) => cols.some((i) => r[i] !== '')).length;
};

console.log('data/merchant-sheet.csv');
console.log(`  ${rows.length} products, ${header.length} columns, ${(csv.length / 1024).toFixed(0)} KB`);
console.log(`  (template's 40 columns, with the repeats expanded, plus 8 it omits)\n`);
for (const name of [
  'gtin',
  'sale_price',
  'item_group_id',
  'size',
  'color',
  'multipack',
  'unit_pricing_measure',
  'shipping_weight',
  'product_highlight',
  'additional_image_link',
]) {
  console.log(`  ${name.padEnd(22)}${filled(name)}`);
}

const ids = rows.map((r) => r[0]);
const dupes = [...new Set(ids.filter((id, i) => ids.indexOf(id) !== i))];
if (dupes.length) console.log(`\n  DUPLICATE IDS: ${dupes.join(', ')}`);

console.log(
  '\nLoad into the Merchant Center sheet with File > Import > Replace current sheet,' +
    '\nseparator "Comma". That also clears the template\'s instruction rows 2-5.'
);
