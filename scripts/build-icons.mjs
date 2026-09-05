/**
 * Generates the favicon, apple-touch icon and OG image from public/logo.png.
 *
 * The master logo is a 1024x1024, 1.6 MB PNG. It was wired up as the favicon,
 * the apple-touch icon AND the OG/Twitter image, so every page load pulled
 * 1.6 MB for a 32px icon. Run after replacing the logo:
 *
 *   node scripts/build-icons.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const logo = path.join(root, 'public/logo.png');

// Next picks these up by convention from src/app.
await sharp(logo).resize(32, 32).png({ compressionLevel: 9 }).toFile(path.join(root, 'src/app/icon.png'));
await sharp(logo).resize(180, 180).png({ compressionLevel: 9 }).toFile(path.join(root, 'src/app/apple-icon.png'));

// Social cards want 1200x630; the square logo is letterboxed on brand green
// rather than stretched.
await sharp(logo)
  .resize(520, 520, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .extend({ top: 55, bottom: 55, left: 340, right: 340, background: { r: 28, g: 49, b: 38, alpha: 1 } })
  .flatten({ background: { r: 28, g: 49, b: 38 } })
  .jpeg({ quality: 82 })
  .toFile(path.join(root, 'public/og-image.jpg'));

for (const f of ['src/app/icon.png', 'src/app/apple-icon.png', 'public/og-image.jpg']) {
  const { size } = fs.statSync(path.join(root, f));
  const meta = await sharp(path.join(root, f)).metadata();
  console.log(`  ${f.padEnd(26)} ${meta.width}x${meta.height}  ${(size / 1024).toFixed(0)} KB`);
}
