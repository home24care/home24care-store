/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  images: {
    // Product imagery is still served from the source CDNs. Run
    // `npm run localize:images` to self-host it and cut the network hop.
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.shopify.com' },
      { protocol: 'https', hostname: 'igvagas.com' },
      { protocol: 'https', hostname: 'home24care.com' },
    ],

    // WebP only. AVIF encodes 3-10x slower in sharp (measured: 0.7-2.2s per
    // image cold, versus 0.12-0.49s for WebP) and every image on a fresh
    // deploy is cold. The extra ~30% file saving is not worth multi-second
    // first paints on a 20-image collection page.
    formats: ['image/webp'],

    // Product art is immutable — the CDN filename changes when the asset
    // does — so cache each optimized variant for a year.
    minimumCacheTTL: 31_536_000,

    // Trimmed from the defaults so a card never negotiates a 3840px variant
    // it will render at 350px. Fewer widths also means fewer cold encodes.
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [96, 128, 256, 384],

    qualities: [70, 75, 80],
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
        ],
      },
      {
        source: '/product-images/:path*',
        headers: [
          // Filenames hash the SOURCE URL, not the file contents, so a
          // re-encode at different settings reuses the same name. `immutable`
          // would strand the old bytes in every cache for a year. A long
          // max-age with revalidation gives nearly the same performance while
          // letting a re-encode actually ship.
          { key: 'Cache-Control', value: 'public, max-age=31536000, stale-while-revalidate=86400' },
        ],
      },
    ];
  },

  async redirects() {
    return [
      // The previous WordPress storefront served products at /product/<slug>
      // (singular). Those URLs are still in Google's index, still linked from
      // elsewhere, and were answering 404 — which Merchant Center reports as
      // "Product page unavailable" on any item that still points at one.
      //
      // The slugs carried over unchanged, so a straight 1:1 permanent redirect
      // recovers them. A slug that genuinely no longer exists still reaches
      // the 404 it would have reached anyway, so nothing is masked.
      { source: '/product/:slug', destination: '/products/:slug', permanent: true },
      // Same for the old category path.
      { source: '/product-category/:slug', destination: '/collections/:slug', permanent: true },
    ];
  },
};

export default nextConfig;
