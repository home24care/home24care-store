/**
 * Uploads the catalog to Google Merchant Center through the Merchant API.
 *
 *   node scripts/upload-merchant.mjs check     inspect account, list data sources, dry-run one product
 *   node scripts/upload-merchant.mjs upload    insert every product
 *   node scripts/upload-merchant.mjs status    read back Google's per-item issues
 *   node scripts/upload-merchant.mjs delete    remove every product this script uploaded
 *
 * Uses products/v1 and datasources/v1 (the GA Merchant API, successor to the
 * Content API for Shopping). Field names come from the published discovery
 * document, which differs from the RSS feed's attribute names in four ways
 * that matter:
 *
 *   gtin            -> gtins, an ARRAY
 *   price           -> {amountMicros, currencyCode}, not a decimal string
 *   transit times   -> nested INSIDE shipping[], not top-level
 *   unit measure    -> {value, unit}, not the string "25 lb"
 *
 * Everything else mirrors src/app/feeds/google/route.ts exactly, including the
 * 50-character offer id rule. That is deliberate and load-bearing: the offer id
 * is the permanent handle for a product, so if this script and the feed
 * disagreed about it Google would see two different offers for one item.
 *
 * Credentials are never read from the command line or committed. Set:
 *
 *   MERCHANT_ACCOUNT_ID       Merchant Center account (digits only)
 *   MERCHANT_DATA_SOURCE_ID   the API data source to insert into
 *   MERCHANT_KEY_FILE         path to a service-account JSON key
 *                             (default .secrets/merchant-service-account.json)
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'data/catalog.json'), 'utf8'));

const ACCOUNT = (process.env.MERCHANT_ACCOUNT_ID || '').trim();
const DATA_SOURCE = (process.env.MERCHANT_DATA_SOURCE_ID || '').trim();
const KEY_FILE = process.env.MERCHANT_KEY_FILE || '.secrets/merchant-service-account.json';

const SITE = (process.env.NEXT_PUBLIC_SITE_URL || 'https://toppsuefa.com')
  .trim()
  .replace(/\/+$/, '');

/** Must match FEED_EXTRA in src/lib/image.ts. */
const FEED_EXTRA = 7;
const CONCURRENCY = 8;
const MAX_RETRIES = 5;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ------------------------------------------------------------------- auth */

/**
 * Signs a service-account JWT and trades it for an access token.
 *
 * Done with node:crypto rather than google-auth-library so that uploading to
 * Merchant does not add a dependency tree to the site's build.
 */
async function getAccessToken() {
  const keyPath = path.isAbsolute(KEY_FILE) ? KEY_FILE : path.join(root, KEY_FILE);
  if (!fs.existsSync(keyPath)) {
    throw new Error(
      `no service-account key at ${KEY_FILE}\n` +
        `  Create one in Google Cloud, then save it there (the .secrets/ folder is gitignored).`
    );
  }

  const key = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
  if (!key.client_email || !key.private_key) {
    throw new Error(`${KEY_FILE} is not a service-account key (no client_email / private_key)`);
  }

  const now = Math.floor(Date.now() / 1000);
  const b64 = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');
  const unsigned =
    b64({ alg: 'RS256', typ: 'JWT' }) +
    '.' +
    b64({
      iss: key.client_email,
      scope: 'https://www.googleapis.com/auth/content',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
    });

  const signature = crypto
    .createSign('RSA-SHA256')
    .update(unsigned)
    .sign(key.private_key)
    .toString('base64url');

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${unsigned}.${signature}`,
    }),
  });

  const body = await res.json();
  if (!res.ok) {
    throw new Error(
      `token exchange failed (HTTP ${res.status}): ${body.error_description || body.error}\n` +
        `  Check that the Merchant API is enabled in the key's Google Cloud project.`
    );
  }
  return { token: body.access_token, email: key.client_email };
}

/** One API call, retrying the failures that are worth retrying. */
async function api(token, url, { method = 'GET', body } = {}) {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });

    // 429 is quota, 5xx is Google having a moment. Both pass on a retry;
    // a 400 never will, so it is returned for the caller to report.
    if ((res.status === 429 || res.status >= 500) && attempt < MAX_RETRIES) {
      await sleep(1000 * 2 ** attempt);
      continue;
    }

    const text = await res.text();
    let json = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      /* non-JSON error page */
    }
    return { ok: res.ok, status: res.status, json, text };
  }
}

const fail = (r) => r.json?.error?.message || `HTTP ${r.status} ${r.text.slice(0, 300)}`;

