/**
 * Derives the Google Merchant Center attributes the catalog does not carry.
 *
 *   node scripts/enrich-merchant.mjs
 *
 * Everything here is read out of the product TITLE, which is the one field
 * that is authoritative and untouched. Nothing is inferred from marketing
 * copy and nothing is invented — a wrong `size` or `multipack` is worse than
 * an absent one, because Google will match the offer against the wrong thing.
 *
 * Attributes produced:
 *   size, color            variant attributes, only where the title states them
 *   itemGroupId            groups genuine size/colour variants of one model
 *   multipack              count of identical units in a merchant multipack
 *   isBundle               different products sold together as one offer
 *   unitPricingMeasure     net content, so Shopping can show a unit price
 *   shippingWeight         pounds, from the catalog weight where present
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const catalogPath = path.join(root, 'data/catalog.json');
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

/**
 * Real GTINs collected by scripts/fetch-gtins.mjs, keyed by SKU. Only products
 * that actually have one get the attribute — Google would rather see no GTIN
 * than a wrong one, which it would use to match the offer to another product.
 */
const gtinPath = path.join(root, 'data/gtins.json');
const gtins = fs.existsSync(gtinPath)
  ? JSON.parse(fs.readFileSync(gtinPath, 'utf8'))
  : {};

/* ------------------------------------------------------------------ size */

/** "16x12 Barrington Gazebo" and "Stratford | 12x10 Steel Pergola" both. */
const DIMENSION = /(\d+(?:\.\d+)?)\s*[xX]\s*(\d+(?:\.\d+)?)/;

const sizeOf = (title) => {
  const m = title.match(DIMENSION);
  return m ? `${m[1]}x${m[2]}` : null;
};

/* ----------------------------------------------------------------- colour */

// Only finishes that actually appear as a distinguishing word in these titles.
const COLORS = [
  ['Light Brown', /\blight brown\b/i],
  ['Dark Brown', /\bdark brown\b/i],
  ['Walnut', /\bwalnut\b/i],
  ['Black', /\bblack\b/i],
  ['White', /\bwhite\b/i],
  ['Brown', /\bbrown\b/i],
  ['Gray', /\bgray\b|\bgrey\b/i],
  ['Yellow', /\byellow\b/i],
  ['Acacia', /\bacacia\b/i],
];

const colorOf = (title) => COLORS.find(([, re]) => re.test(title))?.[0] ?? null;

/* ------------------------------------------------------- multipack/bundle */

/**
 * A multipack is N identical units. A bundle is different products sold
 * together. "40 x 30lb R-22" is a multipack of 40; "3 Cans with Brass Can
 * Tap" is a bundle, because the tap is not another can.
 */
const BUNDLE_MARKER = /\bwith\b.*(can tap|gauge|tap\b)/i;

const packOf = (title) => {
  if (BUNDLE_MARKER.test(title)) return { multipack: null, isBundle: true };

  // "40 × 24lb", "10 x 30lb"
  const times = title.match(/(\d+)\s*[×xX]\s*\d+(?:\.\d+)?\s*(?:lb|oz)/i);
  if (times) return { multipack: Number(times[1]), isBundle: false };

  // "16 Cans (8oz Each)", "3-Pack", "4 Pack"
  const cans = title.match(/(\d+)\s*Cans?\b/i);
  if (cans) return { multipack: Number(cans[1]), isBundle: false };

  const pack = title.match(/(\d+)\s*[-\s]?Pack\b/i);
  if (pack) return { multipack: Number(pack[1]), isBundle: false };

  return { multipack: null, isBundle: false };
};

/* -------------------------------------------------- unit pricing measure */

/** Net content of a single unit, so Shopping can show price per pound. */
const unitOf = (title) => {
  const m = title.match(/(?:^|[\s×xX-])(\d+(?:\.\d+)?)\s*(lb|oz)\b/i);
  if (!m) return null;
  return `${m[1]} ${m[2].toLowerCase()}`;
};

