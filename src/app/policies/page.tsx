import type { Metadata } from 'next';
import Link from 'next/link';
import Breadcrumbs from '@/components/Breadcrumbs';
import { policies } from '@/content/policies';
import { site } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Store Policies',
  description: `Shipping, returns, warranty, payment security, privacy and terms for ${site.name}. Every policy that governs an order placed on ${site.domain}, in one place.`,
  alternates: { canonical: '/policies' },
};

export default function PoliciesIndexPage() {
  return (
    <div className="container-page pb-16">
      <Breadcrumbs trail={[{ name: 'Policies', url: '/policies' }]} />

      <header className="max-w-3xl pb-10">
        <h1 className="font-display text-[34px] leading-[1.1] tracking-tight sm:text-[44px]">
          Store policies
        </h1>
        <p className="mt-3 text-[16px] leading-relaxed text-ink-soft">
          Everything that governs an order placed on {site.domain} — what shipping costs, how
          long you have to change your mind, what the warranty covers, and how your payment
          and personal data are handled. Written in plain language, with no clause buried in
          a footnote.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {policies.map((p) => (
          <Link
            key={p.slug}
            href={`/policies/${p.slug}`}
            className="group rounded-2xl border border-ink/10 bg-white p-6 shadow-card transition-shadow hover:shadow-lift"
          >
            <h2 className="font-display text-[21px] tracking-tight group-hover:text-moss-700">
              {p.title}
            </h2>
            <p className="mt-2 text-[14.5px] leading-relaxed text-ink-soft">{p.summary}</p>
            <p className="mt-4 text-[13px] font-semibold text-moss-700">Read policy →</p>
          </Link>
        ))}
      </div>

      <section className="mt-12 rounded-2xl bg-sand p-8">
        <h2 className="font-display text-[24px] tracking-tight">The short version</h2>
        <dl className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['Shipping', 'Free standard shipping on every order, no minimum. Ships in 1 business day.'],
            ['Returns', `${site.returns.windowDays} days from delivery, defective or not. No restocking fees.`],
            ['Warranty', `${site.warranty.label} on everything we sell.`],
            ['Payments', 'Visa, Mastercard, Amex and Discover, processed on an encrypted PCI DSS checkout.'],
          ].map(([term, desc]) => (
            <div key={term}>
              <dt className="text-[15px] font-semibold text-ink">{term}</dt>
              <dd className="mt-1 text-[14px] leading-relaxed text-ink-soft">{desc}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
