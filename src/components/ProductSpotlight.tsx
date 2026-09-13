import Link from 'next/link';
import Image from 'next/image';
import type { Product } from '@/lib/catalog';
import { formatPrice } from '@/lib/format';
import { BLUR_DATA_URL, SIZES, IMAGES_LOCALIZED } from '@/lib/image';
import { ChevronIcon } from './icons';

/**
 * Spotlight band: one product shown large against a soft gradient, with a rail
 * of related products riding the bottom edge.
 *
 * The feature image sits in a rounded, shadowed frame and is `object-cover`.
 * The reference design floats a transparent product cutout directly on the
 * gradient, which only works with cut-out PNGs; these are lifestyle
 * photographs with their own backgrounds, so a square-edged photo dropped on
 * the gradient reads as a mistake. Framed, it reads as deliberate.
 *
 * The image is shorter on phones (16/11) than on larger screens (4/3): at
 * 375px a 4/3 frame is ~280px tall and pushes the headline and its CTA below
 * the fold, which is the wrong thing to hide in a band whose job is the CTA.
 *
 * The rail scrolls horizontally rather than wrapping. Every flex child carries
 * `min-w-0` and the track sets `w-max`, because a flex item's default
 * `min-width: auto` refuses to shrink below its content and pushes the page
 * itself wide instead of scrolling inside the container.
 */
export default function ProductSpotlight({
  eyebrow,
  titleTop,
  titleBottom,
  subtitle,
  href,
  ctaLabel = 'Go shopping',
  feature,
  rail,
}: {
  eyebrow?: string;
  titleTop: string;
  titleBottom?: string;
  subtitle: string;
  href: string;
  ctaLabel?: string;
  feature: Product;
  rail: Product[];
}) {
  const image = feature.images[0];

  return (
    <section className="relative isolate overflow-hidden bg-gradient-to-br from-moss-100 via-moss-200 to-moss-300">
      {/* A light wash off the top-left corner, so the gradient has a source. */}
      <div
        className="pointer-events-none absolute -left-24 -top-32 h-[420px] w-[520px] rounded-full bg-sand/55 blur-3xl"
        aria-hidden="true"
      />

      <div className="container-page relative pt-12 sm:pt-14 lg:pt-16">
        <div className="grid items-center gap-8 lg:grid-cols-[1.05fr_1fr] lg:gap-12">
          <div className="relative order-1 mx-auto aspect-[16/11] w-full max-w-[560px] overflow-hidden rounded-[28px] sm:aspect-[4/3] shadow-[0_20px_45px_-18px_rgba(18,33,28,0.45)] lg:max-w-none">
            <Image
              src={image.full}
              alt={image.alt || feature.title}
              fill
              sizes="(min-width: 1024px) 52vw, 92vw"
              unoptimized={IMAGES_LOCALIZED}
              quality={80}
              placeholder="blur"
              blurDataURL={BLUR_DATA_URL}
              className="object-cover"
            />
          </div>

          <div className="order-2 max-w-xl pb-4 lg:pb-10">
            {eyebrow ? (
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-moss-700">
                {eyebrow}
              </p>
            ) : null}
            <h2 className="mt-3 font-display text-[34px] font-bold leading-[1.05] tracking-tight text-ink sm:text-[46px] lg:text-[54px]">
              {titleTop}
              {titleBottom ? (
                <>
                  <br />
                  {titleBottom}
                </>
              ) : null}
            </h2>
            <p className="mt-5 max-w-md text-[16px] leading-relaxed text-ink-soft sm:text-[17.5px]">
              {subtitle}
            </p>
            <Link
              href={href}
              className="mt-7 inline-flex items-center gap-2 rounded-full bg-moss-800 px-7 py-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-moss-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-moss-900 focus-visible:ring-offset-2 focus-visible:ring-offset-moss-100"
            >
              {ctaLabel}
              <ChevronIcon className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* The rail rides low in the band, close to its bottom edge. It is not
            pulled across the boundary with a negative margin: that would need
            the next section to reserve matching space, and every later edit to
            the two of them would have to keep those numbers in step. */}
        {rail.length > 0 ? (
          <div className="-mx-4 mt-10 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0 lg:mt-4">
            <ul className="flex w-max gap-4 pb-2">
              {rail.map((p) => (
                <li key={p.id} className="min-w-0">
                  <Link
                    href={`/products/${p.slug}`}
                    className="group flex h-full w-[236px] min-w-0 items-center gap-3 rounded-2xl bg-white p-3 shadow-lift transition-shadow hover:shadow-lg sm:w-[268px]"
                  >
                    <span className="relative h-[64px] w-[78px] shrink-0 overflow-hidden rounded-xl bg-moss-50 sm:h-[72px] sm:w-[88px]">
                      <Image
                        src={p.images[0].card}
                        alt=""
                        fill
                        sizes={SIZES.card}
                        unoptimized={IMAGES_LOCALIZED}
                        quality={75}
                        loading="lazy"
                        className="object-cover"
                      />
                    </span>
                    <span className="min-w-0 flex-1 text-center">
                      <span className="block truncate text-[14.5px] font-semibold text-ink group-hover:text-moss-700">
                        {p.brand}
                      </span>
                      <span className="mt-1 block text-[16px] font-bold tabular-nums text-moss-700">
                        {formatPrice(p.price)}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      <div className="h-7 sm:h-9" />
    </section>
  );
}
