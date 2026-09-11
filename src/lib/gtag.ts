/**
 * Google tag helpers.
 *
 * Two destinations share the one gtag.js that the root layout loads: the GA4
 * property and the Google Ads account. Both are configured there; this module
 * only sends events.
 */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

/** GA4 measurement id. Public by design; an env var overrides it per deploy. */
export const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? 'G-1RGPPFFLKK';

/** Google Ads account. Must be configured, or a send_to at it is discarded. */
export const ADS_ID = process.env.NEXT_PUBLIC_ADS_ID ?? 'AW-18441075454';

/** Conversion actions, as `AW-<account>/<label>` from the Ads event snippet. */
export const ADS_CONVERSIONS = {
  addToCart: `${ADS_ID}/NIvQCLGj0fQcEP71sdlE`,
  purchase: `${ADS_ID}/dJ6iCL630vQcEP71sdlE`,
} as const;

/**
 * Reports a Google Ads conversion.
 *
 * `value` is in dollars, not the integer cents the cart carries, because that
 * is what Ads expects.
 *
 * Silent when gtag is absent. That is the normal case for a good share of
 * visitors — an ad blocker or tracking protection stops gtag.js loading — and
 * a missing conversion must never take an add-to-cart down with it.
 */
export function adsConversion(
  sendTo: string,
  value: number,
  currency = 'USD',
  transactionId?: string
): void {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
  try {
    window.gtag('event', 'conversion', {
      send_to: sendTo,
      value,
      currency,
      // Only sent when there is a real one. Ads deduplicates on this, so an
      // empty string is worse than omitting it: it reads as a legitimate id
      // that every order shares, and the dedupe then works against you.
      ...(transactionId ? { transaction_id: transactionId } : {}),
    });
  } catch {
    /* Never let reporting break the cart. */
  }
}

/**
 * Reports a GA4 ecommerce event.
 *
 * Google Ads and GA4 want different shapes for the same action, so both are
 * sent: the conversion above is what Ads counts and bids on, while this is
 * what shows up in GA4's ecommerce reports.
 */
export function ga4Event(name: string, params: Record<string, unknown>): void {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
  try {
    window.gtag('event', name, params);
  } catch {
    /* Never let reporting break the cart. */
  }
}
