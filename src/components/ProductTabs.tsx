'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { DescriptionBlock } from '@/lib/catalog';

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
}: {
  blocks: DescriptionBlock[];
  shipping: string[];
  returnsSummary: string;
}) {
  const tabs: Tab[] = [
    { key: 'description', label: 'Description' },
    { key: 'shipping', label: 'Shipping & Returns' },
    { key: 'reviews', label: 'Reviews (0)' },
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
            <p>There are no reviews yet. Bought this box from us? We would love to hear how your break went — email us and we will add your review.</p>
          </>
        )}
      </div>
    </section>
  );
}
