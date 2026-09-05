import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import Breadcrumbs from '@/components/Breadcrumbs';
import { site } from '@/lib/site';
import { products, collections, getProduct } from '@/lib/catalog';
import { IMAGES_LOCALIZED, heroVariant } from '@/lib/image';
import { CheckIcon, PhoneIcon, MailIcon, PinIcon } from '@/components/icons';

export const metadata: Metadata = {
  title: 'About Us',
  description: `${site.name} is a ${site.address.city}-based retailer of backyard structures and HVAC refrigerants, shipping free across the United States. Learn who we are, what we sell and how to reach us.`,
  alternates: { canonical: '/about' },
};

export default function AboutPage() {
  // Alt text is derived from whichever product supplies the image, so a
  // fallback can never describe a pergola while showing something else.
  const heroProduct = getProduct('10-x-10-pergola') ?? products[0];
  const heroBase = heroProduct.images[0].full;
  const heroImage = heroVariant(heroBase) ?? heroBase;
  const heroAlt =
    heroProduct.slug === '10-x-10-pergola'
      ? 'A timber pergola installed over a backyard seating area'
      : heroProduct.images[0].alt || heroProduct.title;

  return (
    <div className="container-page pb-16">
      <Breadcrumbs trail={[{ name: 'About us', url: '/about' }]} />

      <header className="max-w-3xl pb-10">
        <p className="eyebrow mb-2">About us</p>
        <h1 className="font-display text-[36px] leading-[1.08] tracking-tight sm:text-[46px]">
          Welcome to {site.name}
        </h1>
        <p className="mt-4 text-[17px] leading-relaxed text-ink-soft">
          We believe every home deserves practical, reliable products that make everyday life
          easier — and every trade professional deserves a supplier who ships on time and
          answers the phone. That is the whole business.
        </p>
      </header>

      <div className="relative mb-14 aspect-[21/9] overflow-hidden rounded-2xl bg-sand">
        <Image
          src={heroImage}
          alt={heroAlt}
          fill
          sizes="100vw"
          quality={75}
          priority
          fetchPriority="high"
          unoptimized={IMAGES_LOCALIZED}
          className="object-cover"
        />
      </div>

      <div className="grid gap-12 lg:grid-cols-[1.5fr_1fr] lg:gap-16">
        <div className="prose-policy max-w-2xl">
          <h2>Our mission</h2>
          <p>
            Our goal is simple: offer quality products at fair prices, and deliver a shopping
            experience that does not make you work for it. We understand the importance of
            value, reliability and customer satisfaction, which is why we continuously work
            to source products that meet the real needs of modern households and working
            contractors.
          </p>

          <h2>Our story</h2>
          <p>
            {site.name} was created with a vision to make online shopping easier, more
            affordable and more dependable. What began as a simple idea has grown into a
            catalog of {products.length} products across {collections.length} categories —
            from a two-seat playhouse to a full pallet of refrigerant.
          </p>
          <p>
            We ship from {site.address.city}, {site.address.regionName}, to all fifty states.
            As we continue to grow, we remain committed to expanding what we offer while
            maintaining the quality, service and trust our customers expect.
          </p>

          <h2>What we sell</h2>
          <p>
            Our catalog splits into two departments that share one checkout and one set of
            policies:
          </p>
          <ul>
            <li>
              <strong>Outdoor living</strong> — swing sets, playhouses, gazebos, pergolas,
              outdoor kitchens, saunas, greenhouses and carports. Complete kits with pre-cut
              lumber, labelled hardware and instructions in the box.
            </li>
            <li>
              <strong>Refrigerants and HVAC gases</strong> — factory-sealed R-410A, R-134a,
              R-1234yf, R-404A and legacy blends in cans, cylinders and pallet quantities,
              for licensed technicians.
            </li>
          </ul>

          <h2>Why shop with {site.name}?</h2>
          <ul>
            <li>
              <strong>Quality products.</strong> We select products that meet our standards
              for durability, function and value, and we drop the ones that do not.
            </li>
            <li>
              <strong>Competitive pricing.</strong> The price on the product page is the
              price at checkout. Shipping is free, and we do not add surcharges at the last
              step.
            </li>
            <li>
              <strong>Secure and reliable service.</strong> An encrypted checkout, PCI DSS
              certified payment processing, and order handling that starts the same day.
            </li>
            <li>
              <strong>Dedicated support.</strong> A real team, reachable by phone and email,
              that replies within one business day.
            </li>
          </ul>

          <h2>Our commitment</h2>
          <p>
            Customer satisfaction sits at the heart of everything we do. We are building
            long-term relationships through transparency, reliability and service that
            continues after the box arrives — which is why every product carries a{' '}
            {site.warranty.label} and a {site.returns.windowDays}-day return window with no
            restocking fee.
          </p>
          <p>Thank you for choosing {site.name}. We appreciate your trust.</p>
        </div>

        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="rounded-2xl border border-ink/10 bg-sand p-6">
            <h2 className="font-display text-[20px] tracking-tight">Business details</h2>
            <dl className="mt-4 space-y-3 text-[14px]">
              <div>
                <dt className="text-ink-muted">Legal entity</dt>
                <dd className="font-medium">{site.legalName}</dd>
              </div>
              <div>
                <dt className="text-ink-muted">Trading as</dt>
                <dd className="font-medium">{site.name}</dd>
              </div>
              <div>
                <dt className="text-ink-muted">Ships to</dt>
                <dd className="font-medium">All 50 U.S. states</dd>
              </div>
              <div>
                <dt className="text-ink-muted">Currency</dt>
                <dd className="font-medium">U.S. Dollars (USD)</dd>
              </div>
            </dl>

            <address className="mt-5 space-y-2.5 border-t border-ink/10 pt-5 text-[14px] not-italic">
              <a
                href={`tel:${site.contact.phoneHref}`}
                className="flex items-center gap-2.5 font-medium hover:text-moss-700"
              >
                <PhoneIcon className="h-4 w-4 text-moss-600" />
                {site.contact.phone}
              </a>
              <a
                href={`mailto:${site.contact.email}`}
                className="flex items-center gap-2.5 font-medium hover:text-moss-700"
              >
                <MailIcon className="h-4 w-4 text-moss-600" />
                {site.contact.email}
              </a>
              <span className="flex items-start gap-2.5 text-ink-soft">
                <PinIcon className="mt-0.5 h-4 w-4 shrink-0 text-moss-600" />
                {site.address.formatted}
              </span>
            </address>

            <Link href="/contact" className="btn-primary mt-5 w-full">
              Contact us
            </Link>
          </div>

          <ul className="mt-6 space-y-3">
            {[
              'Free standard shipping on every order',
              `${site.returns.windowDays}-day returns, no restocking fee`,
              site.warranty.label,
              'US-based customer support',
            ].map((item) => (
              <li key={item} className="flex gap-2.5 text-[14px] text-ink-soft">
                <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-moss-600" />
                {item}
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}
