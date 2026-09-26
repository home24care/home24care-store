'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { DescriptionBlock } from '@/lib/catalog';
import type { ProductReview } from '@/content/product-reviews';
import ReviewStars from './ReviewStars';

type Tab = { key: string; label: string };

/**
 * Checklist lines arrive as "Label: – Item – Item – Item". Split them into a
 * bold label and a dotted list so a 30-parallel rainbow stays readable.
 */
function ChecklistLine({ text }: { text: string }) {
  const parts = text.split(/\s[–-]\s/).map((s) => s.trim()).filter(Boolean);
  if (parts.length < 3) return <p>{text}</p>;
  const [label, ...items] = parts;
  return (
    <p>
      <strong>{label.replace(/:$/, '')}</strong>
      <span className="text-ink-muted"> — </span>
      {items.join(' · ')}
    </p>
  );
}

export default function ProductTabs({
  blocks,
  shipping,
  returnsSummary,
  reviews,
}: {
  blocks: DescriptionBlock[];
  shipping: string[];
  returnsSummary: string;
  reviews: ProductReview[];
}) {
  const tabs: Tab[] = [
    { key: 'description', label: 'Description' },
    { key: 'shipping', label: 'Shipping & Returns' },
    { key: 'reviews', label: `Reviews (${reviews.length})` },
  ];
  const [active, setActive] = useState('description');

  return (
    <section className="border-t border-ink/10">
      <div role="tablist" aria-label="Product information" className="no-scrollbar flex gap-6 overflow-x-auto sm:justify-center sm:gap-8">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={active === t.key}
            onClick={() => setActive(t.key)}
            className={`-mt-px whitespace-nowrap border-t-2 px-1 pt-4 font-display text-[14px] uppercase sm:text-[16px] tracking-[0.04em] transition-colors ${
              active === t.key ? 'border-moss-400 text-ink' : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div role="tabpanel" className="prose-policy mx-auto max-w-4xl py-10">
        {active === 'description' &&
          blocks.map((b, i) => {
            if (b.type === 'h2') return <h2 key={i} className="!text-[20px] uppercase tracking-[0.02em]">{b.text}</h2>;
            if (b.type === 'h3') return <h3 key={i}>{b.text}</h3>;
            if (b.type === 'ul')
              return (
                <ul key={i}>
                  {b.items.map((it, j) => (
                    <li key={j}>{it}</li>
                  ))}
                </ul>
              );
            return /\s[–-]\s.*\s[–-]\s/.test(b.text) ? <ChecklistLine key={i} text={b.text} /> : <p key={i}>{b.text}</p>;
          })}

        {active === 'shipping' && (
          <>
            <h2 className="!text-[20px] uppercase tracking-[0.02em]">Shipping</h2>
            <ul>
              {shipping.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
            <h2 className="!text-[20px] uppercase tracking-[0.02em]">Returns</h2>
            <p>{returnsSummary}</p>
            <p>
              Read the full <Link href="/policies/shipping">Shipping Policy</Link>,{' '}
              <Link href="/policies/returns">Refund and Returns Policy</Link> and{' '}
              <Link href="/policies/authenticity">Authenticity Guarantee</Link>.
            </p>
          </>
        )}

        {active === 'reviews' && (
          <>
            <h2 className="!text-[20px] uppercase tracking-[0.02em]">Reviews</h2>
            {reviews.length === 0 ? (
              <p>There are no reviews yet. Bought this box from us? We would love to hear how your break went — email us and we will add your review.</p>
            ) : (
              <ProductReviewList reviews={reviews} />
            )}
          </>
        )}
      </div>
    </section>
  );
}

/** Score summary plus one card per review, in the order they were received. */
function ProductReviewList({ reviews }: { reviews: ProductReview[] }) {
  const average = Math.round((reviews.reduce((n, r) => n + r.rating, 0) / reviews.length) * 10) / 10;
  return (
    <div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-ink/10 pb-5">
        <ReviewStars rating={average} size={24} label={`${average} out of 5 stars`} />
        <span className="text-[15px] text-ink-soft">
          <strong className="font-bold text-ink">{average.toFixed(1)}</strong> out of 5 · based on{' '}
          {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
        </span>
      </div>
      <ul className="!mb-0 mt-6 grid !list-none gap-4 !space-y-0 !pl-0 sm:grid-cols-2">
        {reviews.map((r) => (
          <li key={r.author + r.body.slice(0, 24)} className="flex flex-col rounded-md border border-ink/10 bg-white p-5">
            <div className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sand font-semibold text-ink"
              >
                {r.author.charAt(0)}
              </span>
              <span className="font-semibold text-ink">{r.author}</span>
            </div>
            <ReviewStars rating={r.rating} size={18} label={`${r.rating} out of 5 stars`} className="mt-3" />
            <p className="!mb-0 mt-2.5 flex-1 text-[14.5px] leading-relaxed text-ink-soft">{r.body}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