/* ---------------------------------------------------------------- mapping */

/**
 * The offer id, capped at Google's 50 characters.
 *
 * Byte-identical to feedId() in src/app/feeds/google/route.ts - see the header
 * note. Changing either one alone would split a product into two offers.
 */
const offerId = (sku) => {
  const trimmed = sku.trim();
  if (trimmed.length <= 50) return trimmed;
  const hash = crypto.createHash('sha1').update(trimmed).digest('hex').slice(0, 8);
  return `${trimmed.slice(0, 41)}-${hash}`;
};

/** Merchant rejects WebP, so the feed and this uploader both cite the JPEGs. */
const feedImage = (src) => src.replace(/-(?:thumb|card|full)\.webp$/, '-feed.jpg');
const absolute = (src) => (/^https?:\/\//i.test(src) ? src : `${SITE}${src}`);

/** Catalog money is integer cents; the API wants micros. */
const micros = (cents) => String(cents * 10000);

/** "25 lb" -> {value: 25, unit: "lb"} */
const splitMeasure = (text) => {
  const m = String(text).match(/^([\d.]+)\s*(\w+)$/);
  return m ? { value: Number(m[1]), unit: m[2] } : null;
};

const flatten = (d) =>
  d
    .split('\n')
    .map((l) => l.replace(/^#{2,3} (.*)$/, '$1:').replace(/^- /, '• '))
    .join('\n');

const collections = new Map(catalog.collections.map((c) => [c.slug, c]));

function toProductInput(product) {
  const collection = collections.get(product.collection);

  const availability = !product.available
    ? 'out_of_stock'
    : product.preorder
      ? 'preorder'
      : 'in_stock';

  const description =
    flatten(product.description).slice(0, 4900) ||
    `${product.title} from ${product.brand}, sold by TOPPSUEFA with free shipping.`;

  // Same convention as the feed: price is the list price, salePrice the
  // current one, so a discount renders as a strikethrough in Shopping.
  const listCents = product.compareAtPrice ?? product.price;

  const attributes = {
    title: product.title.slice(0, 150),
    description,
    link: `${SITE}/products/${product.slug}`,
    imageLink: absolute(feedImage(product.images[0].full)),
    additionalImageLinks: product.images
      .slice(1, 1 + FEED_EXTRA)
      .map((img) => absolute(feedImage(img.full))),

    availability,
    condition: 'new',
    price: { amountMicros: micros(listCents), currencyCode: product.currency },

    brand: product.brand,
    ...(product.mpn ? { mpn: product.mpn } : {}),
    ...(!product.gtin && !product.mpn ? { identifierExists: false } : {}),

    googleProductCategory: collection?.googleCategory ?? 'Arts & Entertainment > Hobbies & Creative Arts > Collectibles > Collectible Trading Cards',
    productTypes: [`${collection?.group ?? 'Trading Cards'} > ${collection?.title ?? product.productType}`],

    // Handling is top-level; transit time is per shipping service. Both are
    // int64 fields, which the API wants as strings.
    minHandlingTime: '0',
    maxHandlingTime: '1',
    shipping: [
      {
        country: 'US',
        service: 'Standard',
        price: { amountMicros: '0', currencyCode: 'USD' },
        minTransitTime: '1',
        maxTransitTime: '3',
      },
    ],

    adult: false,
    productHighlights: product.highlights.slice(0, 5).map((h) => h.slice(0, 150)),
  };

  if (product.compareAtPrice) {
    attributes.salePrice = { amountMicros: micros(product.price), currencyCode: product.currency };
  }

  // Optional attributes go out only when the source data actually stated them.
  // A guessed gtin or size is worse than an absent one: Google would match the
  // offer against a different product entirely.
  if (product.gtin) attributes.gtins = [product.gtin];
  if (product.itemGroupId) attributes.itemGroupId = product.itemGroupId;
  if (product.size) attributes.size = product.size;
  if (product.color) attributes.color = product.color;
  if (product.multipack) attributes.multipack = String(product.multipack);
  if (product.isBundle) attributes.isBundle = true;
  if (product.shippingWeightLb) {
    attributes.shippingWeight = { value: product.shippingWeightLb, unit: 'lb' };
  }
  if (product.unitPricingMeasure) {
    const measure = splitMeasure(product.unitPricingMeasure);
    if (measure) attributes.unitPricingMeasure = measure;
  }

  return {
    offerId: offerId(product.sku),
    contentLanguage: 'en',
    feedLabel: 'US',
    productAttributes: attributes,
  };
}

/** The feed skips imageless and priceless products; so must this. */
const sellable = catalog.products.filter((p) => p.images.length > 0 && p.price > 0);

/* --------------------------------------------------------------- commands */

function requireConfig(needSource = true) {
  const missing = [];
  if (!ACCOUNT) missing.push('MERCHANT_ACCOUNT_ID');
  if (needSource && !DATA_SOURCE) missing.push('MERCHANT_DATA_SOURCE_ID');
  if (missing.length) throw new Error(`missing environment: ${missing.join(', ')}`);
}

async function check() {
  requireConfig(false);
  const { token, email } = await getAccessToken();
  console.log(`authenticated as ${email}\n`);

  const res = await api(
    token,
    `https://merchantapi.googleapis.com/datasources/v1/accounts/${ACCOUNT}/dataSources?pageSize=100`
  );
  if (!res.ok) {
    throw new Error(
      `cannot read account ${ACCOUNT}: ${fail(res)}\n` +
        `  The service account must be added as a user on this Merchant Center account.`
    );
  }

  const sources = res.json.dataSources ?? [];
  console.log(`data sources on account ${ACCOUNT}:`);
  for (const s of sources) {
    const primary = s.primaryProductDataSource;
    const kind = primary ? 'primary' : s.supplementalProductDataSource ? 'supplemental' : 'other';
    const usable = s.input === 'API' && (primary || s.supplementalProductDataSource);
    console.log(
      `  ${usable ? '[API OK]' : '[      ]'} ${String(s.dataSourceId).padEnd(12)}` +
        ` ${String(s.input).padEnd(9)} ${kind.padEnd(12)} ${s.displayName}` +
        (primary?.feedLabel ? `  [${primary.feedLabel}/${primary.contentLanguage}]` : '')
    );
  }

  // Only API data sources accept productInputs.insert. A scheduled-fetch feed
  // cannot be written to, and pointing this script at one fails every product
  // with the same unhelpful error - so say so plainly here instead.
  const usable = sources.filter((s) => s.input === 'API');
  console.log(
    `\n${usable.length} of ${sources.length} accept API uploads` +
      (usable.length ? '' : ' - create one with: node scripts/upload-merchant.mjs create-source')
  );

  if (DATA_SOURCE) {
    const target = sources.find((s) => String(s.dataSourceId) === DATA_SOURCE);
    if (!target) {
      console.log(`\n! MERCHANT_DATA_SOURCE_ID ${DATA_SOURCE} is not on this account`);
    } else if (target.input !== 'API') {
      console.log(
        `\n! ${DATA_SOURCE} (${target.displayName}) is a ${target.input} source, not API.` +
          `\n  Products cannot be inserted into it. Create an API source instead:` +
          `\n    node scripts/upload-merchant.mjs create-source`
      );
    } else {
      console.log(`\nOK - will upload into ${DATA_SOURCE} (${target.displayName})`);
    }
  }

  const sample = sellable.find((p) => p.gtin && p.compareAtPrice) ?? sellable[0];
  console.log(`\n--- payload for ${sample.sku} ---`);
  console.log(JSON.stringify(toProductInput(sample), null, 1));
  console.log(`\n${sellable.length} products ready to upload`);
}

async function createSource() {
  requireConfig(false);
  const { token } = await getAccessToken();
  const res = await api(
    token,
    `https://merchantapi.googleapis.com/datasources/v1/accounts/${ACCOUNT}/dataSources`,
    {
      method: 'POST',
      body: {
        displayName: 'TOPPSUEFA API',
        primaryProductDataSource: {
          contentLanguage: 'en',
          feedLabel: 'US',
          countries: ['US'],
        },
      },
    }
  );
  if (!res.ok) throw new Error(`could not create data source: ${fail(res)}`);
  console.log(`created data source ${res.json.dataSourceId} (${res.json.displayName})`);
  console.log(`\nSet it and re-run:\n  export MERCHANT_DATA_SOURCE_ID=${res.json.dataSourceId}`);
}

async function upload() {
  requireConfig();
  const { token } = await getAccessToken();
  const url =
    `https://merchantapi.googleapis.com/products/v1/accounts/${ACCOUNT}/productInputs:insert` +
    `?dataSource=accounts/${ACCOUNT}/dataSources/${DATA_SOURCE}`;

  console.log(`uploading ${sellable.length} products to account ${ACCOUNT}, source ${DATA_SOURCE}\n`);

  let done = 0;
  let ok = 0;
  const errors = [];
  let cursor = 0;

  async function worker() {
    while (cursor < sellable.length) {
      const product = sellable[cursor++];
      const res = await api(token, url, { method: 'POST', body: toProductInput(product) });
      done++;
      if (res.ok) ok++;
      else errors.push({ sku: product.sku, message: fail(res) });
      if (done % 25 === 0 || done === sellable.length) {
        console.log(`  ${done}/${sellable.length} - ${ok} accepted, ${errors.length} rejected`);
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  console.log(`\naccepted ${ok}, rejected ${errors.length}`);
  if (errors.length) {
    // Group by message: 200 products failing one way is one problem, not 200.
    const byMessage = new Map();
    for (const e of errors) {
      if (!byMessage.has(e.message)) byMessage.set(e.message, []);
      byMessage.get(e.message).push(e.sku);
    }
    console.log('\nrejections:');
    for (const [message, skus] of [...byMessage].sort((a, b) => b[1].length - a[1].length)) {
      console.log(`\n  ${skus.length}x ${message}`);
      console.log(`     e.g. ${skus.slice(0, 5).join(', ')}`);
    }
    process.exitCode = 1;
  }

  console.log(
    '\nGoogle processes items asynchronously. Wait a few minutes, then:\n' +
      '  node scripts/upload-merchant.mjs status'
  );
}

async function status() {
  requireConfig(false);
  const { token } = await getAccessToken();

  const items = [];
  let pageToken = '';
  do {
    const res = await api(
      token,
      `https://merchantapi.googleapis.com/products/v1/accounts/${ACCOUNT}/products` +
        `?pageSize=250${pageToken ? `&pageToken=${pageToken}` : ''}`
    );
    if (!res.ok) throw new Error(`cannot list products: ${fail(res)}`);
    items.push(...(res.json.products ?? []));
    pageToken = res.json.nextPageToken ?? '';
  } while (pageToken);

  console.log(`${items.length} products in Merchant Center\n`);
  if (items.length === 0) {
    console.log('Nothing ingested yet. Run the upload, then wait a few minutes.');
    return;
  }

  const issues = new Map();
  let clean = 0;
  for (const item of items) {
    const list = item.productStatus?.itemLevelIssues ?? [];
    if (list.length === 0) clean++;
    for (const issue of list) {
      const key = JSON.stringify({
        severity: issue.severity ?? '',
        code: issue.code ?? '',
        description: issue.description ?? '',
        attribute: issue.attribute ?? '',
      });
      if (!issues.has(key)) issues.set(key, []);
      issues.get(key).push(item.offerId);
    }
  }

  console.log(`${clean} products with no issues at all\n`);
  const rank = { disapproved: 0, demoted: 1, unaffected: 2 };
  const sorted = [...issues].sort((a, b) => {
    const sa = JSON.parse(a[0]).severity;
    const sb = JSON.parse(b[0]).severity;
    return (rank[sa] ?? 3) - (rank[sb] ?? 3) || b[1].length - a[1].length;
  });

  for (const [key, offers] of sorted) {
    const { severity, code, description, attribute } = JSON.parse(key);
    console.log(`[${severity}] ${offers.length}x ${code}${attribute ? ` (${attribute})` : ''}`);
    if (description) console.log(`    ${description}`);
    console.log(`    e.g. ${offers.slice(0, 5).join(', ')}`);
    console.log();
  }
}

async function remove() {
  requireConfig();
  const { token } = await getAccessToken();
  console.log(`deleting ${sellable.length} products from source ${DATA_SOURCE}\n`);

  let done = 0;
  let gone = 0;
  let cursor = 0;
  async function worker() {
    while (cursor < sellable.length) {
      const product = sellable[cursor++];
      // The resource name encodes channel~language~feedLabel~offerId.
      const name = `accounts/${ACCOUNT}/productInputs/online~en~US~${encodeURIComponent(offerId(product.sku))}`;
      const res = await api(
        token,
        `https://merchantapi.googleapis.com/products/v1/${name}` +
          `?dataSource=accounts/${ACCOUNT}/dataSources/${DATA_SOURCE}`,
        { method: 'DELETE' }
      );
      done++;
      if (res.ok) gone++;
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  console.log(`deleted ${gone} of ${done}`);
}

const commands = { check, upload, status, delete: remove, 'create-source': createSource };
const command = process.argv[2] ?? 'check';

if (!commands[command]) {
  console.error(`usage: node scripts/upload-merchant.mjs <${Object.keys(commands).join('|')}>`);
  process.exit(1);
}

try {
  await commands[command]();
} catch (error) {
  console.error(`\n${error.message}`);
  process.exit(1);
}
