/**
 * Merges rewritten product copy into data/catalog.json.
 *
 *   node scripts/apply-rewrites.mjs data/rewrites/<file>.json
 *
 * The rewrite files hold only `slug`, `excerpt` and `description`. Titles,
 * prices, images and SKUs are never touched — titles in particular are what
 * Merchant Center matches on, and changing them would break product identity.
 *
 * Refuses to apply anything that fails the checks the copy was written under,
 * so a bad batch cannot reach the catalog by accident.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const catalogPath = path.join(root, 'data/catalog.json');

const inputs = process.argv.slice(2);
if (inputs.length === 0) {
  console.error('usage: node scripts/apply-rewrites.mjs <rewrite.json> [...]');
  process.exit(1);
}

const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
const bySlug = new Map(catalog.products.map((p) => [p.slug, p]));

/**
 * The inherited copy, kept as the baseline for the "is this actually new?"
 * check. Comparing against the live catalog instead would reject a correction
 * pass, because a correction is by design a small edit of the rewrite it fixes
 * — it only has to differ from the ORIGINAL, not from its own predecessor.
 */
const originalPath = path.join(root, 'data/rewrites/original-copy.json');
const original = fs.existsSync(originalPath)
  ? new Map(
      JSON.parse(fs.readFileSync(originalPath, 'utf8')).products.map((p) => [
        p.slug,
        p.description,
      ])
    )
  : new Map();

/** Claims the storefront must not make in product copy. */
const BANNED = [
  { re: /igvagas/i, why: 'names a different company' },
  { re: /backyarddiscovery\.com/i, why: 'links a different storefront' },
  { re: /same[- ]day shipping/i, why: 'contradicts the 1-business-day shipping policy' },
  { re: /bulk order discount/i, why: 'promises a discount that is not offered' },
  { re: /wholesale pricing/i, why: 'promises pricing that is not offered' },
  { re: /free shipping/i, why: 'shipping terms belong on the policy page, not per product' },
  { re: /\bclick here\b/i, why: 'CTA copied from another site' },
];

const problems = [];
let applied = 0;

for (const input of inputs) {
  const raw = JSON.parse(fs.readFileSync(path.resolve(input), 'utf8'));
  const entries = Array.isArray(raw) ? raw : (raw.products ?? []);

  for (const entry of entries) {
    const product = bySlug.get(entry.slug);
    if (!product) {
      problems.push(`${entry.slug}: not in catalog`);
      continue;
    }

    const description = String(entry.description ?? '').trim();
    const excerpt = String(entry.excerpt ?? '').trim();

    if (description.length < 200) {
      problems.push(`${entry.slug}: description too short (${description.length})`);
      continue;
    }
    if (excerpt.length < 80 || excerpt.length > 200) {
      problems.push(`${entry.slug}: excerpt out of range (${excerpt.length})`);
      continue;
    }

    const banned = BANNED.find((b) => b.re.test(`${description} ${excerpt}`));
    if (banned) {
      problems.push(`${entry.slug}: ${banned.why}`);
      continue;
    }

    // Guard against the copy being a lightly-edited version of the inherited text.
    const normalize = (s) => s.toLowerCase().replace(/[^a-z0-9 ]/g, '').slice(0, 120);
    const baseline = original.get(entry.slug);
    if (baseline && normalize(description) === normalize(baseline)) {
      problems.push(`${entry.slug}: opening is unchanged from the inherited copy`);
      continue;
    }

    product.description = description;
    product.excerpt = excerpt;
    product.rewritten = true;
    applied++;
  }
}

if (problems.length) {
  console.log(`rejected ${problems.length}:`);
  for (const p of problems.slice(0, 25)) console.log(`  ${p}`);
}

fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 1));

const remaining = catalog.products.filter((p) => p.description.trim() && !p.rewritten).length;
console.log(`applied ${applied} rewrites`);
console.log(`still on inherited copy: ${remaining}`);
