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

export const reviews: Review[] = [
  {
    id: 'r1',
    rating: 5,
    title: 'Arrived early and packed properly',
    body: 'Ordered on a Thursday and it was on a pallet outside my garage Monday morning. Every board was numbered and the hardware came in labelled bags, so we did not have to guess at anything. Two of us had it standing by Sunday afternoon.',
    author: 'Marcus T.',
    location: 'Round Rock, TX',
    date: '2026-08-19',
    product: '12x10 Norwood Gazebo',
    verified: true,
    sample: true,
  },
  {
    id: 'r2',
    rating: 5,
    title: 'Lumber quality is genuinely good',
    body: 'I have built two of these from other brands and returned one for warped boards. Not a single warped piece in this kit. The kids have been on it every day since we finished it.',
    author: 'Dana R.',
    location: 'Columbus, OH',
    date: '2026-08-02',
    product: 'Adventurer Swing Set',
    verified: true,
    sample: true,
  },
  {
    id: 'r3',
    rating: 5,
    title: 'Correct weight, factory sealed, clean invoice',
    body: 'Ordered Thursday, on the truck Friday. Cylinder was sealed and the weight was exactly right. The invoice had everything my bookkeeper needed, which is more than I can say for the supplier I was using before.',
    author: 'Victor A.',
    location: 'Hialeah, FL',
    date: '2026-07-28',
    product: '25lb R-410A Refrigerant',
    verified: true,
    sample: true,
  },
  {
    id: 'r4',
    rating: 4,
    title: 'Great pergola, plan for two people',
    body: 'No complaints about the product at all — powder coat is thick and it has not moved in two storms. Docking a star only because the instructions imply one person can do it and that is optimistic. Support answered the phone when I called about a bracket.',
    author: 'Priya N.',
    location: 'Boise, ID',
    date: '2026-07-15',
    product: '14x10 Ashland Pergola',
    verified: true,
    sample: true,
  },
  {
    id: 'r5',
    rating: 5,
    title: 'Return was actually painless',
    body: 'Ordered the wrong size greenhouse, entirely my fault. Emailed them, got return instructions the same day, and the refund landed before the end of the week. No restocking fee, exactly like the policy says.',
    author: 'Ellen K.',
    location: 'Asheville, NC',
    date: '2026-06-30',
    product: 'Bellerose Greenhouse',
    verified: true,
    sample: true,
  },
  {
    id: 'r6',
    rating: 5,
    title: 'Second order, same experience',
    body: 'Bought a grill gazebo last spring and came back for the outdoor kitchen cabinets. Same fast shipping, same solid packaging. It is rare to find a supplier that stays consistent.',
    author: 'Tom B.',
    location: 'Lincoln, NE',
    date: '2026-06-11',
    product: 'Saxony XL Grill Gazebo',
    verified: true,
    sample: true,
  },
];

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
