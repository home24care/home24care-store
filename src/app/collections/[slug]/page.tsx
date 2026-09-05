import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ProductCard from '@/components/ProductCard';
import { ProductGrid } from '@/components/Section';
import CollectionToolbar from '@/components/CollectionToolbar';
import Breadcrumbs from '@/components/Breadcrumbs';
import JsonLd from '@/components/JsonLd';
import { itemListSchema } from '@/lib/schema';
import { collections, getCollection, productsIn, discountPct, type Product } from '@/lib/catalog';
import { getVirtualCollection, virtualCollections } from '@/lib/virtual-collections';
import { formatPrice } from '@/lib/format';
import { site } from '@/lib/site';

type Params = { slug: string };
type Search = { sort?: string; stock?: string };

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

const sortItems = (items: Product[], sort?: string) => {
  const list = [...items];
  switch (sort) {
    case 'price-asc':
      return list.sort((a, b) => a.price - b.price);
    case 'price-desc':
      return list.sort((a, b) => b.price - a.price);
    case 'discount':
      return list.sort((a, b) => discountPct(b) - discountPct(a));
    case 'name':
      return list.sort((a, b) => a.title.localeCompare(b.title));
    default:
      // "Featured": in stock first, then discounted, then alphabetical.
      return list.sort(
        (a, b) =>
          Number(b.available) - Number(a.available) ||
          discountPct(b) - discountPct(a) ||
          a.title.localeCompare(b.title)
      );
  }
};

export default async function CollectionPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<Search>;
}) {
  const { slug } = await params;
  const { sort, stock } = await searchParams;

  const data = resolve(slug);
  if (!data) notFound();

  const filtered = stock === 'in' ? data.items.filter((p) => p.available) : data.items;
  const items = sortItems(filtered, sort);
  const prices = data.items.map((p) => p.price);

  return (
    <div className="container-page">
      <Breadcrumbs
        trail={[
          { name: 'Collections', url: '/collections' },
          { name: data.title, url: `/collections/${slug}` },
        ]}
      />
      <JsonLd data={itemListSchema(items, data.title, `/collections/${slug}`)} />

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

      <CollectionToolbar total={data.items.length} showing={items.length} />

      {items.length === 0 ? (
        <p className="py-16 text-center text-ink-muted">
          Nothing matches that filter right now. Try clearing “In stock only”.
        </p>
      ) : (
        <ProductGrid>
          {items.map((p, i) => (
            <ProductCard key={p.id} product={p} priority={i < 4} />
          ))}
        </ProductGrid>
      )}

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
