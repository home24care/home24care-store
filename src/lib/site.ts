/**
 * Single source of truth for business identity.
 *
 * Google Merchant Center and Stripe both check that the contact details shown
 * on the storefront match the details on the merchant account, so every
 * template pulls from here rather than hardcoding a value.
 */
export const site = {
  name: 'TOPPSUEFA',
  legalName: 'TOPPSUEFA',
  domain: 'toppsuefa.com',
  /**
   * Normalized once here so a stray trailing slash or missing scheme in the
   * host's env cannot produce double-slash canonicals, a broken sitemap and a
   * whole Merchant feed of bad links. metadataBase also throws at build time
   * on a schemeless value, which fails the deploy with an opaque stack trace.
   */
  url: (() => {
    const raw = (process.env.NEXT_PUBLIC_SITE_URL || 'https://toppsuefa.com').trim();
    const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    return withScheme.replace(/\/+$/, '');
  })(),
  tagline: 'Sealed hobby boxes for serious collectors',
  description:
    'TOPPSUEFA is a U.S. hobby shop for factory-sealed trading cards — Topps Chrome, Bowman, Panini Prizm, Pokémon TCG and Magic: The Gathering hobby boxes and cases, shipped free and packed to protect the seal.',

  contact: {
    email: 'contact@toppsuefa.com',
    phone: '+1 646 838 0288',
    phoneHref: '+16468380288',
    hours: 'Seven days a week, 9:00 AM – 6:00 PM MT',
    responseTime: 'We reply to every email within one day.',
    /** Shown in the footer, in the hobby-shop "Business Hours" table. */
    schedule: [
      ['Mon – Fri', '9:00 AM – 6:00 PM MT'],
      ['Saturday', '9:00 AM – 6:00 PM MT'],
      ['Sunday', '9:00 AM – 6:00 PM MT'],
    ],
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
    cutOff: '11:00 PM MT',
    countries: ['United States'],
  },

  returns: {
    windowDays: 90,
    inspectionHours: 72,
    refundBusinessDays: 7,
    restockingFee: false,
  },

  /** The store's product promise, shown wherever a guarantee is summarised. */
  warranty: {
    label: 'Authenticity Guarantee',
    short: '100% authentic, factory sealed',
  },

  social: {
    // Fill these in once the profiles exist; empty entries are not rendered.
    facebook: '',
    instagram: '',
    youtube: '',
  },
} as const;

/** "Acme LLC, trading as Brand" — or just the brand when the two names match. */
export const legalEntity: string =
  (site.legalName as string) === site.name ? site.name : `${site.legalName}, trading as ${site.name}`;

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
