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
      description:
        real.description ??
        `Shop factory-sealed ${real.title} products at ${site.name}. ${real.tagline} Free shipping on every order.`,
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

      <header className="mb-10 rounded-md bg-sand px-6 py-10 text-center sm:px-12">
        <p className="eyebrow">{data.tagline.replace(/\.$/, "")}</p>
        <h1 className="mt-2 font-display text-[32px] uppercase leading-[1.1] tracking-[0.02em] sm:text-[42px]">
          {data.title}
        </h1>
        <p className="mx-auto mt-3 max-w-3xl text-[15px] font-medium leading-relaxed text-ink-soft">{data.description}</p>
        {prices.length > 0 && (
          <p className="mt-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-muted">
            {data.items.length} {data.items.length === 1 ? 'product' : 'products'}
            {prices.length > 1 && (
              <>
                {' '}· {formatPrice(Math.min(...prices))} – {formatPrice(Math.max(...prices))}
              </>
            )}{' '}
            · Free shipping
          </p>
        )}
      </header>

      {data.items.length === 0 && (
        <p className="py-10 text-center text-[15px] text-ink-soft">
          Nothing here right now — new drops land often.{' '}
          <a href="/collections" className="font-semibold text-moss-500 underline">Browse all categories</a>.
        </p>
      )}

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

      <div className="mt-16 rounded-md border border-ink/10 p-8">
        <h2 className="font-display text-[20px] uppercase tracking-[0.02em]">
          Buying {data.title} from {site.name}
        </h2>
        <div className="mt-3 grid gap-4 text-[14.5px] leading-relaxed text-ink-soft sm:grid-cols-3">
          <p>
            <strong className="font-semibold text-ink">Free shipping, packed seal-safe.</strong>{' '}
            Orders leave within {site.shipping.handlingTime}, bubble-wrapped in a rigid carton,
            and arrive in {site.shipping.transitTime}.
          </p>
          <p>
            <strong className="font-semibold text-ink">
              {site.returns.windowDays}-day returns.
            </strong>{' '}
            Unopened, factory-sealed product, with no restocking fee.
          </p>
          <p>
            <strong className="font-semibold text-ink">{site.warranty.label}.</strong> Every box
            is genuine and factory sealed, or your money back.
          </p>
        </div>
      </div>
    </div>
  );
}
