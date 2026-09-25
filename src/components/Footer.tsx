import Link from 'next/link';
import { site } from '@/lib/site';
import { collectionGroups } from '@/lib/catalog';
import { PhoneIcon, MailIcon, PinIcon, ClockIcon, ShieldIcon, LockIcon } from './icons';
import { TrustpilotFooter } from './TrustpilotSection';
import PaymentMarks from './PaymentMarks';
import Logo from './Logo';
import { TrustTicker, ElevateBand } from './StoreBands';

const POLICY_LINKS = [
  ['/policies/privacy', 'Privacy Policy'],
  ['/policies/terms', 'Terms of Service'],
  ['/policies/payment-security', 'Billing & Payment Security'],
  ['/policies/order-acceptance', 'Order Acceptance & Cancellation'],
  ['/policies/shipping', 'Shipping Policy'],
  ['/policies/returns', 'Refund and Returns Policy'],
  ['/policies/authenticity', 'Authenticity Guarantee'],
  ['/policies/accessibility', 'Accessibility'],
] as const;

const QUICK_LINKS = [
  ['/', 'Home'],
  ['/collections', 'Shop'],
  ['/order-status', 'Order Status'],
  ['/contact', 'Contact Us'],
  ['/about', 'About Us'],
  ['/faq', 'FAQ’s'],
] as const;

const BRANDS = [
  ['Topps', '/search?q=topps'],
  ['Bowman', '/search?q=bowman'],
  ['Panini', '/search?q=panini'],
  ['Pokémon', '/collections/pokemon'],
  ['Magic: The Gathering', '/collections/magic'],
] as const;

const linkList = 'mt-4 divide-y divide-ink/[0.07] border-y border-ink/[0.07] text-[13.5px]';
const linkItem = 'block py-2.5 text-ink-soft transition-colors hover:text-moss-500';

export default function Footer() {
  const categories = collectionGroups().flatMap((g) => g.collections);

  return (
    <footer className="mt-20">
      <ElevateBand />
      <TrustTicker />

      <div className="bg-sand">
        <div className="container-page grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr_1.2fr]">
          <div>
            <Link href="/" aria-label={`${site.name} home`}>
              <Logo />
            </Link>
            <p className="mt-5 max-w-sm text-[13.5px] leading-relaxed text-ink-soft">
              {site.name} is a U.S.-based hobby shop dedicated to sealed trading cards. We stock
              Topps, Bowman and Panini sports-card hobby boxes alongside Pokémon TCG and Magic:
              The Gathering, and ship every box factory sealed and packed to protect the seal.
            </p>

            <address className="mt-6 space-y-2.5 text-[13.5px] not-italic text-ink-soft">
              <span className="flex items-start gap-2.5">
                <PinIcon className="mt-0.5 h-4 w-4 shrink-0 text-moss-400" />
                <span>
                  <strong className="font-semibold text-ink">Address:</strong> {site.address.formatted}
                </span>
              </span>
              <a href={`tel:${site.contact.phoneHref}`} className="flex items-center gap-2.5 hover:text-moss-500">
                <PhoneIcon className="h-4 w-4 shrink-0 text-moss-400" />
                <span>
                  <strong className="font-semibold text-ink">Phone:</strong> {site.contact.phone}
                </span>
              </a>
              <a href={`mailto:${site.contact.email}`} className="flex items-center gap-2.5 hover:text-moss-500">
                <MailIcon className="h-4 w-4 shrink-0 text-moss-400" />
                <span>
                  <strong className="font-semibold text-ink">Email:</strong> {site.contact.email}
                </span>
              </a>
            </address>

            <div className="mt-6 max-w-xs">
              <p className="flex items-center gap-2 text-[14px] font-semibold text-ink">
                <ClockIcon className="h-4 w-4 text-moss-400" />
                Business Hours
              </p>
              <dl className="mt-2 divide-y divide-ink/[0.07] text-[13px]">
                {site.contact.schedule.map(([day, hours]) => (
                  <div key={day} className="flex justify-between py-2">
                    <dt className="text-ink-soft">{day}</dt>
                    <dd className="text-ink-soft">{hours}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-ink/10 bg-white px-3 py-1.5 text-[11.5px] font-semibold text-ink-soft">
                <ShieldIcon className="h-3.5 w-3.5 text-moss-400" /> 100% Authentic
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-ink/10 bg-white px-3 py-1.5 text-[11.5px] font-semibold text-ink-soft">
                <LockIcon className="h-3.5 w-3.5 text-moss-400" /> Secure Checkout
              </span>
            </div>

            <TrustpilotFooter />
          </div>

          <nav aria-label="Categories">
            <h2 className="font-display text-[15px] uppercase tracking-[0.06em] text-ink">Our Categories</h2>
            <ul className={linkList}>
              {categories.map((c) => (
                <li key={c.slug}>
                  <Link href={`/collections/${c.slug}`} className={linkItem}>
                    {c.title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Brands">
            <h2 className="font-display text-[15px] uppercase tracking-[0.06em] text-ink">Our Brands</h2>
            <ul className={linkList}>
              {BRANDS.map(([label, href]) => (
                <li key={label}>
                  <Link href={href} className={linkItem}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Quick links">
            <h2 className="font-display text-[15px] uppercase tracking-[0.06em] text-ink">Quick Links</h2>
            <ul className={linkList}>
              {QUICK_LINKS.map(([href, label]) => (
                <li key={href}>
                  <Link href={href} className={linkItem}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Policies">
            <h2 className="font-display text-[15px] uppercase tracking-[0.06em] text-ink">Our Policies</h2>
            <ul className={linkList}>
              {POLICY_LINKS.map(([href, label]) => (
                <li key={href}>
                  <Link href={href} className={linkItem}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="border-t border-ink/10">
          <div className="container-page flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[12px] uppercase tracking-[0.06em] text-ink-muted">
              © {new Date().getFullYear()} {site.name}. All rights reserved.
            </p>
            <PaymentMarks size="small" />
          </div>
        </div>
      </div>
    </footer>
  );
}
