import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import JsonLd from '@/components/JsonLd';
import CollectorHub from '@/components/CollectorHub';
import { AdvantageGrid, BrandStrip, CenteredHeading } from '@/components/StoreBands';
import { TrustpilotReviews } from '@/components/TrustpilotSection';
import ReviewsSection from '@/components/ReviewsSection';
import { ArrowIcon, CheckIcon } from '@/components/icons';
import { site } from '@/lib/site';
import { faqSchema } from '@/lib/schema';
import {
  collections,
  getProduct,
  productsIn,
  productsInGroup,
  bestSellers,
  limitedReleases,
  products,
  type Product,
} from '@/lib/catalog';
import { SIZES, IMAGES_LOCALIZED, cutoutImage } from '@/lib/image';

export const metadata: Metadata = {
  title: `${site.name} — Sealed Hobby Boxes: Topps Chrome, Bowman, Prizm & Pokémon`,
  description:
    'Factory-sealed hobby boxes and trading card games — Topps Chrome, Bowman, Panini Prizm FIFA World Cup, Pokémon TCG and Magic: The Gathering. 100% authentic, free U.S. shipping and packed to protect the seal.',
  alternates: { canonical: '/' },
};

/* Every hero, spotlight and tile picks its art from the catalog by slug, so the
   picture and the link always point at a product that exists. */
const HERO = {
  left: ['2025-topps-chrome-football-delight-box', '2026-bowman-chrome-baseball-hobby-box'],
  wide: '2025-26-topps-chrome-update-basketball-hobby-box',
  small: ['2025-topps-cosmic-chrome-football-hobby-box', 'pokemon-30th-celebration-elite-trainer-box'],
};

const HOME_FAQS = [
  {
    q: `Are the boxes sold by ${site.name} authentic and factory sealed?`,
    a: `Yes. Every box is brand new and ships in its original manufacturer seal, exactly as released by Topps, Bowman, Panini, The Pokémon Company International or Wizards of the Coast. Our ${site.warranty.label} refunds you in full if a box is ever not as described.`,
  },
  {
    q: 'How much does shipping cost?',
    a: `Standard shipping is free on every U.S. order. Orders leave within ${site.shipping.handlingTime}, arrive in ${site.shipping.transitTime}, and you get a tracking number by email as soon as the box ships.`,
  },
  {
    q: 'Can I return a box?',
    a: `Yes — unopened, factory-sealed product can be returned within ${site.returns.windowDays} days of delivery with no restocking fee. Opened boxes and packs cannot be returned, because their contents are random.`,
  },
  {
    q: 'Are the hits in a box guaranteed?',
    a: 'The box break averages on each product — for example "1 autograph per box" — are the figures the manufacturer publishes. Which cards you pull is random and their value is not guaranteed.',
  },
];

/** Informational "Hobby 101" cards. */
const HOBBY_GUIDE = [
  {
    eyebrow: 'Formats',
    title: 'Hobby, Jumbo or Delight?',
    body: 'Hobby boxes are made for hobby shops and carry guaranteed hits plus hobby-only parallels. Delight (Breaker’s Delight) boxes trade pack count for more autographs per box. Jumbo boxes pack more cards and more hits into each box.',
  },
  {
    eyebrow: 'Short prints',
    title: 'Sapphire & Logofractor',
    body: 'Sapphire editions print every card in a blue Sapphire chromium finish with exclusive parallels; Logofractor editions use a team-logo refractor. Both are produced in far smaller quantities than the standard hobby box and rarely restock.',
  },
  {
    eyebrow: 'Prospecting',
    title: 'Why 1st Bowman matters',
    body: 'Bowman carries a player’s first officially licensed card — the “1st Bowman” — often years before his MLB debut. That is why Bowman and Bowman Chrome are the boxes prospectors chase every season.',
  },
  {
    eyebrow: 'Our promise',
    title: 'Shipped seal-safe',
    body: 'Every box is bubble-wrapped and shipped in a rigid carton with void fill — never a padded mailer — so the shrink-wrap and corners arrive exactly as they left the factory.',
  },
];

/**
 * A spotlight card shows either a product's box shot (`slug`) or a full-bleed
 * lifestyle photo from /public (`photo`), which takes precedence.
 */
type Spot = {
  slug?: string;
  photo?: string;
  eyebrow: string;
  title: string;
  body: string;
  href: string;
  cta: string;
};

const SPOTLIGHTS_A: Spot[] = [
  {
    photo: '/spotlights/basketball.webp',
    eyebrow: 'Rookie watch',
    title: 'Basketball',
    body: 'Topps Chrome Update Basketball — chase the new rookie class in Chrome refractors.',
    href: '/collections/basketball',
    cta: 'Shop basketball',
  },
  {
    photo: '/spotlights/football.webp',
    eyebrow: 'Sunday hits',
    title: 'Football',
    body: 'Topps Chrome and Cosmic Chrome football hobby boxes — rookies, refractors and more.',
    href: '/collections/football',
    cta: 'Shop football',
  },
];

