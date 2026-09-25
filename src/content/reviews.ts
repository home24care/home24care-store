/**
 * ============================================================================
 *  SAMPLE CONTENT — REPLACE BEFORE YOU TAKE REAL ORDERS
 * ============================================================================
 *
 * Every entry below is marked `sample: true`. They exist so the review section
 * has something to render while you are still building, and so you can see the
 * layout. They are NOT real customer reviews.
 *
 * While any rendered review is `sample: true`, the storefront:
 *   - does NOT emit AggregateRating structured data, and
 *   - shows a "sample content" notice in development.
 *
 * That is deliberate. Rating markup with invented reviews behind it breaches
 * Google Merchant Center's misrepresentation policy and the FTC endorsement
 * rules, and it is the single fastest way to lose a Merchant account.
 *
 * TO GO LIVE, pick one:
 *
 *   A) Trustpilot (recommended — reviews are collected and hosted by them, so
 *      you never hold the liability). Set
 *      NEXT_PUBLIC_TRUSTPILOT_BUSINESS_UNIT_ID and the real Trustpilot widget
 *      replaces this section automatically. Nothing else to do.
 *
 *   B) Self-hosted. Delete every entry below, paste in reviews real customers
 *      actually sent you, and drop the `sample` flag. AggregateRating then
 *      turns on by itself.
 */

export type Review = {
  id: string;
  rating: 1 | 2 | 3 | 4 | 5;
  title: string;
  body: string;
  author: string;
  location: string;
  /** ISO date — rendered as "October 2, 2026". */
  date: string;
  /** The product this review is about, for context under the card. */
  product?: string;
  /** True when the buyer's order could be matched to the review. */
  verified: boolean;
  /** MUST be false for real reviews. Gates the structured data. */
  sample: boolean;
};

/**
 * Empty until real customers review the store. The storefront hides every
 * review surface (and emits no rating markup) while this list is empty.
 * Add genuine reviews here — or connect Trustpilot — never invented ones.
 */
export const reviews: Review[] = [];

/** True while any rendered review is still placeholder content. */
export const hasSampleReviews = reviews.some((r) => r.sample);

export const reviewStats = (() => {
  if (reviews.length === 0) return null;
  const total = reviews.reduce((n, r) => n + r.rating, 0);
  const average = total / reviews.length;
  const distribution = ([5, 4, 3, 2, 1] as const).map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));
  return {
    average: Math.round(average * 10) / 10,
    count: reviews.length,
    distribution,
  };
})();
