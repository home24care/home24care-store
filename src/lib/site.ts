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
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://home24care.com',
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

/** Payment brands displayed at checkout and in the footer trust bar. */
export const paymentMethods = [
  'Visa',
  'Mastercard',
  'American Express',
  'Discover',
] as const;