const SPOTLIGHTS_B: Spot[] = [
  {
    slug: '2026-topps-chrome-ufc-sapphire-edition-box',
    eyebrow: 'In the Octagon',
    title: 'UFC',
    body: 'Topps Chrome UFC Sapphire — an exclusive Sapphire autograph in every box.',
    href: '/collections/ufc',
    cta: 'Shop UFC',
  },
  {
    slug: 'magic-the-gathering-marvel-super-heroes-collector-booster-box',
    eyebrow: 'At the table',
    title: 'Trading Card Games',
    body: 'Pokémon Elite Trainer Boxes and Magic: The Gathering Collector Boosters.',
    href: '/collections/pokemon',
    cta: 'Shop TCG',
  },
];

/** Tile backgrounds for "Shop by category", one per collection. */
const TILE_BG: Record<string, string> = {
  football: 'from-[#1f2a24] to-[#34503f]',
  basketball: 'from-[#2a1f24] to-[#5a2f3a]',
  baseball: 'from-[#1d2433] to-[#2f4466]',
  soccer: 'from-[#1f2733] to-[#314a3f]',
  ufc: 'from-[#241f1f] to-[#5b2626]',
  pokemon: 'from-[#2b2a1d] to-[#6a5a1f]',
  magic: 'from-[#261f2d] to-[#4a3160]',
};

/** Transparent packshot, so product art sits cleanly on any panel colour. */
const img = (p: Product | undefined) =>
  p?.images[0] ? (p.images[0].cutout ?? cutoutImage(p.images[0].full)) : undefined;

function HeroImage({ product, className, sizes }: { product?: Product; className?: string; sizes: string }) {
  if (!product) return null;
  return (
    <div className={`relative ${className ?? ''}`}>
      <Image
        src={img(product)!}
        alt={product.images[0].alt || product.title}
        fill
        priority
        sizes={sizes}
        unoptimized={IMAGES_LOCALIZED}
        className="object-contain drop-shadow-[0_12px_18px_rgba(0,0,0,0.18)] transition-transform duration-500 group-hover:scale-[1.04]"
      />
    </div>
  );
}

function SpotlightPair({ spots }: { spots: Spot[] }) {
  return (
    <section className="container-page grid gap-5 py-6 md:grid-cols-2">
      {spots.map((s) => {
        const p = s.slug ? getProduct(s.slug) : undefined;
        return (
          <Link
            key={s.href}
            href={s.href}
            className="group relative isolate flex min-h-[380px] flex-col justify-end overflow-hidden rounded-xl bg-gradient-to-b from-[#3a403c] to-[#151816] p-7 sm:min-h-[440px]"
          >
            {s.photo ? (
              <Image
                src={s.photo}
                alt=""
                fill
                sizes="(min-width: 768px) 45vw, 90vw"
                loading="lazy"
                className="-z-10 object-cover transition-transform duration-500 group-hover:scale-[1.04]"
              />
            ) : p && (
              <div className="absolute inset-x-6 top-6 bottom-36 -z-10">
                <Image
                  src={img(p)!}
                  alt=""
                  fill
                  sizes="(min-width: 768px) 45vw, 90vw"
                  unoptimized={IMAGES_LOCALIZED}
                  loading="lazy"
                  className="object-contain drop-shadow-2xl transition-transform duration-500 group-hover:scale-[1.04]"
                />
              </div>
            )}
            <div
              className={`absolute inset-x-0 bottom-0 -z-10 bg-gradient-to-t to-transparent ${
                s.photo ? 'h-full from-black/90 via-black/55' : 'h-2/3 from-black/85'
              }`}
              aria-hidden="true"
            />
            <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-clay-400">
              <span className="h-px w-5 bg-clay-400" aria-hidden="true" />
              {s.eyebrow}
            </p>
            <h3 className="mt-2 font-display text-[30px] leading-tight text-white">{s.title}</h3>
            <p className="mt-1.5 max-w-sm text-[14px] leading-relaxed text-white/75">{s.body}</p>
            <span className="mt-4 inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.12em] text-clay-400">
              {s.cta} <ArrowIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </span>
          </Link>
        );
      })}
    </section>
  );
}

