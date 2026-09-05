import ReviewStars from './ReviewStars';
import { TrustpilotStars } from './TrustpilotSection';
import { reviewStats } from '@/content/reviews';
import { trustpilot } from '@/lib/trustpilot';

/**
 * Star rating for the product buy box.
 *
 * Trustpilot's own widget takes over once a business unit id is set; until
 * then this renders the same score from the self-hosted reviews so the buy box
 * is never missing its rating line. Anchors down to the review list on the
 * same page rather than sending the shopper somewhere else mid-purchase.
 */
export default function ProductRating({ className }: { className?: string }) {
  if (trustpilot.enabled) return <TrustpilotStars className={className} />;
  if (!reviewStats) return null;

  const { average, count } = reviewStats;

  return (
    <div className={`flex flex-wrap items-center gap-x-3 gap-y-1.5 ${className ?? ''}`}>
      <ReviewStars rating={average} size={20} label={`${average} out of 5 stars`} />
      <p className="text-[13.5px] text-ink-soft">
        <span className="font-bold text-ink">{average}</span>
        <span className="text-ink-muted"> out of 5</span>
        <span className="text-ink-muted"> · </span>
        <a
          href="#reviews"
          className="font-semibold text-moss-700 underline underline-offset-2 hover:text-moss-800"
        >
          {count} {count === 1 ? 'review' : 'reviews'}
        </a>
      </p>
    </div>
  );
}
