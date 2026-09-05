import type { Metadata } from 'next';
import Link from 'next/link';
import Breadcrumbs from '@/components/Breadcrumbs';
import JsonLd from '@/components/JsonLd';
import { faqSchema } from '@/lib/schema';
import { faqGroups, allFaqs } from '@/content/faqs';
import { site } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Frequently Asked Questions',
  description: `Answers on shipping, returns, refunds, payment security, warranty and refrigerant certification at ${site.name}.`,
  alternates: { canonical: '/faq' },
};

export default function FaqPage() {
  return (
    <div className="container-page pb-16">
      <JsonLd data={faqSchema(allFaqs)} />
      <Breadcrumbs trail={[{ name: 'FAQs', url: '/faq' }]} />

      <header className="max-w-3xl pb-10">
        <p className="eyebrow mb-2">Help centre</p>
        <h1 className="font-display text-[36px] leading-[1.08] tracking-tight sm:text-[46px]">
          Frequently asked questions
        </h1>
        <p className="mt-4 text-[17px] leading-relaxed text-ink-soft">
          The questions we get most, answered properly. If yours is not here, call{' '}
          <a href={`tel:${site.contact.phoneHref}`} className="font-semibold text-moss-700 underline underline-offset-2">
            {site.contact.phone}
          </a>{' '}
          or email{' '}
          <a href={`mailto:${site.contact.email}`} className="font-semibold text-moss-700 underline underline-offset-2">
            {site.contact.email}
          </a>
          .
        </p>
      </header>

      <div className="grid gap-12 lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-16">
        <nav aria-label="FAQ sections" className="lg:sticky lg:top-28 lg:self-start">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.16em] text-ink-muted">
            Jump to
          </h2>
          <ul className="mt-3 space-y-1.5">
            {faqGroups.map((g) => (
              <li key={g.title}>
                <a
                  href={`#${g.title.toLowerCase().replace(/[^a-z]+/g, '-')}`}
                  className="block rounded-lg px-3 py-1.5 text-[13.5px] text-ink-soft hover:bg-moss-50 hover:text-moss-800"
                >
                  {g.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="min-w-0 max-w-3xl">
          {faqGroups.map((group) => (
            <section
              key={group.title}
              id={group.title.toLowerCase().replace(/[^a-z]+/g, '-')}
              className="mb-12 scroll-mt-28"
            >
              <h2 className="font-display text-[26px] tracking-tight">{group.title}</h2>
              <dl className="mt-4 divide-y divide-ink/10 border-y border-ink/10">
                {group.faqs.map((f) => (
                  <div key={f.q} className="py-5">
                    <dt className="text-[16px] font-semibold leading-snug text-ink">{f.q}</dt>
                    <dd className="mt-2 text-[15px] leading-relaxed text-ink-soft">{f.a}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}

          <div className="rounded-2xl bg-sand p-7">
            <h2 className="font-display text-[22px] tracking-tight">Read the full policies</h2>
            <p className="mt-2 text-[14.5px] leading-relaxed text-ink-soft">
              These answers summarise our policies. The complete terms are on the policy pages.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {[
                ['/policies/shipping', 'Shipping'],
                ['/policies/returns', 'Refunds & Returns'],
                ['/policies/warranty', 'Warranty'],
                ['/policies/payment-security', 'Payment security'],
                ['/policies/privacy', 'Privacy'],
                ['/policies/terms', 'Terms'],
              ].map(([href, label]) => (
                <Link
                  key={href}
                  href={href}
                  className="rounded-full border border-ink/15 bg-white px-4 py-2 text-[13.5px] font-medium text-ink-soft transition-colors hover:border-moss-500 hover:text-moss-800"
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
