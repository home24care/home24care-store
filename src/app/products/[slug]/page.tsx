import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ProductGallery from '@/components/ProductGallery';
import AddToCartButton from '@/components/AddToCartButton';
import ProductCard from '@/components/ProductCard';
import Breadcrumbs from '@/components/Breadcrumbs';
import JsonLd from '@/components/JsonLd';
import ProductTabs from '@/components/ProductTabs';
import { reviewsFor, reviewsOfOtherProducts } from '@/content/product-reviews';
import { CenteredHeading } from '@/components/StoreBands';
import { TrustpilotProductReviews, TrustpilotStars } from '@/components/TrustpilotSection';
import ProductViewTracker from '@/components/ProductViewTracker';
import PaymentMarks from '@/components/PaymentMarks';
import { productSchema } from '@/lib/schema';
import { feedImage } from '@/lib/image';
import {
  products,
  getProduct,
  getCollection,
  relatedTo,
  discountPct,
  descriptionBlocks,
} from '@/lib/catalog';
import { formatPrice } from '@/lib/format';
import { site } from '@/lib/site';
import { ShieldIcon, BoxIcon, LockIcon, ReturnIcon, PhoneIcon, TruckIcon } from '@/components/icons';

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
    `${product.title} from ${site.name}. ${formatPrice(product.price)} with free shipping.`;

  return {
    title: product.title,
    description: description.slice(0, 300),
    alternates: { canonical: `/products/${slug}` },
    openGraph: {
      type: 'website',
      title: `${product.title} | ${site.name}`,
      description: description.slice(0, 300),
      url: `/products/${slug}`,
      // JPEG copies: Merchant Center and most social crawlers reject WebP.
      images: product.images.slice(0, 3).map((i) => ({ url: feedImage(i.full), alt: i.alt })),
    },
  };
}

const TRUST_BOXES = [
  [ShieldIcon, '100% Authentic', 'Every box genuine and exactly as described'],
  [BoxIcon, 'Factory Sealed', 'Original manufacturer shrink-wrap, never resealed'],
  [LockIcon, 'Secure Payment', 'Verified U.S. business · SSL-encrypted checkout'],
  [ReturnIcon, 'Easy Returns', `${site.returns.windowDays} days on unopened product —`],
] as const;

