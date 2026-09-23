import Link from 'next/link';
import Image from 'next/image';
import { site } from '@/lib/site';
import { collectionGroups } from '@/lib/catalog';
import { PhoneIcon, MailIcon, PinIcon, TruckIcon, ReturnIcon, ShieldIcon, SupportIcon } from './icons';
import { TrustpilotFooter } from './TrustpilotSection';
import PaymentMarks from './PaymentMarks';

const POLICY_LINKS = [
  ['/policies/shipping', 'Shipping Policy'],
  ['/policies/returns', 'Refunds & Returns'],
  ['/policies/warranty', 'Warranty & Replacements'],
  ['/policies/order-acceptance', 'Order Acceptance & Cancellation'],
  ['/policies/payment-security', 'Secure Payment & Security'],
  ['/policies/privacy', 'Privacy Policy'],
  ['/policies/terms', 'Terms of Service'],
  ['/policies/accessibility', 'Accessibility'],
] as const;

const HELP_LINKS = [
  ['/contact', 'Contact us'],
  ['/faq', 'FAQs'],
  ['/order-status', 'Track your order'],
  ['/about', 'About Home24Care'],
  ['/policies/returns#start-a-return', 'Start a return'],
] as const;

export default function Footer() {
  const groups = collectionGroups();

  return (
    <footer className="mt-20 border-t border-ink/10 bg-white">
      {/* Reassurance strip */}
      <div className="border-b border-ink/10 bg-sand">
        <div className="container-page grid grid-cols-2 gap-6 py-9 lg:grid-cols-4">
          {[
            [TruckIcon, 'Free standard shipping', `Ships in ${site.shipping.handlingTime}, arrives in ${site.shipping.transitTime}.`],
            [ReturnIcon, `${site.returns.windowDays}-day returns`, 'No restocking fees. Refunds to your original payment method.'],
            [ShieldIcon, site.warranty.label, 'Our minimum on everything we sell — longer where the maker offers it.'],
            [SupportIcon, 'Talk to a human', `${site.contact.hours}. ${site.contact.responseTime}`],
          ].map(([Icon, title, body]) => {
            const I = Icon as typeof TruckIcon;
            return (
              <div key={title as string} className="flex gap-3">
                <I className="mt-0.5 h-6 w-6 shrink-0 text-moss-600" />
                <div>
                  <p className="text-[14px] font-semibold">{title as string}</p>
                  <p className="mt-0.5 text-[13px] leading-snug text-ink-muted">{body as string}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="container-page grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="" width={44} height={44} className="h-10 w-10 rounded-md object-contain" />
            <span className="font-display text-[22px] font-semibold tracking-tight">{site.name}</span>
          </Link>
          <p className="mt-4 max-w-sm text-[14px] leading-relaxed text-ink-soft">
            {site.description}
          </p>

          <address className="mt-6 space-y-2.5 text-[14px] not-italic text-ink-soft">
            <a href={`tel:${site.contact.phoneHref}`} className="flex items-center gap-2.5 hover:text-moss-700">
              <PhoneIcon className="h-4 w-4 shrink-0 text-moss-600" />
              {site.contact.phone}
            </a>
            <a href={`mailto:${site.contact.email}`} className="flex items-center gap-2.5 hover:text-moss-700">
              <MailIcon className="h-4 w-4 shrink-0 text-moss-600" />
              {site.contact.email}
            </a>
            <span className="flex items-start gap-2.5">
              <PinIcon className="mt-0.5 h-4 w-4 shrink-0 text-moss-600" />
              {site.address.formatted}
            </span>
          </address>

          <TrustpilotFooter />
        </div>

        <nav aria-label="Shop">
          <h2 className="text-[13px] font-bold uppercase tracking-[0.14em] text-ink">Shop</h2>
          <ul className="mt-4 space-y-2.5 text-[14px]">
            {groups.flatMap((g) => g.collections).slice(0, 9).map((c) => (
              <li key={c.slug}>
                <Link href={`/collections/${c.slug}`} className="text-ink-soft hover:text-moss-700">
                  {c.title}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/collections" className="font-semibold text-moss-700 hover:text-moss-800">
                All collections →
              </Link>
            </li>
          </ul>
        </nav>

        <nav aria-label="Customer service">
          <h2 className="text-[13px] font-bold uppercase tracking-[0.14em] text-ink">Help</h2>
          <ul className="mt-4 space-y-2.5 text-[14px]">
            {HELP_LINKS.map(([href, label]) => (
              <li key={href}>
                <Link href={href} className="text-ink-soft hover:text-moss-700">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Policies">
          <h2 className="text-[13px] font-bold uppercase tracking-[0.14em] text-ink">Policies</h2>
          <ul className="mt-4 space-y-2.5 text-[14px]">
            {POLICY_LINKS.map(([href, label]) => (
              <li key={href}>
                <Link href={href} className="text-ink-soft hover:text-moss-700">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="border-t border-ink/10">
        <div className="container-page flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[13px] text-ink-muted">
            © {new Date().getFullYear()} {site.legalName}. All rights reserved.
          </p>
          <div className="flex items-center gap-3">
            <span className="text-[13px] text-ink-muted">We accept</span>
            <PaymentMarks size="small" />
          </div>
        </div>
      </div>
    </footer>
  );
}
