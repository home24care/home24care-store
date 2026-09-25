import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import Breadcrumbs from '@/components/Breadcrumbs';
import { collectionGroups, productsIn } from '@/lib/catalog';
import { virtualCollections } from '@/lib/virtual-collections';
import { formatPrice } from '@/lib/format';
import { site } from '@/lib/site';
import { IMAGES_LOCALIZED } from '@/lib/image';

export const metadata: Metadata = {
  title: 'All Collections',
  description: `Browse every refrigerant range at ${site.name} — HVAC, commercial, specialty and legacy gases, bulk pallets and service supplies. Free standard shipping on every order.`,
  alternates: { canonical: '/collections' },
};

export default function CollectionsPage() {
  const groups = collectionGroups();

  return (
    <div className="container-page">
      <Breadcrumbs trail={[{ name: 'Collections', url: '/collections' }]} />

      <header className="max-w-3xl pb-10">
        <h1 className="font-display text-[34px] leading-[1.1] tracking-tight sm:text-[44px]">
          All collections
        </h1>
        <p className="mt-3 text-[15.5px] leading-relaxed text-ink-soft">
          Two departments, one checkout. Outdoor structures for the yard, and factory-sealed
          refrigerants for the trade — both with free standard shipping and{' '}
          {site.returns.windowDays}-day returns.
        </p>
      </header>

      {groups.map((group) => (
        <section key={group.group} className="mb-14">
          <h2 className="mb-5 font-display text-[26px] tracking-tight">{group.group}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {group.collections.map((c) => {
              const items = productsIn(c.slug);
              const hero = items.find((p) => p.images.length > 0);
              return (
                <Link
                  key={c.slug}
                  href={`/collections/${c.slug}`}
                  className="group flex gap-4 rounded-2xl border border-ink/10 bg-white p-4 shadow-card transition-shadow hover:shadow-lift"
                >
                  {hero && (
                    <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-sand">
                      <Image
                        src={hero.images[0].thumb}
                        alt=""
                        fill
                        sizes="96px"
                        quality={75}
                        loading="lazy"
                        unoptimized={IMAGES_LOCALIZED}
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                  )}
                  <div className="min-w-0">
                    <h3 className="text-[16px] font-semibold group-hover:text-moss-700">
                      {c.title}
                    </h3>
                    <p className="mt-1 line-clamp-2 text-[13.5px] leading-snug text-ink-muted">
                      {c.tagline}
                    </p>
                    {items.length > 0 && (
                      <p className="mt-2 text-[13px] font-medium text-moss-700">
                        {c.count} products · from{' '}
                        {formatPrice(Math.min(...items.map((p) => p.price)))}
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      ))}

      <section className="mb-6">
        <h2 className="mb-5 font-display text-[26px] tracking-tight">Ways to shop</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {virtualCollections.map((c) => (
            <Link
              key={c.slug}
              href={`/collections/${c.slug}`}
              className="rounded-2xl border border-ink/10 bg-sand p-6 transition-colors hover:border-moss-400 hover:bg-moss-50"
            >
              <h3 className="text-[17px] font-semibold">{c.title}</h3>
              <p className="mt-1 text-[13.5px] text-ink-muted">{c.tagline}</p>
              <span className="mt-3 block text-[13px] font-semibold text-moss-700">Shop →</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