export default async function ProductPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();

  const collection = getCollection(product.collection);
  const related = relatedTo(product, 4);
  const off = discountPct(product);
  const blocks = descriptionBlocks(product.description);

  return (
    <div className="container-page">
      <JsonLd data={productSchema(product)} />
      <ProductViewTracker slug={product.slug} />

      <div className="grid grid-cols-[minmax(0,1fr)] gap-10 pb-14 pt-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-14">
        <ProductGallery images={product.images} title={product.title} />

        <div className="lg:sticky lg:top-40 lg:self-start">
          <Breadcrumbs
            trail={[
              ...(collection
                ? [{ name: collection.title, url: `/collections/${collection.slug}` }]
                : []),
              { name: product.title, url: `/products/${product.slug}` },
            ]}
          />

          <p className="eyebrow">
            {product.brand}
            {collection ? ` · ${collection.title}` : ''}
          </p>
          <h1 className="mt-2 font-display text-[28px] leading-[1.18] text-ink sm:text-[34px]">
            {product.title}
          </h1>

          <TrustpilotStars className="mt-3" />

          <div className="mt-4 flex flex-wrap gap-2">
            <span
              className={`rounded-full border px-3 py-1 text-[12px] font-semibold ${
                product.available
                  ? 'border-moss-300 bg-moss-50 text-moss-700'
                  : 'border-ink/20 bg-sand text-ink-muted'
              }`}
            >
              {product.available ? (product.preorder ? 'Pre-order' : 'In Stock') : 'Sold Out'}
            </span>
            <span className="rounded-full border border-[#cdbff0] bg-[#f4f0fd] px-3 py-1 text-[12px] font-semibold text-[#5b44a8]">
              Brand New
            </span>
            <span className="rounded-full border border-[#b5dcd6] bg-[#edf8f6] px-3 py-1 text-[12px] font-semibold text-[#2f7468]">
              Free Shipping
            </span>
            {product.badges.map((b) => (
              <span key={b} className="rounded-full border border-clay-200 bg-clay-50 px-3 py-1 text-[12px] font-semibold text-clay-700">
                {b}
              </span>
            ))}
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            {TRUST_BOXES.map(([Icon, title, body]) => (
              <div key={title} className="rounded-lg border border-ink/10 p-3.5">
                <p className="flex items-center gap-2 text-[13.5px] font-bold text-ink">
                  <Icon className="h-4 w-4 text-moss-400" />
                  {title}
                </p>
                <p className="mt-1 text-[12.5px] leading-snug text-ink-muted">
                  {body}
                  {title === 'Easy Returns' && (
                    <>
                      {' '}
                      <Link href="/policies/returns" className="font-semibold text-moss-500 underline underline-offset-2">
                        see policy
                      </Link>
                    </>
                  )}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap items-baseline gap-3">
            <span className="text-[30px] font-bold tabular-nums text-moss-500">
              {formatPrice(product.price)}
            </span>
            {product.compareAtPrice && (
              <>
                <span className="text-[17px] text-ink-muted line-through tabular-nums">
                  {formatPrice(product.compareAtPrice)}
                </span>
                <span className="rounded-sm bg-clay-100 px-2.5 py-1 text-[12px] font-bold uppercase tracking-wide text-clay-800">
                  Save {off}%
                </span>
              </>
            )}
          </div>

          {product.purchaseLimit && (
            <p className="mt-2 text-[13px] font-semibold text-clay-700">
              Limit {product.purchaseLimit} {product.purchaseLimit === 1 ? 'box' : 'boxes'} per customer
            </p>
          )}

          <div className="mt-5">
            <AddToCartButton product={product} variant="primary" showQuantity buyNow />
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <PaymentMarks size="small" />
            <span className="text-[12px] text-ink-muted">Taxes calculated at checkout</span>
          </div>

          <dl className="mt-6 space-y-1.5 border-t border-ink/10 pt-5 text-[13.5px]">
            <div className="flex gap-2">
              <dt className="font-semibold text-ink">SKU:</dt>
              <dd className="text-ink-muted">{product.sku}</dd>
            </div>
            {product.gtin && (
              <div className="flex gap-2">
                <dt className="font-semibold text-ink">UPC:</dt>
                <dd className="text-ink-muted">{product.gtin}</dd>
              </div>
            )}
            <div className="flex gap-2">
              <dt className="font-semibold text-ink">Category:</dt>
              <dd>
                {collection ? (
                  <Link href={`/collections/${collection.slug}`} className="text-moss-500 hover:underline">
                    {collection.title}
                  </Link>
                ) : (
                  product.productType
                )}
              </dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-semibold text-ink">Brand:</dt>
              <dd className="text-ink-muted">{product.brand}</dd>
            </div>
          </dl>

          <div className="mt-5 flex items-start gap-3 rounded-lg bg-sand p-4 text-[13.5px] text-ink-soft">
            <TruckIcon className="mt-0.5 h-5 w-5 shrink-0 text-moss-400" />
            <p>
              <strong className="text-ink">Ships in {site.shipping.handlingTime}</strong>, arrives in{' '}
              {site.shipping.transitTime}. Bubble-wrapped and boxed to protect the seal.
            </p>
          </div>

          <p className="mt-4 flex items-center gap-2 text-[13.5px] text-ink-soft">
            <PhoneIcon className="h-4 w-4 text-moss-400" />
            Questions about this box? Call{' '}
            <a href={`tel:${site.contact.phoneHref}`} className="font-semibold text-moss-500 underline underline-offset-2">
              {site.contact.phone}
            </a>
          </p>
        </div>
      </div>

      <ProductTabs
        blocks={blocks}
        reviews={reviewsFor(product.slug)}
        otherReviews={reviewsOfOtherProducts(product.slug).flatMap(({ productSlug, review }) => {
          const reviewed = getProduct(productSlug);
          return reviewed ? [{ review, productTitle: reviewed.title, productHref: `/products/${reviewed.slug}` }] : [];
        })}
        shipping={[
          'Free standard shipping to all 50 U.S. states.',
          `Ships within ${site.shipping.handlingTime}; order before ${site.shipping.cutOff} to ship the next business day.`,
          `Delivery in ${site.shipping.transitTime} after dispatch, with tracking emailed the moment it ships.`,
          'Bubble-wrapped and shipped in a rigid carton — never a padded mailer. Orders over $1,000 ship insured with signature confirmation.',
        ]}
        returnsSummary={`Unopened, factory-sealed product can be returned within ${site.returns.windowDays} days of delivery with no restocking fee. Opened boxes and packs cannot be returned, because their contents are random. If a box arrives damaged, contact us before opening it and we will replace or refund it.`}
      />

      <TrustpilotProductReviews sku={product.sku} />

      {related.length > 0 && (
        <section className="border-t border-ink/10 py-14">
          <CenteredHeading eyebrow="You may also like" title="Related products" />
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4 xl:gap-x-6">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
