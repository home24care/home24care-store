import Link from 'next/link';
import ReviewStars from './ReviewStars';
import { reviews, reviewStats, hasSampleReviews } from '@/content/reviews';
import { trustpilot } from '@/lib/trustpilot';
import { site } from '@/lib/site';
import { CheckIcon } from './icons';

const TRUSTPILOT_GREEN = '#00b67a';

const SCORE_WORD = (n: number) =>
  n >= 4.75 ? 'Excellent' : n >= 4 ? 'Great' : n >= 3 ? 'Average' : n >= 2 ? 'Poor' : 'Bad';

const formatDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });

/** The Trustpilot star mark, used as the section's source badge. */
function TrustpilotMark({ className }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 ${className ?? ''}`}>
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill={TRUSTPILOT_GREEN} aria-hidden="true">
        <path d="m12 2 2.9 6.3L22 9.2l-5.2 4.8 1.35 6.9L12 17.6 5.85 20.9 7.2 14 2 9.2l7.1-.9z" />
      </svg>
      <span className="text-[13px] font-bold tracking-tight text-ink">Trustpilot</span>
    </span>
  );
}

export default function ReviewsSection() {
  // The real Trustpilot widget owns this slot once it is configured — see
  // TrustpilotReviews on the homepage. This section is the fallback.
  if (trustpilot.enabled) return null;
  if (!reviewStats || reviews.length === 0) return null;

  const { average, count, distribution } = reviewStats;

  return (
    <section className="border-y border-ink/10 bg-sand py-16">
      <div className="container-page">
        {/* Sample-content notice. Never rendered in production. */}
        {hasSampleReviews && process.env.NODE_ENV !== 'production' && (
          <p className="mb-6 rounded-xl border border-clay-300 bg-clay-50 px-4 py-3 text-[13px] leading-relaxed text-clay-900">
            <strong className="font-semibold">Sample content (development only).</strong>{' '}
            These reviews are placeholders from <code>src/content/reviews.ts</code>. Replace
            them with real reviews, or set a Trustpilot business unit id, before taking
            orders. Rating structured data stays off until you do.
          </p>
        )}

        <div className="grid gap-10 lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-14">
          {/* ------------------------------------------------ Score summary */}
          <div className="lg:sticky lg:top-28 lg:self-start">
            <p className="eyebrow mb-2">Customer reviews</p>
            <h2 className="font-display text-[30px] leading-[1.12] tracking-tight sm:text-[34px]">
              {SCORE_WORD(average)}
            </h2>

            <div className="mt-4 flex items-center gap-3">
              <ReviewStars rating={average} size={26} label={`${average} out of 5 stars`} />
            </div>

            <p className="mt-3 text-[15px] text-ink-soft">
              <span className="font-bold text-ink">{average}</span> out of 5, based on{' '}
              <span className="font-bold text-ink">{count}</span>{' '}
              {count === 1 ? 'review' : 'reviews'}
            </p>

            {/* Rating distribution */}
            <dl className="mt-6 space-y-1.5">
              {distribution.map(({ star, count: n }) => {
                const pct = count > 0 ? Math.round((n / count) * 100) : 0;
                return (
                  <div key={star} className="flex items-center gap-3 text-[13px]">
                    <dt className="w-12 shrink-0 text-ink-muted">{star}-star</dt>
                    <dd className="flex flex-1 items-center gap-2">
                      <span className="h-2 flex-1 overflow-hidden rounded-full bg-ink/10">
                        <span
                          style={{ width: `${pct}%`, background: TRUSTPILOT_GREEN }}
                          className="block h-full rounded-full"
                        />
                      </span>
                      <span className="w-9 shrink-0 text-right tabular-nums text-ink-muted">
                        {pct}%
                      </span>
                    </dd>
                  </div>
                );
              })}
            </dl>

            {/*
              These reviews are served from our own site, so the copy must not
              claim Trustpilot collected them — that would be false. The
              Trustpilot link is an invitation to review, nothing more. Once a
              business unit id is set this whole section is replaced by the real
              widget, which does carry Trustpilot's attribution.
            */}
            <div className="mt-6 border-t border-ink/10 pt-5">
              <p className="text-[12.5px] leading-relaxed text-ink-muted">
                Reviews submitted by customers after a completed order, published
                as written. We do not edit or delete reviews for being critical.
              </p>
              <a
                href={trustpilot.profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-moss-700 underline underline-offset-2 hover:text-moss-800"
              >
                Leave a review on <TrustpilotMark />
              </a>
            </div>
          </div>

          {/* ------------------------------------------------- Review cards */}
          <div>
            <ul className="grid gap-4 sm:grid-cols-2">
              {reviews.map((review) => (
                <li
                  key={review.id}
                  className="flex flex-col rounded-2xl border border-ink/10 bg-white p-5 shadow-card"
                >
                  <div className="flex items-center justify-between gap-3">
                    <ReviewStars
                      rating={review.rating}
                      size={20}
                      label={`${review.rating} out of 5 stars`}
                    />
                    <time
                      dateTime={review.date}
                      className="shrink-0 text-[12px] text-ink-muted"
                    >
                      {formatDate(review.date)}
                    </time>
                  </div>

                  <h3 className="mt-3 text-[15.5px] font-semibold leading-snug text-ink">
                    {review.title}
                  </h3>
                  <p className="mt-1.5 flex-1 text-[14px] leading-relaxed text-ink-soft">
                    {review.body}
                  </p>

                  <footer className="mt-4 border-t border-ink/10 pt-3">
                    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px]">
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
                    </p>
                    {review.product && (
                      <p className="mt-0.5 text-[12.5px] text-ink-muted">
                        Reviewing {review.product}
                      </p>
                    )}
                  </footer>
                </li>
              ))}
            </ul>

            <p className="mt-6 text-[13px] text-ink-muted">
              Reviews are published as written. If something went wrong with your order,
              email{' '}
              <a
                href={`mailto:${site.contact.email}`}
                className="font-semibold text-moss-700 underline underline-offset-2"
              >
                {site.contact.email}
              </a>{' '}
              and we will put it right — see our{' '}
              <Link
                href="/policies/returns"
                className="font-semibold text-moss-700 underline underline-offset-2"
              >
                returns policy
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