export default function HomePage() {
  const [leftA, leftB] = HERO.left.map(getProduct);
  const wide = getProduct(HERO.wide);
  const [smallA, smallB] = HERO.small.map(getProduct);

  const tabs = [
    { key: 'demand', label: 'High Demand', products: bestSellers(8) },
    { key: 'limited', label: 'Limited Releases', products: limitedReleases(8) },
    { key: 'tcg', label: 'Pokémon & Magic', products: productsInGroup('Trading Card Games') },
    { key: 'all', label: 'All Boxes', products: products.slice(0, 12) },
  ].filter((t) => t.products.length > 0);

  return (
    <>
      <JsonLd data={faqSchema(HOME_FAQS)} />

      {/* ------------------------------------------------------ Hero mosaic */}
      <section className="container-page grid gap-4 pt-6 lg:grid-cols-2 lg:pt-8">
        <Link
          href="/collections"
          className="group relative grid min-h-[420px] overflow-hidden rounded-md bg-[#f1f1ef] p-7 sm:grid-cols-[1fr_1fr] sm:p-10 lg:min-h-[560px]"
        >
          <div className="relative z-10 flex flex-col justify-center">
            <p className="eyebrow">Exclusive hobby drops</p>
            <h1 className="mt-3 font-display text-[42px] uppercase leading-[1.02] tracking-tight text-ink sm:text-[52px] xl:text-[60px]">
              Unbox
              <br />
              the
              <br />
              legends
            </h1>
            <p className="mt-5 max-w-xs text-[15px] font-medium leading-relaxed text-ink-soft">
              Factory-sealed Topps Chrome, Bowman and Prizm hobby boxes with 100% authenticity
              guaranteed. Experience the thrill of the rip and chase your next grail.
            </p>
            <span className="mt-6 w-max border-b-2 border-ink pb-1 text-[12px] font-bold uppercase tracking-[0.12em] text-ink transition-colors group-hover:border-moss-400 group-hover:text-moss-500">
              Check all products
            </span>
          </div>
          <div className="relative mt-6 grid grid-cols-2 gap-3 sm:mt-0 sm:grid-cols-1 sm:grid-rows-2">
            <HeroImage product={leftA} sizes="(min-width: 1024px) 22vw, 50vw" className="min-h-[170px]" />
            <HeroImage product={leftB} sizes="(min-width: 1024px) 22vw, 50vw" className="min-h-[170px]" />
          </div>
        </Link>

        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href="/collections/basketball"
            className="group relative grid min-h-[260px] grid-cols-[1fr_1.15fr] items-center overflow-hidden rounded-md bg-[#f1f1ef] p-6 sm:col-span-2"
          >
            <div>
              <p className="eyebrow">Basketball season</p>
              <h2 className="mt-2 font-display text-[26px] uppercase leading-tight text-ink sm:text-[30px]">
                NBA hype drops
              </h2>
              <p className="mt-2 max-w-[220px] text-[13.5px] font-medium leading-snug text-ink-soft">
                Hunt the Cooper Flagg rookie class in Topps Chrome Update.
              </p>
              <span className="mt-4 inline-block border-b-2 border-ink pb-0.5 text-[11px] font-bold uppercase tracking-[0.12em] group-hover:border-moss-400 group-hover:text-moss-500">
                Shop NBA
              </span>
            </div>
            <HeroImage product={wide} sizes="(min-width: 1024px) 25vw, 55vw" className="h-full min-h-[210px]" />
          </Link>

          {[
            { p: smallA, href: '/collections/football', eyebrow: 'Gridiron hits', title: 'NFL', cta: 'Shop NFL' },
            { p: smallB, href: '/collections/pokemon', eyebrow: '30 years of Pokémon', title: 'Pokémon', cta: 'Shop Pokémon' },
          ].map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className="group relative flex min-h-[280px] flex-col overflow-hidden rounded-md bg-[#f1f1ef] p-6"
            >
              <p className="eyebrow">{t.eyebrow}</p>
              <h2 className="mt-1.5 font-display text-[26px] uppercase leading-tight text-ink">{t.title}</h2>
              <span className="mt-1 w-max border-b-2 border-ink pb-0.5 text-[11px] font-bold uppercase tracking-[0.12em] group-hover:border-moss-400 group-hover:text-moss-500">
                {t.cta}
              </span>
              <HeroImage product={t.p} sizes="(min-width: 1024px) 20vw, 45vw" className="mt-3 min-h-[170px] flex-1" />
            </Link>
          ))}
        </div>
      </section>

      {/* ----------------------------------------------------- Collector hub */}
      <section className="container-page py-16">
        <CenteredHeading
          eyebrow="The collector’s hub"
          title="Elevate your collection"
          subtitle="From NBA rookies to Pokémon grails — the sealed boxes collectors are chasing right now. Shop with confidence."
        />
        <CollectorHub tabs={tabs} />
      </section>

      {/* ------------------------------------------------ Spotlight cards A */}
      <SpotlightPair spots={SPOTLIGHTS_A} />

      {/* -------------------------------------------------- Shop by category */}
      <section className="container-page py-16">
        <CenteredHeading
          eyebrow="Discover the hobby"
          title="Shop by category"
          subtitle="Unbox the extraordinary — from NFL rookies and soccer icons to Pokémon and Magic. Secure your piece of the hobby."
        />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {collections.map((c) => {
            const p = productsIn(c.slug)[0];
            return (
              <Link
                key={c.slug}
                href={`/collections/${c.slug}`}
                className={`group relative isolate flex aspect-[4/5] flex-col justify-end overflow-hidden rounded-md bg-gradient-to-br p-5 ${
                  TILE_BG[c.slug] ?? 'from-[#1f2a24] to-[#34503f]'
                }`}
              >
                {p && (
                  <div className="absolute inset-x-6 bottom-24 top-6 -z-10">
                    <Image
                      src={img(p)!}
                      alt=""
                      fill
                      sizes={SIZES.tile}
                      unoptimized={IMAGES_LOCALIZED}
                      loading="lazy"
                      className="object-contain drop-shadow-2xl transition-transform duration-500 group-hover:scale-[1.06]"
                    />
                  </div>
                )}
                <div className="text-center">
                  <h3 className="font-display text-[18px] uppercase tracking-[0.06em] text-white sm:text-[22px]">
                    {c.title}
                  </h3>
                  <p className="mt-1 text-[11.5px] font-semibold uppercase tracking-[0.14em] text-white/70">
                    {c.count} {c.count === 1 ? 'product' : 'products'}
                  </p>
                </div>
              </Link>
            );
          })}
          <Link
            href="/collections/limited-releases"
            className="group flex aspect-[4/5] flex-col items-center justify-center rounded-md border border-ink/12 bg-sand p-6 text-center"
          >
            <p className="eyebrow">Short prints</p>
            <h3 className="mt-2 font-display text-[22px] uppercase leading-tight text-ink">Limited releases</h3>
            <p className="mt-2 text-[13px] text-ink-soft">Sapphire, Delight and Logofractor editions.</p>
            <span className="mt-4 inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.12em] text-moss-500">
              Shop now <ArrowIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </span>
          </Link>
        </div>
      </section>

      {/* --------------------------------------------------- Advantage grid */}
      <AdvantageGrid />

      {/* ------------------------------------------------ Spotlight cards B */}
      <SpotlightPair spots={SPOTLIGHTS_B} />

      {/* --------------------------------------------------------- Hobby 101 */}
      <section className="container-page py-16">
        <CenteredHeading
          eyebrow="Hobby 101"
          title="Know your boxes"
          subtitle="A quick guide to the formats on this site, so you know exactly what you are ripping before you buy."
        />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {HOBBY_GUIDE.map((g) => (
            <article key={g.title} className="rounded-md border border-ink/10 bg-white p-6">
              <p className="eyebrow">{g.eyebrow}</p>
              <h3 className="mt-2 font-display text-[19px] leading-snug text-ink">{g.title}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">{g.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Reviews appear only once there are genuine ones to show. */}
      <TrustpilotReviews />
      <ReviewsSection />

      {/* -------------------------------------------------------------- FAQ */}
      <section className="border-y border-ink/10 bg-sand py-16">
        <div className="container-page grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="eyebrow mb-2">Before you order</p>
            <h2 className="section-title">Collector questions</h2>
            <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">
              Still unsure about something? Call{' '}
              <a href={`tel:${site.contact.phoneHref}`} className="font-semibold text-moss-500 underline underline-offset-2">
                {site.contact.phone}
              </a>{' '}
              or email{' '}
              <a href={`mailto:${site.contact.email}`} className="font-semibold text-moss-500 underline underline-offset-2">
                {site.contact.email}
              </a>
              .
            </p>
            <ul className="mt-6 space-y-2.5">
              {[
                'Brand new and factory sealed — never resealed or searched',
                'Free U.S. shipping, packed in rigid cartons',
                `${site.returns.windowDays}-day returns on unopened product`,
              ].map((t) => (
                <li key={t} className="flex gap-2.5 text-[14.5px] text-ink-soft">
                  <CheckIcon className="mt-0.5 h-5 w-5 shrink-0 text-moss-400" />
                  {t}
                </li>
              ))}
            </ul>
            <Link href="/faq" className="btn-outline mt-7">
              Read all FAQs
            </Link>
          </div>

          <dl className="divide-y divide-ink/10 border-y border-ink/10">
            {HOME_FAQS.map((f) => (
              <div key={f.q} className="py-5">
                <dt className="font-display text-[17px] text-ink">{f.q}</dt>
                <dd className="mt-1.5 text-[14.5px] leading-relaxed text-ink-soft">{f.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <div className="pt-14">
        <BrandStrip />
      </div>

    </>
  );
}
