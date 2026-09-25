/**
 * Generates the logo PNG, favicon, apple-touch icon and OG image from the
 * brand mark in scripts/brand/mark.svg. Run after changing the mark:
 *
 *   node scripts/build-icons.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const mark = fs.readFileSync(path.join(root, 'scripts/brand/mark.svg'));

await sharp(mark, { density: 1200 }).resize(512, 512).png({ compressionLevel: 9 }).toFile(path.join(root, 'public/logo.png'));
await sharp(mark, { density: 300 }).resize(32, 32).png({ compressionLevel: 9 }).toFile(path.join(root, 'src/app/icon.png'));
await sharp(mark, { density: 600 }).resize(180, 180).png({ compressionLevel: 9 }).toFile(path.join(root, 'src/app/apple-icon.png'));

// 1200x630 social card: mark + wordmark on the brand's dark green.
const markPng = await sharp(mark, { density: 1200 }).resize(260, 260).png().toBuffer();
const og = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <rect width="1200" height="630" fill="#1f2a24"/>
  <rect x="0" y="0" width="1200" height="10" fill="#79b38a"/>
  <text x="600" y="455" text-anchor="middle" font-family="Georgia, 'DejaVu Serif', serif" font-size="92" font-weight="700" fill="#ffffff" letter-spacing="6">TOPPSUEFA</text>
  <text x="600" y="520" text-anchor="middle" font-family="'DejaVu Sans', Arial, sans-serif" font-size="30" fill="#9dcdab" letter-spacing="8">SEALED HOBBY BOXES · 100% AUTHENTIC</text>
</svg>`);
await sharp(og)
  .composite([{ input: markPng, top: 80, left: 470 }])
  .jpeg({ quality: 84 })
  .toFile(path.join(root, 'public/og-image.jpg'));

for (const f of ['public/logo.png', 'src/app/icon.png', 'src/app/apple-icon.png', 'public/og-image.jpg']) {
  const { size } = fs.statSync(path.join(root, f));
  const meta = await sharp(path.join(root, f)).metadata();
  console.log(`  ${f.padEnd(26)} ${meta.width}x${meta.height}  ${(size / 1024).toFixed(0)} KB`);
}
