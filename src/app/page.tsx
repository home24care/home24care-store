import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import ProductCard from '@/components/ProductCard';
import { SectionHeading, ProductGrid } from '@/components/Section';
import JsonLd from '@/components/JsonLd';
import { site } from '@/lib/site';
import { faqSchema } from '@/lib/schema';
import {
  collections,
  getProduct,
  productsIn,
  bestSellers,
  newArrivals,
  onSale,
  products,
} from '@/lib/catalog';
import { formatPrice } from '@/lib/format';
import { BLUR_DATA_URL, SIZES, IMAGES_LOCALIZED, heroVariant } from '@/lib/image';
import { TruckIcon, ReturnIcon, ShieldIcon, SupportIcon, CheckIcon } from '@/components/icons';
import { TrustpilotReviews } from '@/components/TrustpilotSection';
import ReviewsSection from '@/components/ReviewsSection';

export const metadata: Metadata = {
  title: 'Outdoor Living, Built to Last — Swing Sets, Gazebos, Pergolas & Refrigerants',
  description:
    'Shop backyard structures and certified refrigerants at Home24Care. Swing sets, gazebos, pergolas, outdoor kitchens, saunas and greenhouses, plus R-410A, R-134a and R-1234yf cylinders. Free standard shipping on every order.',
  alternates: { canonical: '/' },
};

/**
 * Hero and tile art are pulled from the catalog rather than hardcoded CDN
 * URLs, so `npm run localize:images` swaps them to local WebP along with
 * everything else.
 */
const HERO_PRODUCT = 'adventurer-swing-set';
const HERO_ALT =
  'A cedar swing set with slide and climbing wall set up on a green backyard lawn';

const TILE_SLUGS = [
  'swing-sets',
  'gazebos',
  'pergolas',
  'outdoor-kitchens',
  'saunas',
  'greenhouses',
];

const EDITORIAL_PRODUCT = '10x10-barrington-gazebo';
const EDITORIAL_ALT =
  'A hardtop gazebo with a peaked roof installed over a paved patio';

const HOME_FAQS = [
  {
    q: 'How much does shipping cost at Home24Care?',
    a: 'Standard shipping is free on every order shipped within the United States. Orders leave our warehouse within 1 business day and typically arrive in 1–3 business days.',
  },
  {
    q: 'Can I return an item if it is not right?',
    a: `Yes. You have ${site.returns.windowDays} days from the delivery date to request a return, on both defective and non-defective items. We do not charge restocking fees, and approved refunds are issued to your original payment method within ${site.returns.refundBusinessDays} business days.`,
  },
  {
    q: 'What warranty comes with Home24Care products?',
    a: `Every product sold through Home24Care carries a ${site.warranty.label}, covering manufacturing defects under normal use conditions.`,
  },
  {
    q: 'How do I contact customer support?',
    a: `Email ${site.contact.email} or call ${site.contact.phone}. Our team is available ${site.contact.hours} and replies to every email within one business day.`,
  },
];

/** Ordering steps, shown alongside the review section. */
const HOW_IT_WORKS = [
  {
    step: 'Order online or by phone',
    body: `Checkout takes a minute, or call ${site.contact.phone} and we will place the order for you. The price on the page is the price you pay.`,
  },
  {
    step: 'We pack and ship in a day',
    body: 'Orders placed before the daily cut-off leave the warehouse the next business day. Oversized kits ship on a pallet at no extra cost.',
  },
  {
    step: 'Track it door to door',
    body: 'You get a tracking number by email the moment it ships, and freight deliveries are scheduled by appointment.',
  },
  {
    step: 'Changed your mind? Send it back',
    body: `${site.returns.windowDays} days to return anything, defective or not, with no restocking fee and a refund to your original payment method.`,
  },
];

