import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import Breadcrumbs from '@/components/Breadcrumbs';
import { AdvantageGrid } from '@/components/StoreBands';
import { site } from '@/lib/site';
import { products, collections } from '@/lib/catalog';
import { IMAGES_LOCALIZED } from '@/lib/image';
import { CheckIcon, PhoneIcon, MailIcon, PinIcon } from '@/components/icons';

export const metadata: Metadata = {
  title: 'About Us',
  description: `${site.name} is a U.S.-based hobby shop selling factory-sealed sports-card hobby boxes, Pokémon TCG and Magic: The Gathering, shipped free from ${site.address.city}, ${site.address.region}. Learn who we are and how to reach us.`,
  alternates: { canonical: '/about' },
};

export default function AboutPage() {
  const gallery = products.filter((p) => p.images.length > 0).slice(0, 4);

  return (
    <div className="container-page pb-6">
      <Breadcrumbs trail={[{ name: 'About us', url: '/about' }]} />

      <header className="mx-auto max-w-3xl pb-10 text-center">
        <p className="eyebrow mb-2">About us</p>
        <h1 className="font-display text-[34px] uppercase leading-[1.08] tracking-[0.02em] sm:text-[44px]">
          Welcome to {site.name}
        </h1>
        <p className="mt-4 text-[17px] leading-relaxed text-ink-soft">
          We are a team of collectors running the hobby shop we always wanted to buy from:
          factory-sealed boxes, honest descriptions, packing that protects the seal, and people
          who answer the phone.
        </p>
      </header>

      <div className="mb-14 grid grid-cols-2 gap-3 rounded-md bg-sand p-4 sm:grid-cols-4">
        {gallery.map((p, i) => (
          <div key={p.id} className="relative aspect-square overflow-hidden rounded-md bg-white">
            <Image
              src={p.images[0].card}
              alt={p.images[0].alt || p.title}
              fill
              sizes="(min-width: 640px) 25vw, 50vw"
              priority={i < 2}
              unoptimized={IMAGES_LOCALIZED}
              className="object-contain p-4"
            />
          </div>
        ))}
      </div>

      <div className="grid gap-12 lg:grid-cols-[1.5fr_1fr] lg:gap-16">
        <div className="prose-policy max-w-2xl">
          <h2>Our mission</h2>
          <p>
            Buying sealed product online should not feel like a gamble before you have even
            opened the box. Our mission is simple: sell authentic, factory-sealed trading cards
            at clear prices, describe every release exactly as the manufacturer made it, and
            get it to your door in the condition it left the factory.
          </p>

          <h2>What we sell</h2>
          <p>
            We carry {products.length} carefully chosen releases across {collections.length}{' '}
            categories — the boxes collectors are actually chasing:
          </p>
          <ul>
            <li>
              <strong>Sports-card hobby boxes</strong> — Topps Chrome, Cosmic Chrome and
              Sapphire, Bowman and Bowman Chrome, Topps Chrome UFC and Panini Prizm FIFA World
              Cup.
            </li>
            <li>
              <strong>Trading card games</strong> — Pokémon TCG Elite Trainer Boxes and cases,
              and Magic: The Gathering Collector Booster boxes.
            </li>
          </ul>

          <h2>Why collectors shop with {site.name}</h2>
          <ul>
            <li>
              <strong>100% authentic, never resealed.</strong> Every box is brand new in its
              original manufacturer seal. We never sell searched, weighed or re-wrapped product.
            </li>
            <li>
              <strong>Packed like a collectible.</strong> Bubble wrap, a rigid carton and void
              fill on every order — never a padded mailer.
            </li>
            <li>
              <strong>Straight answers.</strong> Box break averages are the manufacturer&apos;s
              published figures, and we tell you plainly that pack contents are random.
            </li>
            <li>
              <strong>Secure checkout.</strong> Card payments are processed by a PCI DSS Level 1
              certified provider; we never see or store your card number.
            </li>
          </ul>

          <h2>Our commitment</h2>
          <p>
            Every order is backed by our {site.warranty.label} and a{' '}
            {site.returns.windowDays}-day return window on unopened product, with no restocking
            fee. If something is not right, contact us before you open the box and we will make
            it right.
          </p>
          <p>Thank you for choosing {site.name}. Good luck with the rip.</p>
        </div>

        <aside className="lg:sticky lg:top-40 lg:self-start">
          <div className="rounded-md border border-ink/10 bg-sand p-6">
            <h2 className="font-display text-[18px] uppercase tracking-[0.04em]">Business details</h2>
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
              <a href={`tel:${site.contact.phoneHref}`} className="flex items-center gap-2.5 font-medium hover:text-moss-500">
                <PhoneIcon className="h-4 w-4 text-moss-400" />
                {site.contact.phone}
              </a>
              <a href={`mailto:${site.contact.email}`} className="flex items-center gap-2.5 font-medium hover:text-moss-500">
                <MailIcon className="h-4 w-4 text-moss-400" />
                {site.contact.email}
              </a>
              <span className="flex items-start gap-2.5 text-ink-soft">
                <PinIcon className="mt-0.5 h-4 w-4 shrink-0 text-moss-400" />
                {site.address.formatted}
              </span>
            </address>

            <Link href="/contact" className="btn-primary mt-5 w-full">
              Contact us
            </Link>
          </div>

          <ul className="mt-6 space-y-3">
            {[
              'Free U.S. shipping on every order',
              `${site.returns.windowDays}-day returns on unopened product`,
              site.warranty.label,
              'U.S.-based collector support',
            ].map((item) => (
              <li key={item} className="flex gap-2.5 text-[14px] text-ink-soft">
                <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-moss-400" />
                {item}
              </li>
            ))}
          </ul>
        </aside>
      </div>

      <AdvantageGrid />
    </div>
  );
}
