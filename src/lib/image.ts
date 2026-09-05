import catalog from '@data/catalog.json';
import heroManifest from '@data/hero-variants.json';

/**
 * A neutral blur placeholder used by every product image.
 *
 * Written as a URL-encoded SVG rather than base64: this module is imported by
 * client components, and `Buffer` is not available in the browser bundle.
 *
 * Per-image blurDataURLs would mean processing all 1,714 source assets for a
 * few pixels of colour accuracy. One shared sand-toned blur reads as "image
 * loading here", holds the layout, and costs a single string.
 */
export const BLUR_DATA_URL =
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect width="8" height="8" fill="#efeae2"/></svg>'
  );

/**
 * True once `npm run localize:images` has run and every catalog path points at
 * a pre-encoded WebP in /public. Those files are already at the exact rendered
 * width and format, so routing them back through next/image would burn CPU to
 * produce a near-identical byte stream — we serve them directly instead.
 */
export const IMAGES_LOCALIZED: boolean = (catalog as { localized?: boolean }).localized === true;

/**
 * `sizes` values, kept here so the grid definition and the image hint can never
 * drift apart. Getting these right is what stops a 320px-wide card from
 * downloading a 1920px variant.
 */
export const SIZES = {
  // 2 cols under 768, 3 up to 1024, 4 above — matches <ProductGrid>.
  card: '(min-width: 1280px) 320px, (min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw',
  // Product page main image: roughly half the viewport on desktop.
  gallery: '(min-width: 1024px) 620px, 100vw',
  thumb: '96px',
  // Category tiles: 3 across on desktop, 2 on mobile.
  tile: '(min-width: 1024px) 33vw, 50vw',
  hero: '100vw',
} as const;

/**
 * Absolutises a catalog image path.
 *
 * Once images are localized, catalog paths are root-relative
 * (`/product-images/…`). That is correct for `next/image` but wrong anywhere
 * the URL leaves the page: Google Merchant Center rejects a relative
 * `image_link`, and JSON-LD consumers cannot resolve one either. Everything
 * that emits an image URL off-site must go through this.
 */
/**
 * The wide variant for a full-bleed hero, or null if none was generated.
 *
 * `full` is 1100px, sized for the 620px product-gallery slot — stretching it to
 * 100vw upscales it. `npm run build:heroes` emits a 1920x1000 `-hero.webp`
 * beside it for the handful of images used this way.
 */
const HERO_VARIANTS = new Set(heroManifest as string[]);

export const heroVariant = (src: string): string | null => {
  const match = src.match(/^\/product-images\/([0-9a-f]{16})-(?:thumb|card|full)\.webp$/);
  if (!match) return null;
  const candidate = `/product-images/${match[1]}-hero.webp`;
  // Only claim a hero exists if build:heroes actually produced it, so a
  // missing variant falls back to `full` instead of 404-ing the LCP image.
  return HERO_VARIANTS.has(candidate) ? candidate : null;
};

export const absoluteImage = (src: string, siteUrl: string): string =>
  /^https?:\/\//i.test(src) ? src : `${siteUrl.replace(/\/$/, '')}${src}`;
