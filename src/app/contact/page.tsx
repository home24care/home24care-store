import type { Metadata } from 'next';
import Link from 'next/link';
import Breadcrumbs from '@/components/Breadcrumbs';
import ContactForm from '@/components/ContactForm';
import { site } from '@/lib/site';
import { PhoneIcon, MailIcon, PinIcon, SupportIcon } from '@/components/icons';

export const metadata: Metadata = {
  title: 'Contact Us',
  description: `Contact ${site.name} — call ${site.contact.phone}, email ${site.contact.email}, or write to ${site.address.formatted}. We reply to every message within one business day.`,
  alternates: { canonical: '/contact' },
};

export default function ContactPage() {
  return (
    <div className="container-page pb-16">
      <Breadcrumbs trail={[{ name: 'Contact us', url: '/contact' }]} />

      <header className="max-w-3xl pb-10">
        <p className="eyebrow mb-2">Contact</p>
        <h1 className="font-display text-[36px] leading-[1.08] tracking-tight sm:text-[46px]">
          Talk to a real person
        </h1>
        <p className="mt-4 text-[17px] leading-relaxed text-ink-soft">
          Whether you have a question about a release, are chasing a delivery, or need to
          start a return — call, email, or send us a message below. {site.contact.responseTime}
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr] lg:gap-12">
        <div>
          <ul className="space-y-4">
            {[
              {
                Icon: PhoneIcon,
                label: 'Call us',
                value: site.contact.phone,
                href: `tel:${site.contact.phoneHref}`,
                note: site.contact.hours,
              },
              {
                Icon: MailIcon,
                label: 'Email us',
                value: site.contact.email,
                href: `mailto:${site.contact.email}`,
                note: 'Replies within one business day',
              },
              {
                Icon: PinIcon,
                label: 'Write to us',
                value: site.address.formatted,
                href: null,
                note: `${site.legalName}`,
              },
              {
                Icon: SupportIcon,
                label: 'Support hours',
                value: site.contact.hours,
                href: null,
                note: 'Closed on U.S. public holidays',
              },
            ].map(({ Icon, label, value, href, note }) => (
              <li key={label} className="flex gap-4 rounded-2xl border border-ink/10 bg-white p-5 shadow-card">
                <Icon className="mt-0.5 h-5 w-5 shrink-0 text-moss-600" />
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold uppercase tracking-[0.1em] text-ink-muted">
                    {label}
                  </p>
                  {href ? (
                    <a href={href} className="mt-1 block text-[16px] font-semibold hover:text-moss-700">
                      {value}
                    </a>
                  ) : (
                    <p className="mt-1 text-[16px] font-semibold">{value}</p>
                  )}
                  <p className="mt-0.5 text-[13px] text-ink-muted">{note}</p>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-6 rounded-2xl bg-sand p-6">
            <h2 className="font-display text-[20px] tracking-tight">Common questions</h2>
            <ul className="mt-3 space-y-2 text-[14px]">
              {[
                ['/order-status', 'Where is my order?'],
                ['/policies/returns#start-a-return', 'How do I start a return?'],
                ['/policies/shipping', 'How long does shipping take?'],
                ['/policies/authenticity', 'What does the Authenticity Guarantee cover?'],
                ['/faq', 'See all FAQs'],
              ].map(([href, label]) => (
                <li key={href}>
                  <Link href={href} className="font-medium text-moss-700 underline underline-offset-2 hover:text-moss-800">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <ContactForm />
      </div>
    </div>
  );
}
