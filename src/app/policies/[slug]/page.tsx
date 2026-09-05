import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Breadcrumbs from '@/components/Breadcrumbs';
import PolicyBody from '@/components/PolicyBody';
import { policies, getPolicy } from '@/content/policies';
import { site } from '@/lib/site';
import { PhoneIcon, MailIcon, PinIcon } from '@/components/icons';

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return policies.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const policy = getPolicy(slug);
  if (!policy) return {};

  return {
    title: policy.title,
    description: policy.summary.slice(0, 300),
    alternates: { canonical: `/policies/${slug}` },
    openGraph: {
      title: `${policy.title} | ${site.name}`,
      description: policy.summary.slice(0, 300),
      url: `/policies/${slug}`,
    },
  };
}

export default async function PolicyPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const policy = getPolicy(slug);
  if (!policy) notFound();

  return (
    <div className="container-page pb-16">
      <Breadcrumbs
        trail={[
          { name: 'Policies', url: '/policies' },
          { name: policy.title, url: `/policies/${slug}` },
        ]}
      />

      <div className="grid gap-12 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-16">
        {/* Sidebar: other policies + in-page nav */}
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <nav aria-label="Policies">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.16em] text-ink-muted">
              All policies
            </h2>
            <ul className="mt-3 space-y-1">
              {policies.map((p) => (
                <li key={p.slug}>
                  <Link
                    href={`/policies/${p.slug}`}
                    aria-current={p.slug === slug ? 'page' : undefined}
                    className={`block rounded-lg px-3 py-2 text-[13.5px] transition-colors ${
                      p.slug === slug
                        ? 'bg-moss-50 font-semibold text-moss-800'
                        : 'text-ink-soft hover:bg-moss-50 hover:text-moss-800'
                    }`}
                  >
                    {p.title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="On this page" className="mt-8 hidden lg:block">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.16em] text-ink-muted">
              On this page
            </h2>
            <ul className="mt-3 space-y-1.5 border-l border-ink/10 pl-3">
              {policy.sections.map((s) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className="block text-[13px] leading-snug text-ink-muted hover:text-moss-700"
                  >
                    {s.heading}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        <article className="min-w-0 max-w-3xl">
          <header className="border-b border-ink/10 pb-7">
            <h1 className="font-display text-[34px] leading-[1.1] tracking-tight sm:text-[42px]">
              {policy.title}
            </h1>
            <p className="mt-3 text-[16px] leading-relaxed text-ink-soft">{policy.summary}</p>
            <p className="mt-4 text-[13px] text-ink-muted">
              Last updated {policy.updated} · Applies to all orders placed on {site.domain}
            </p>
          </header>

          <div className="pt-8">
            <PolicyBody sections={policy.sections} />
          </div>

          <footer className="mt-12 rounded-2xl bg-sand p-6">
            <h2 className="font-display text-[20px] tracking-tight">Still need help?</h2>
            <p className="mt-2 text-[14.5px] leading-relaxed text-ink-soft">
              Our team is here {site.contact.hours}. {site.contact.responseTime}
            </p>
            <ul className="mt-4 space-y-2.5 text-[14px]">
              <li>
                <a
                  href={`tel:${site.contact.phoneHref}`}
                  className="flex items-center gap-2.5 font-medium text-ink hover:text-moss-700"
                >
                  <PhoneIcon className="h-4 w-4 text-moss-600" />
                  {site.contact.phone}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${site.contact.email}`}
                  className="flex items-center gap-2.5 font-medium text-ink hover:text-moss-700"
                >
                  <MailIcon className="h-4 w-4 text-moss-600" />
                  {site.contact.email}
                </a>
              </li>
              <li className="flex items-start gap-2.5 text-ink-soft">
                <PinIcon className="mt-0.5 h-4 w-4 shrink-0 text-moss-600" />
                {site.address.formatted}
              </li>
            </ul>
            <Link href="/contact" className="btn-primary mt-5">
              Contact us
            </Link>
          </footer>
        </article>
      </div>
    </div>
  );
}