export default function HomePage() {
  const heroProduct = getProduct(HERO_PRODUCT);
  const sale = onSale(8);
  const sellers = bestSellers(8);
  const fresh = newArrivals(4);
  const gas = [
    ...productsIn('hvac-refrigerants'),
    ...productsIn('specialty-refrigerants'),
    ...productsIn('commercial-refrigerants'),
  ].slice(0, 4);

  // Hero and editorial art are keyed on hardcoded slugs. If a slug ever stops
  // resolving we fall back to the first available product rather than passing
  // `undefined` to <Image>, which renders a blank hero with no error.
  const heroSource = heroProduct ?? products[0];
  const editorialProduct = getProduct(EDITORIAL_PRODUCT) ?? products[1] ?? products[0];

  const heroBase = heroSource.images[0].full;
  const editorialBase = editorialProduct.images[0].full;
  const heroImage = heroVariant(heroBase) ?? heroBase;
  const editorialImage = heroVariant(editorialBase) ?? editorialBase;

  // Tiles pick the first product that is not already on screen as the hero or
  // the editorial image — otherwise swing-sets and gazebos show the same two
  // photographs twice on one page.
  const usedIds = new Set([heroSource.id, editorialProduct.id]);
  const tiles = TILE_SLUGS.map((slug) => {
    const pool = productsIn(slug);
    const pick = pool.find((x) => !usedIds.has(x.id) && x.images.length) ?? pool[0];
    if (pick) usedIds.add(pick.id);
    return {
      slug,
      collection: collections.find((c) => c.slug === slug),
      image: pick?.images[0]?.card,
    };
  }).filter((t) => t.collection && t.image);

  return (
    <>
      <JsonLd data={faqSchema(HOME_FAQS)} />

      {/* ---------------------------------------------------------- Hero */}
      <section className="relative isolate overflow-hidden bg-moss-900">
        <Image
          src={heroImage}
          alt={HERO_ALT}
          fill
          priority
          fetchPriority="high"
          sizes={SIZES.hero}
          unoptimized={IMAGES_LOCALIZED}
          quality={75}
          className="object-cover object-center"
        />
        {/*
          Contrast comes from the scrim alone, not from dimming the photograph
          — fading the image itself against a near-black section just produced
          a flat green block.

          The scrim also has to run in the direction the text actually sits:
          below lg the copy spans the full width, so a left-to-right gradient
          starts opaque across the whole hero and hides the image entirely.
          Vertical there, horizontal only once the text occupies one column.
        */}
        <div
          className="absolute inset-0 bg-gradient-to-t from-moss-900 via-moss-900/80 to-moss-900/40 lg:bg-gradient-to-r lg:from-moss-900/95 lg:via-moss-900/70 lg:to-moss-900/10"
          aria-hidden="true"
        />
        <div className="container-page relative flex min-h-[clamp(460px,62vh,620px)] items-center py-16">
          <div className="max-w-xl animate-rise">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/12 px-3.5 py-1.5 text-[12.5px] font-semibold text-white backdrop-blur">
              <TruckIcon className="h-4 w-4" />
              Free shipping · Ships in 1 business day
            </p>
            <h1 className="text-balance font-display text-[40px] leading-[1.06] tracking-tight text-white sm:text-[54px] lg:text-[62px]">
              Outdoor living, built to last
            </h1>
            <p className="mt-5 max-w-lg text-[16.5px] leading-relaxed text-moss-100">
              Swing sets, gazebos, pergolas, outdoor kitchens and saunas that turn a plain
              yard into the part of the house everyone actually uses. Delivered free,
              anywhere in the {site.address.countryName}.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/collections/swing-sets" className="btn-accent px-7 py-3.5 text-[15px]">
                Shop swing sets
              </Link>
              <Link
                href="/collections"
                className="btn px-7 py-3.5 text-[15px] text-white ring-1 ring-inset ring-white/40 hover:bg-white/10"
              >
                Browse all collections
              </Link>
            </div>

            <ul className="mt-9 flex flex-wrap gap-x-6 gap-y-2 text-[13.5px] text-moss-100">
              {[
                `${site.returns.windowDays}-day returns`,
                site.warranty.label,
                'No restocking fees',
              ].map((item) => (
                <li key={item} className="flex items-center gap-1.5">
                  <CheckIcon className="h-4 w-4 text-clay-300" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {heroProduct && (
            <Link
              href={`/products/${heroProduct.slug}`}
              className="ml-auto hidden w-64 rounded-2xl bg-white/95 p-4 shadow-lift backdrop-blur transition-transform hover:-translate-y-1 xl:block"
            >
              <p className="eyebrow">Featured</p>
              <p className="mt-1 line-clamp-2 text-[15px] font-semibold leading-snug">
                {heroProduct.title}
              </p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-lg font-bold">{formatPrice(heroProduct.price)}</span>
                {heroProduct.compareAtPrice && (
                  <span className="text-[13px] text-ink-muted line-through">
                    {formatPrice(heroProduct.compareAtPrice)}
                  </span>
                )}
              </div>
              <span className="mt-3 block text-[13px] font-semibold text-moss-700">
                View product →
              </span>
            </Link>
          )}
        </div>
      </section>

      {/* --------------------------------------------------- Trust strip */}
      <section className="border-b border-ink/10 bg-sand">
        <div className="container-page grid grid-cols-2 gap-x-6 gap-y-5 py-6 lg:grid-cols-4">
          {[
            [TruckIcon, 'Free standard shipping', 'On every order, no minimum'],
            [ReturnIcon, `${site.returns.windowDays}-day returns`, 'No restocking fees'],
            [ShieldIcon, site.warranty.label, 'On everything we sell'],
            [SupportIcon, 'US-based support', site.contact.hours],
          ].map(([Icon, title, sub]) => {
            const I = Icon as typeof TruckIcon;
            return (
              <div key={title as string} className="flex items-start gap-3">
                <I className="h-6 w-6 shrink-0 text-moss-600" />
                <div className="min-w-0">
                  <p className="text-[13.5px] font-semibold leading-snug">{title as string}</p>
                  <p className="text-[12.5px] leading-snug text-ink-muted">{sub as string}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ------------------------------------------------------ Shop by category */}
      <section className="container-page py-16">
        <SectionHeading
          eyebrow="Shop by category"
          title="Everything for the yard"
          subtitle="Structures that arrive as complete kits — every board, bracket and bolt in the box."
          href="/collections"
          linkLabel="All collections"
        />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          {tiles.map(({ slug, image, collection }, i) => (
            <Link
              key={slug}
              href={`/collections/${slug}`}
              className="group relative isolate flex aspect-[4/3] items-end overflow-hidden rounded-2xl bg-moss-900"
            >
              <Image
                src={image!}
                alt=""
                fill
                sizes={SIZES.tile}
                unoptimized={IMAGES_LOCALIZED}
                quality={75}
                // No priority here: these sit below the fold, and preloading
                // them competes with the hero for the LCP slot.
                loading="lazy"
                placeholder="blur"
                blurDataURL={BLUR_DATA_URL}
                className="object-cover transition-transform duration-500 group-hover:scale-[1.05]"
              />
              <div
                className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/25 to-transparent"
                aria-hidden="true"
              />
              <div className="relative p-5">
                <h3 className="font-display text-[22px] leading-tight text-white sm:text-[26px]">
                  {collection!.title}
                </h3>
                <p className="mt-1 text-[13px] text-white/80">
                  {collection!.count} products · from{' '}
                  {formatPrice(Math.min(...productsIn(slug).map((p) => p.price)))}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* --------------------------------------------------------- Best sellers */}
      {sellers.length > 0 && (
        <section className="container-page pb-16">
          <SectionHeading
            eyebrow="Most popular"
            title="Best sellers this season"
            subtitle="The pieces our customers keep coming back for."
            href="/collections/best-sellers"
          />
          <ProductGrid>
            {sellers.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </ProductGrid>
        </section>
      )}

      {/* ------------------------------------------------------- Editorial split */}
      <section className="bg-moss-800 text-white">
        <div className="container-page grid items-center gap-10 py-16 lg:grid-cols-2 lg:py-20">
          <div className="max-w-lg">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-clay-300">
              Built for real weather
            </p>
            <h2 className="mt-3 font-display text-[32px] leading-[1.12] tracking-tight sm:text-[42px]">
              Kits that go up in a weekend and stand for a decade
            </h2>
            <p className="mt-4 text-[15.5px] leading-relaxed text-moss-100">
              Every structure ships as a complete, pre-cut kit with labelled hardware and
              step-by-step instructions. Powder-coated steel, kiln-dried cedar and
              UV-stable composite panels mean no staining, no sealing and no splinters —
              just a yard that looks the same in year five as it did on day one.
            </p>
            <ul className="mt-7 space-y-3">
              {[
                'Pre-drilled lumber and numbered hardware bags',
                'Rated for snow load and sustained wind',
                'Freight delivery included on oversized items',
                'Replacement parts stocked for the life of the warranty',
              ].map((item) => (
                <li key={item} className="flex gap-3 text-[15px] text-moss-50">
                  <CheckIcon className="mt-0.5 h-5 w-5 shrink-0 text-clay-300" />
                  {item}
                </li>
              ))}
            </ul>
            <Link href="/collections/gazebos" className="btn-accent mt-8 px-7 py-3.5 text-[15px]">
              Shop gazebos &amp; pergolas
            </Link>
          </div>

          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl lg:aspect-[5/4]">
            <Image
              src={editorialImage}
              alt={EDITORIAL_ALT}
              fill
              sizes="(min-width: 1024px) 48vw, 100vw"
              quality={75}
              unoptimized={IMAGES_LOCALIZED}
              loading="lazy"
              placeholder="blur"
              blurDataURL={BLUR_DATA_URL}
              className="object-cover"
            />
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ On sale */}
      {sale.length > 0 && (
        <section className="container-page py-16">
          <SectionHeading
            eyebrow="Limited time"
            title="On sale now"
            subtitle="Current markdowns across the catalog. Prices shown are what you pay at checkout."
            href="/collections/sale"
            linkLabel="All sale items"
          />
          <ProductGrid>
            {sale.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </ProductGrid>
        </section>
      )}

      {/* ----------------------------------------------------- Refrigerants */}
      {gas.length > 0 && (
        <section className="border-y border-ink/10 bg-sand py-16">
          <div className="container-page">
            <SectionHeading
              eyebrow="Trade counter"
              title="Refrigerants & HVAC gases"
              subtitle="Factory-sealed cylinders, cans and pallet quantities for licensed technicians — R-410A, R-134a, R-1234yf, R-404A and legacy blends."
              href="/collections/hvac-refrigerants"
              linkLabel="Shop refrigerants"
            />
            <ProductGrid>
              {gas.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </ProductGrid>
            <p className="mt-7 max-w-3xl text-[13.5px] leading-relaxed text-ink-muted">
              Certain refrigerants may be sold only to buyers who are Section 608 or 609
              certified under the U.S. Clean Air Act. By ordering you confirm you hold the
              certification your purchase requires and will handle and recover the product
              in line with EPA regulations.
            </p>
          </div>
        </section>
      )}

      {/* ------------------------------------------------------ New arrivals */}
      {fresh.length > 0 && (
        <section className="container-page py-16">
          <SectionHeading
            eyebrow="Just landed"
            title="New arrivals"
            href="/collections/new-arrivals"
          />
          <ProductGrid>
            {fresh.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </ProductGrid>
        </section>
      )}

      {/* Trustpilot widget when configured, self-hosted reviews otherwise —
          ReviewsSection returns null as soon as a business unit id exists. */}
      <TrustpilotReviews />
      <ReviewsSection />

      {/* ------------------------------------------------------ How it works */}
      <section className="container-page pb-16">
        <SectionHeading
          eyebrow="How ordering works"
          title="No surprises between checkout and your driveway"
        />
        <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {HOW_IT_WORKS.map((item, i) => (
            <li
              key={item.step}
              className="rounded-2xl border border-ink/10 bg-white p-6 shadow-card"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-moss-100 text-[14px] font-bold text-moss-800">
                {i + 1}
              </span>
              <h3 className="mt-3 text-[16px] font-semibold leading-snug">{item.step}</h3>
              <p className="mt-1.5 text-[14px] leading-relaxed text-ink-soft">{item.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* -------------------------------------------------------------- FAQ */}
      <section className="border-t border-ink/10 bg-sand py-16">
        <div className="container-page grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="eyebrow mb-1.5">Before you order</p>
            <h2 className="font-display text-[30px] leading-tight tracking-tight sm:text-[36px]">
              The questions we get most
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">
              Still unsure about something? Call{' '}
              <a href={`tel:${site.contact.phoneHref}`} className="font-semibold text-moss-700 underline underline-offset-2">
                {site.contact.phone}
              </a>{' '}
              or email{' '}
              <a href={`mailto:${site.contact.email}`} className="font-semibold text-moss-700 underline underline-offset-2">
                {site.contact.email}
              </a>
              .
            </p>
            <Link href="/faq" className="btn-outline mt-6">
              Read all FAQs
            </Link>
          </div>

          <dl className="divide-y divide-ink/10 border-y border-ink/10">
            {HOME_FAQS.map((f) => (
              <div key={f.q} className="py-5">
                <dt className="text-[15.5px] font-semibold text-ink">{f.q}</dt>
                <dd className="mt-1.5 text-[14.5px] leading-relaxed text-ink-soft">{f.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ------------------------------------------------------- Catalog size */}
      <section className="container-page py-14">
        <div className="rounded-2xl border border-ink/10 bg-white p-8 text-center shadow-card sm:p-12">
          <h2 className="font-display text-[28px] leading-tight tracking-tight sm:text-[34px]">
            {products.length} products, one place
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-[15px] leading-relaxed text-ink-soft">
            From a two-seat playhouse to a full pallet of refrigerant, everything on this
            site ships free and is backed by the same returns window and warranty.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link href="/collections" className="btn-primary px-7 py-3.5">
              Start browsing
            </Link>
            <Link href="/contact" className="btn-outline px-7 py-3.5">
              Talk to us first
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
