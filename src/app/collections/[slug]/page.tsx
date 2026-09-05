import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ProductCard from '@/components/ProductCard';
import { ProductGrid } from '@/components/Section';
import CollectionSorter from '@/components/CollectionSorter';
import Breadcrumbs from '@/components/Breadcrumbs';
import JsonLd from '@/components/JsonLd';
import { itemListSchema } from '@/lib/schema';
import { collections, getCollection, productsIn, discountPct } from '@/lib/catalog';
import { getVirtualCollection, virtualCollections } from '@/lib/virtual-collections';
import { formatPrice } from '@/lib/format';
import { site } from '@/lib/site';

type Params = { slug: string };

/** Resolves either a real category or a merchandising collection. */
function resolve(slug: string) {
  const real = getCollection(slug);
  if (real) {
    return {
      slug,
      title: real.title,
      tagline: real.tagline,
      description: `Shop ${real.count} ${real.title.toLowerCase()} at ${site.name}. ${real.tagline} Free standard shipping on every order, ${site.returns.windowDays}-day returns and a ${site.warranty.label.toLowerCase()}.`,
      items: productsIn(slug),
    };
  }
  const virtual = getVirtualCollection(slug);
  if (virtual) {
    return {
      slug,
      title: virtual.title,
      tagline: virtual.tagline,
      description: virtual.description,
      items: virtual.select(),
    };
  }
  return null;
}

export function generateStaticParams(): Params[] {
  return [
    ...collections.map((c) => ({ slug: c.slug })),
    ...virtualCollections.map((c) => ({ slug: c.slug })),
  ];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = resolve(slug);
  if (!data) return {};

  return {
    title: data.title,
    description: data.description.slice(0, 300),
    alternates: { canonical: `/collections/${slug}` },
    openGraph: {
      title: `${data.title} | ${site.name}`,
      description: data.description.slice(0, 300),
      url: `/collections/${slug}`,
      images: data.items[0]?.images[0]?.full ? [data.items[0].images[0].full] : undefined,
    },
  };
}

export default async function CollectionPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;

  const data = resolve(slug);
  if (!data) notFound();

  const prices = data.items.map((p) => p.price);

  return (
    <div className="container-page">
      <Breadcrumbs
        trail={[
          { name: 'Collections', url: '/collections' },
          { name: data.title, url: `/collections/${slug}` },
        ]}
      />
      <JsonLd data={itemListSchema(data.items, data.title, `/collections/${slug}`)} />

      <header className="max-w-3xl pb-8">
        <h1 className="font-display text-[34px] leading-[1.1] tracking-tight sm:text-[44px]">
          {data.title}
        </h1>
        <p className="mt-3 text-[15.5px] leading-relaxed text-ink-soft">{data.description}</p>
        {prices.length > 0 && (
          <p className="mt-3 text-[13.5px] text-ink-muted">
            {data.items.length} products from {formatPrice(Math.min(...prices))} to{' '}
            {formatPrice(Math.max(...prices))} · Free standard shipping
          </p>
        )}
      </header>

      {/* No Suspense: CollectionSorter reads the query string from
          window.location after mount rather than through useSearchParams, so
          the cards below are emitted as real server HTML instead of being
          replaced by a Suspense fallback. */}
      <CollectionSorter total={data.items.length}>
        <ProductGrid>
          {data.items.map((p, i) => (
            <div
              key={p.id}
              data-product
              data-price={p.price}
              data-available={p.available ? 1 : 0}
              data-discount={discountPct(p)}
              data-name={p.title}
            >
              <ProductCard product={p} priority={i < 4} />
            </div>
          ))}
        </ProductGrid>
      </CollectionSorter>

      <div className="mt-16 rounded-2xl bg-sand p-8">
        <h2 className="font-display text-[22px] tracking-tight">
          Shipping &amp; returns on {data.title.toLowerCase()}
        </h2>
        <div className="mt-3 grid gap-4 text-[14.5px] leading-relaxed text-ink-soft sm:grid-cols-3">
          <p>
            <strong className="font-semibold text-ink">Free standard shipping.</strong> Orders
            leave our warehouse within {site.shipping.handlingTime} and arrive in{' '}
            {site.shipping.transitTime}.
          </p>
          <p>
            <strong className="font-semibold text-ink">
              {site.returns.windowDays}-day returns.
            </strong>{' '}
            Both defective and non-defective items, with no restocking fee.
          </p>
          <p>
            <strong className="font-semibold text-ink">{site.warranty.label}.</strong> Covers
            manufacturing defects under normal use.
          </p>
        </div>
      </div>
    </div>
  );
}
