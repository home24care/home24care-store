import { site } from './site';

/**
 * Trustpilot TrustBox configuration.
 *
 * Everything here is driven by environment variables so the storefront never
 * ships invented review content. With no business unit id set, every widget
 * renders nothing at all — the page simply has no reviews section, which is
 * the correct state for a store that has not collected reviews yet.
 *
 * Where to find your business unit id:
 *   Trustpilot Business  ->  Integrations  ->  TrustBox
 *   Pick a template, and the generated snippet contains
 *   data-businessunit-id="XXXXXXXXXXXXXXXXXXXXXXXX"
 */

export const TRUSTPILOT_SCRIPT =
  'https://widget.trustpilot.com/bootstrap/v5/tp.widget.bootstrap.min.js';

/** Official TrustBox template ids, from Trustpilot's own integration page. */
export const TRUSTBOX_TEMPLATES = {
  /** Star rating + review count on one line. Good for headers and footers. */
  microCombo: '5419b6ffb0d04a076446a9af',
  /** Just the stars. */
  microStar: '5419b732fbfb950b10de65e5',
  /** Rolling carousel of recent reviews. Good for a homepage section. */
  carousel: '53aa8912dec7e10d38f59f36',
  /** Grid of recent reviews. */
  grid: '539adbd6dec7e10e686debee',
  /** Wide horizontal strip. */
  horizontal: '5406e65db0d04a09e042d5fc',
  /** Compact summary block, good beside a product buy box. */
  starter: '5613c9cde69ddc09340c6beb',
} as const;

const businessUnitId = process.env.NEXT_PUBLIC_TRUSTPILOT_BUSINESS_UNIT_ID?.trim();

/**
 * Aggregate rating, only for structured data.
 *
 * Google requires that a rating in markup is the rating a visitor can actually
 * see on the page, so these are read from env rather than hardcoded, and the
 * schema is emitted ONLY when a widget is also rendered. Copy the values from
 * your Trustpilot dashboard and keep them current.
 */
const ratingValue = Number(process.env.NEXT_PUBLIC_TRUSTPILOT_RATING);
const reviewCount = Number(process.env.NEXT_PUBLIC_TRUSTPILOT_REVIEW_COUNT);

export const trustpilot = {
  businessUnitId: businessUnitId || null,
  /** Public profile link, shown alongside every widget. */
  profileUrl: `https://www.trustpilot.com/review/${site.domain}`,
  locale: process.env.NEXT_PUBLIC_TRUSTPILOT_LOCALE?.trim() || 'en-US',

  /** True once a business unit id exists — gates every widget on the site. */
  get enabled() {
    return Boolean(businessUnitId);
  },

  /**
   * Present only when the id AND both numbers are configured, and the numbers
   * are in a sane range. Anything less and we emit no AggregateRating, because
   * rating markup without a real rating behind it is a manual-action risk.
   */
  get aggregate() {
    if (!businessUnitId) return null;
    if (!Number.isFinite(ratingValue) || ratingValue < 1 || ratingValue > 5) return null;
    if (!Number.isInteger(reviewCount) || reviewCount < 1) return null;
    return { ratingValue, reviewCount, bestRating: 5, worstRating: 1 };
  },
} as const;
