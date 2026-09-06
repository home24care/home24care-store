import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ProductGallery from '@/components/ProductGallery';
import AddToCartButton from '@/components/AddToCartButton';
import ProductCard from '@/components/ProductCard';
import Breadcrumbs from '@/components/Breadcrumbs';
import JsonLd from '@/components/JsonLd';
import { SectionHeading, ProductGrid } from '@/components/Section';
import { TrustpilotProductReviews } from '@/components/TrustpilotSection';
import ProductRating from '@/components/ProductRating';
import ProductViewTracker from '@/components/ProductViewTracker';
import ProductReviews from '@/components/ProductReviews';
import { productSchema } from '@/lib/schema';
import {
  products,
  getProduct,
  getCollection,
  relatedTo,
  discountPct,
} from '@/lib/catalog';
import { formatPrice } from '@/lib/format';
import { site } from '@/lib/site';
import {
  TruckIcon,
  ReturnIcon,
  ShieldIcon,
  LockIcon,
  CheckIcon,
  PhoneIcon,
} from '@/components/icons';

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) return {};

  const description =
    product.excerpt ||
    `${product.title} from ${site.name}. ${formatPrice(product.price)} with free standard shipping and ${site.returns.windowDays}-day returns.`;

  return {
    title: product.title,
    description: description.slice(0, 300),
    alternates: { canonical: `/products/${slug}` },
    openGraph: {
      type: 'website',
      title: `${product.title} | ${site.name}`,
      description: description.slice(0, 300),
      url: `/products/${slug}`,
      images: product.images.slice(0, 3).map((i) => ({ url: i.full, alt: i.alt })),
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();

  const collection = getCollection(product.collection);
  const related = relatedTo(product, 4);
  const off = discountPct(product);
  const paragraphs = product.description.split('\n').filter(Boolean);

  return (
    <div className="container-page">
      <JsonLd data={productSchema(product)} />
      <ProductViewTracker slug={product.slug} />
      <Breadcrumbs
        trail={[
          { name: 'Collections', url: '/collections' },
          ...(collection
            ? [{ name: collection.title, url: `/collections/${collection.slug}` }]
            : []),
          { name: product.title, url: `/products/${product.slug}` },
        ]}
      />

      <div className="grid gap-10 pb-14 lg:grid-cols-[minmax(0,1fr)_440px] lg:gap-14">
        <ProductGallery images={product.images} title={product.title} />

        <div className="lg:sticky lg:top-28 lg:self-start">
          <p className="eyebrow">{product.brand}</p>
          <h1 className="mt-2 font-display text-[30px] leading-[1.15] tracking-tight sm:text-[36px]">
            {product.title}
          </h1>

          <ProductRating className="mt-3" />

          <div className="mt-4 flex flex-wrap items-baseline gap-3">
            <span className="text-[30px] font-bold tabular-nums">
              {formatPrice(product.price)}
            </span>
            {product.compareAtPrice && (
              <>
                <span className="text-[17px] text-ink-muted line-through tabular-nums">
                  {formatPrice(product.compareAtPrice)}
                </span>
                <span className="rounded-full bg-clay-100 px-2.5 py-1 text-[12px] font-bold uppercase tracking-wide text-clay-800">
                  Save {off}% · {formatPrice(product.compareAtPrice - product.price)} off
                </span>
              </>
            )}
          </div>
          <p className="mt-1.5 text-[13px] text-ink-muted">
            SKU {product.sku} · Taxes calculated at checkout
          </p>


          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13.5px]">
            <span
              className={`flex items-center gap-1.5 font-semibold ${
                product.available ? 'text-moss-700' : 'text-ink-muted'
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  product.available ? 'bg-moss-500' : 'bg-ink-muted'
                }`}
                aria-hidden="true"
              />
              {product.available
                ? product.preorder
                  ? 'Available to pre-order'
                  : 'In stock, ready to ship'
                : 'Currently unavailable'}
            </span>
            <span className="flex items-center gap-1.5 text-moss-700">
              <TruckIcon className="h-4 w-4" />
              Free standard shipping
            </span>
          </div>

          <div className="mt-6">
            <AddToCartButton product={product} variant="primary" showQuantity />
          </div>

          <p className="mt-3 flex items-center justify-center gap-1.5 text-[12.5px] text-ink-muted">
            <LockIcon className="h-3.5 w-3.5" />
            Secure checkout · Visa, Mastercard, Amex, Discover
          </p>

          {/* Purchase reassurance — the three questions people ask before buying. */}
          <dl className="mt-7 divide-y divide-ink/10 border-y border-ink/10">
            {[
              [
                TruckIcon,
                'Delivery',
                `Ships in ${site.shipping.handlingTime}, arrives in ${site.shipping.transitTime}. Order before ${site.shipping.cutOff} to ship the next business day.`,
              ],
              [
                ReturnIcon,
                'Returns',
                `${site.returns.windowDays} days from delivery, defective or not. No restocking fee. Approved refunds land within ${site.returns.refundBusinessDays} business days.`,
              ],
              [
                ShieldIcon,
                'Warranty',
                `${site.warranty.label} against manufacturing defects under normal use conditions — or the manufacturer's term where that is longer.`,
              ],
            ].map(([Icon, term, desc]) => {
              const I = Icon as typeof TruckIcon;
              return (
                <div key={term as string} className="flex gap-3 py-3.5">
                  <I className="mt-0.5 h-5 w-5 shrink-0 text-moss-600" />
                  <div>
                    <dt className="text-[14px] font-semibold">{term as string}</dt>
                    <dd className="mt-0.5 text-[13.5px] leading-relaxed text-ink-muted">
                      {desc as string}
                    </dd>
                  </div>
                </div>
              );
            })}
          </dl>

          {product.regulated && (
            <div className="mt-5 rounded-xl border border-clay-200 bg-clay-50 p-4 text-[13px] leading-relaxed text-clay-900">
              <p className="font-semibold">Certification required</p>
              <p className="mt-1">
                This refrigerant may be sold only to buyers certified under Section 608 or
                609 of the U.S. Clean Air Act. By ordering you confirm you hold the
                certification your purchase requires and will handle, charge and recover the
                product in line with EPA regulations. Ships ground only — no air freight.
              </p>
            </div>
          )}

          <p className="mt-5 flex items-center gap-2 text-[13.5px] text-ink-soft">
            <PhoneIcon className="h-4 w-4 text-moss-600" />
            Questions before you order? Call{' '}
            <a
              href={`tel:${site.contact.phoneHref}`}
              className="font-semibold text-moss-700 underline underline-offset-2"
            >
              {site.contact.phone}
            </a>
          </p>
        </div>
      </div>

      {/* ------------------------------------------------------- Description */}
      <section className="grid gap-10 border-t border-ink/10 py-12 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <h2 className="font-display text-[26px] tracking-tight">Product details</h2>
          <div className="prose-policy mt-4 max-w-2xl">
            {paragraphs.length > 0 ? (
              paragraphs.map((p, i) => <p key={i}>{p}</p>)
            ) : (
              <p>
                {product.title} from {product.brand}, sold and shipped by {site.name} with free
                standard shipping.
              </p>
            )}
          </div>
        </div>

        <aside>
          <h2 className="font-display text-[26px] tracking-tight">At a glance</h2>
          <dl className="mt-4 divide-y divide-ink/10 border-y border-ink/10 text-[14px]">
            {[
              ['Brand', product.brand],
              ['Category', collection?.title ?? product.productType],
              ['SKU', product.sku],
              ['Condition', 'New'],
              ['Shipping', 'Free standard shipping (US)'],
              ['Warranty', site.warranty.label],
            ].map(([term, desc]) => (
              <div key={term} className="flex justify-between gap-4 py-2.5">
                <dt className="text-ink-muted">{term}</dt>
                <dd className="text-right font-medium">{desc}</dd>
              </div>
            ))}
          </dl>

          {product.highlights.length > 0 && (
            <>
              <h3 className="mt-8 text-[15px] font-semibold">Highlights</h3>
              <ul className="mt-3 space-y-2.5">
                {product.highlights.slice(0, 4).map((h, i) => (
                  <li key={i} className="flex gap-2.5 text-[14px] leading-relaxed text-ink-soft">
                    <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-moss-600" />
                    {h}
                  </li>
                ))}
              </ul>
            </>
          )}

          <div className="mt-8 rounded-xl bg-sand p-5 text-[13.5px] leading-relaxed text-ink-soft">
            <p className="font-semibold text-ink">Not sure it will fit?</p>
            <p className="mt-1">
              Send us your yard measurements and we will tell you honestly whether this is the
              right size before you order.
            </p>
            <Link href="/contact" className="mt-3 inline-block font-semibold text-moss-700 underline underline-offset-2">
              Ask a question →
            </Link>
          </div>
        </aside>
      </section>

      <TrustpilotProductReviews sku={product.sku} />
      <ProductReviews />

      {related.length > 0 && (
        <section className="border-t border-ink/10 py-12">
          <SectionHeading
            title="You might also like"
            href={collection ? `/collections/${collection.slug}` : '/collections'}
            linkLabel={collection ? `All ${collection.title.toLowerCase()}` : 'All collections'}
          />
          <ProductGrid>
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </ProductGrid>
        </section>
      )}
    </div>
  );
}
