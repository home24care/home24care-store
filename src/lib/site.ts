/**
 * Single source of truth for business identity.
 *
 * Google Merchant Center and Stripe both check that the contact details shown
 * on the storefront match the details on the merchant account, so every
 * template pulls from here rather than hardcoding a value.
 */
export const site = {
  name: 'Home24Care',
  legalName: 'home24care GROUP LLC',
  domain: 'home24care.com',
  /**
   * Normalized once here so a stray trailing slash or missing scheme in the
   * host's env cannot produce double-slash canonicals, a broken sitemap and a
   * whole Merchant feed of bad links. metadataBase also throws at build time
   * on a schemeless value, which fails the deploy with an opaque stack trace.
   */
  url: (() => {
    const raw = (process.env.NEXT_PUBLIC_SITE_URL || 'https://home24care.com').trim();
    const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    return withScheme.replace(/\/+$/, '');
  })(),
  tagline: 'Outdoor living, built to last',
  description:
    'Home24Care sells backyard structures and HVAC refrigerants direct to homeowners and trade customers across the United States — swing sets, gazebos, pergolas, outdoor kitchens, saunas and certified refrigerant cylinders, with free standard shipping.',

  contact: {
    email: 'contact@home24care.com',
    phone: '+1 575 271 0768',
    phoneHref: '+15752710768',
    hours: 'Monday–Friday, 9:00 AM – 6:00 PM CST',
    responseTime: 'We reply to every email within one business day.',
  },

  address: {
    street: '320 Klagetoh St',
    city: 'Gallup',
    region: 'NM',
    regionName: 'New Mexico',
    postalCode: '87301',
    country: 'US',
    countryName: 'United States',
    formatted: '320 Klagetoh St, Gallup, NM 87301, United States',
  },

  /** Shown in the header/footer bar and used by the shipping policy page. */
  shipping: {
    freeThreshold: 0, // free on every order
    handlingTime: '1 business day (Mon–Fri)',
    transitTime: '1–3 business days (Mon–Fri)',
    cutOff: '11:00 PM CST (UTC −6)',
    countries: ['United States'],
  },

  returns: {
    windowDays: 90,
    inspectionHours: 72,
    refundBusinessDays: 7,
    restockingFee: false,
  },

  warranty: {
    years: 3,
    label: 'Three-Year Limited Warranty',
  },

  social: {
    // Fill these in once the profiles exist; empty entries are not rendered.
    facebook: '',
    instagram: '',
    youtube: '',
  },
} as const;

export const currency = 'USD';

/**
 * Accepted cards, in display order.
 *
 * One list drives the footer marks, the cart summary and the payment policy,
 * so the storefront can never claim to accept a card the others omit —
 * a mismatch Stripe and Merchant Center both flag.
 *
 * `mark` points at a local SVG in /public/payment; `height` is tuned per brand
 * because their native aspect ratios differ by 3x.
 */
export const paymentMethods = [
  // `scale` is the mark's height as a fraction of the tile height, not a fixed
  // pixel value, so both tile sizes stay balanced. The numbers differ because
  // the marks do: Visa is a 3.1:1 wordmark that reads large at a small height,
  // while Amex is a square block that would dominate at the same height.
  { name: 'Visa', mark: '/payment/visa.svg', scale: 0.36 },
  { name: 'Mastercard', mark: '/payment/mastercard.svg', scale: 0.64 },
  { name: 'American Express', mark: '/payment/amex.svg', scale: 0.62 },
  { name: 'Discover', mark: '/payment/discover.svg', scale: 0.6 },
] as const;

/** Just the names, for prose that lists them. */
export const paymentMethodNames = paymentMethods.map((m) => m.name);
