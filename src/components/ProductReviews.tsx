import ReviewStars from './ReviewStars';
import { SectionHeading } from './Section';
import { reviews, reviewStats, hasSampleReviews } from '@/content/reviews';
import { trustpilot } from '@/lib/trustpilot';
import { CheckIcon } from './icons';

const TRUSTPILOT_GREEN = '#00b67a';

const formatDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });

/**
 * Store-wide reviews shown on a product page, as the fallback for Trustpilot's
 * SKU-scoped widget.
 *
 * These are reviews of the store, not of this product — the heading says so
 * explicitly. Implying that six store reviews are six reviews of the item in
 * front of the shopper would be misleading, and it is exactly the kind of thing
 * Merchant Center treats as misrepresentation.
 */
export default function ProductReviews() {
  if (trustpilot.enabled) return null;
  if (!reviewStats || reviews.length === 0) return null;

  const { average, count } = reviewStats;

  return (
    <section id="reviews" className="scroll-mt-28 border-t border-ink/10 py-12">
      <SectionHeading
        eyebrow="Customer reviews"
        title="What people say about buying from us"
        subtitle={`${average} out of 5 from ${count} store ${
          count === 1 ? 'review' : 'reviews'
        }. These cover the buying experience across our catalog, not this product alone.`}
      />

      {hasSampleReviews && process.env.NODE_ENV !== 'production' && (
        <p className="mb-6 rounded-xl border border-clay-300 bg-clay-50 px-4 py-3 text-[13px] leading-relaxed text-clay-900">
          <strong className="font-semibold">Sample content (development only).</strong>{' '}
          Placeholders from <code>src/content/reviews.ts</code>.
        </p>
      )}

      <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {reviews.slice(0, 3).map((review) => (
          <li
            key={review.id}
            className="flex flex-col rounded-2xl border border-ink/10 bg-white p-5 shadow-card"
          >
            <div className="flex items-center justify-between gap-3">
              <ReviewStars
                rating={review.rating}
                size={18}
                label={`${review.rating} out of 5 stars`}
              />
              <time dateTime={review.date} className="shrink-0 text-[12px] text-ink-muted">
                {formatDate(review.date)}
              </time>
            </div>

            <h3 className="mt-3 text-[15px] font-semibold leading-snug text-ink">
              {review.title}
            </h3>
            <p className="mt-1.5 flex-1 text-[14px] leading-relaxed text-ink-soft">
              {review.body}
            </p>

            <footer className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-ink/10 pt-3 text-[13px]">
              <span className="font-semibold text-ink">{review.author}</span>
              <span className="text-ink-muted">· {review.location}</span>
              {review.verified && (
                <span
                  className="inline-flex items-center gap-1 text-[12px] font-semibold"
                  style={{ color: TRUSTPILOT_GREEN }}
                >
                  <CheckIcon className="h-3.5 w-3.5" />
                  Verified order
                </span>
              )}
            </footer>
          </li>
        ))}
      </ul>
    </section>
  );
}
