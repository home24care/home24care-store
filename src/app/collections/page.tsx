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
  description: `Shop every category at ${site.name} — football, basketball, baseball, soccer and UFC hobby boxes, plus Pokémon TCG and Magic: The Gathering. Factory sealed, free U.S. shipping.`,
  alternates: { canonical: '/collections' },
};

export default function CollectionsPage() {
  const groups = collectionGroups();

  return (
    <div className="container-page">
      <Breadcrumbs trail={[{ name: 'Collections', url: '/collections' }]} />

      <header className="max-w-3xl pb-10">
        <h1 className="font-display text-[34px] uppercase leading-[1.1] tracking-[0.02em] sm:text-[42px]">
          Shop all categories
        </h1>
        <p className="mt-3 text-[15.5px] leading-relaxed text-ink-soft">
          Sealed sports-card hobby boxes and trading card games, all factory sealed, 100%
          authentic and shipped free — with {site.returns.windowDays}-day returns on unopened
          product.
        </p>
      </header>

      {groups.map((group) => (
        <section key={group.group} className="mb-14">
          <h2 className="mb-5 font-display text-[22px] uppercase tracking-[0.03em]">{group.group}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {group.collections.map((c) => {
              const items = productsIn(c.slug);
              const hero = items.find((p) => p.images.length > 0);
              return (
                <Link
                  key={c.slug}
                  href={`/collections/${c.slug}`}
                  className="group flex gap-4 rounded-md border border-ink/10 bg-white p-4 shadow-card transition-shadow hover:shadow-lift"
                >
                  {hero && (
                    <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-md bg-white">
                      <Image
                        src={hero.images[0].thumb}
                        alt=""
                        fill
                        sizes="96px"
                        quality={75}
                        loading="lazy"
                        unoptimized={IMAGES_LOCALIZED}
                        className="object-contain p-1 transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                  )}
                  <div className="min-w-0">
                    <h3 className="text-[16px] font-semibold group-hover:text-moss-500">
                      {c.title}
                    </h3>
                    <p className="mt-1 line-clamp-2 text-[13.5px] leading-snug text-ink-muted">
                      {c.tagline}
                    </p>
                    {items.length > 0 && (
                      <p className="mt-2 text-[13px] font-medium text-moss-500">
                        {c.count} {c.count === 1 ? 'product' : 'products'} · from{' '}
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
        <h2 className="mb-5 font-display text-[22px] uppercase tracking-[0.03em]">Ways to shop</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {virtualCollections.filter((c) => c.select().length > 0).map((c) => (
            <Link
              key={c.slug}
              href={`/collections/${c.slug}`}
              className="rounded-md border border-ink/10 bg-sand p-6 transition-colors hover:border-moss-400 hover:bg-moss-50"
            >
              <h3 className="text-[17px] font-semibold">{c.title}</h3>
              <p className="mt-1 text-[13.5px] text-ink-muted">{c.tagline}</p>
              <span className="mt-3 block text-[13px] font-semibold text-moss-500">Shop →</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