/* ------------------------------------------------------------ item group */

/**
 * Groups only genuine variants.
 *
 * Two products belong together when they share a model name AND a product
 * type AND differ by size or colour. Configuration differences — an Emory
 * island with a griddle versus one with a pizza oven — are separate products
 * to Google, not variants, so they are deliberately not grouped.
 */
const modelKey = (product) => {
  let t = product.title;
  // Drop the leading or embedded dimension and any finish word, so what is
  // left is the model name itself.
  t = t.replace(DIMENSION, ' ');
  for (const [, re] of COLORS) t = t.replace(re, ' ');
  t = t
    .replace(/\|/g, ' ')
    .replace(/\b(gazebo|pergola|greenhouse|playhouse|carport|swing set|sauna)\b/gi, ' ')
    .replace(/[^A-Za-z ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
  const first = t.split(' ').filter((w) => w.length > 2)[0];
  return first ? `${first}-${product.productType}`.toLowerCase().replace(/\s+/g, '-') : null;
};

/* ---------------------------------------------------------------- enrich */

const groups = new Map();
for (const product of catalog.products) {
  const key = modelKey(product);
  if (!key) continue;
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(product);
}

let gtinned = 0;
let sized = 0;
let colored = 0;
let grouped = 0;
let packed = 0;
let bundled = 0;
let united = 0;

for (const product of catalog.products) {
  const size = sizeOf(product.title);
  const color = colorOf(product.title);
  const { multipack, isBundle } = packOf(product.title);
  const unit = unitOf(product.title);

  const gtin = gtins[product.sku];
  if (gtin) {
    product.gtin = gtin;
    gtinned++;
  }

  if (size) {
    product.size = size;
    sized++;
  }
  if (color) {
    product.color = color;
    colored++;
  }
  if (multipack && multipack > 1) {
    product.multipack = multipack;
    packed++;
  }
  if (isBundle) {
    product.isBundle = true;
    bundled++;
  }
  if (unit) {
    product.unitPricingMeasure = unit;
    united++;
  }
  if (product.weightGrams > 0) {
    product.shippingWeightLb = Number((product.weightGrams / 453.592).toFixed(2));
  }

}

/**
 * Assign item_group_id last, and only where the grouping is defensible.
 *
 * Google requires every member of a group to differ by a stated variant
 * attribute. A product that carries neither size nor colour cannot say how it
 * differs from its siblings, so grouping it is meaningless — and in a couple
 * of cases it was outright wrong, pairing a "Privacy Wall Add-on Kit" with the
 * panel it attaches to. A group therefore survives only when at least two of
 * its members each state a size or a colour, and only those members join it.
 */
for (const [key, family] of groups) {
  const eligible = family.filter((p) => p.size || p.color);
  if (eligible.length < 2) continue;

  const sizes = new Set(eligible.map((p) => p.size ?? null));
  const colors = new Set(eligible.map((p) => p.color ?? null));
  if (sizes.size < 2 && colors.size < 2) continue;

  for (const p of eligible) {
    p.itemGroupId = key;
    grouped++;
  }
}

fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 1));

const families = [...groups.values()].filter((f) => {
  if (f.length < 2) return false;
  const sizes = new Set(f.map((p) => sizeOf(p.title)));
  const colors = new Set(f.map((p) => colorOf(p.title)));
  return sizes.size > 1 || colors.size > 1;
});

console.log(`gtin            ${gtinned}`);
console.log(`size            ${sized}`);
console.log(`color           ${colored}`);
console.log(`item_group_id   ${grouped} across ${families.length} families`);
console.log(`multipack       ${packed}`);
console.log(`is_bundle       ${bundled}`);
console.log(`unit measure    ${united}`);
console.log(
  `shipping_weight ${catalog.products.filter((p) => p.shippingWeightLb).length}`
);
