import type { Metadata } from 'next';
import Link from 'next/link';
import Breadcrumbs from '@/components/Breadcrumbs';
import { site } from '@/lib/site';
import { MailIcon, PhoneIcon, TruckIcon } from '@/components/icons';

export const metadata: Metadata = {
  title: 'Track Your Order',
  description: `Find your tracking number, check delivery timings, or ask us where your ${site.name} order is.`,
  alternates: { canonical: '/order-status' },
};

const STEPS = [
  {
    title: 'Order confirmed',
    body: 'You receive a confirmation email with your receipt within a few minutes of checkout.',
  },
  {
    title: 'Preparing your order',
    body: `We pick and pack within ${site.shipping.handlingTime}. Orders placed before ${site.shipping.cutOff} on a business day ship the next business day.`,
  },
  {
    title: 'Shipped',
    body: 'A second email arrives with your carrier and tracking number. Allow up to 48 hours for the first carrier scan to appear.',
  },
  {
    title: 'Out for delivery',
    body: `Boxes arrive in ${site.shipping.transitTime}. Orders above $1,000 need a signature on delivery.`,
  },
];

export default function OrderStatusPage() {
  return (
    <div className="container-page pb-16">
      <Breadcrumbs trail={[{ name: 'Track your order', url: '/order-status' }]} />

      <header className="max-w-3xl pb-10">
        <p className="eyebrow mb-2">Order status</p>
        <h1 className="font-display text-[36px] leading-[1.08] tracking-tight sm:text-[46px]">
          Where is my order?
        </h1>
        <p className="mt-4 text-[17px] leading-relaxed text-ink-soft">
          Every order gets two emails: a confirmation at checkout, and a tracking number the
          moment it ships. Here is what happens between them.
        </p>
      </header>

      <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((step, i) => (
          <li key={step.title} className="rounded-2xl border border-ink/10 bg-white p-6 shadow-card">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-moss-100 text-[14px] font-bold text-moss-800">
              {i + 1}
            </span>
            <h2 className="mt-3 text-[16px] font-semibold">{step.title}</h2>
            <p className="mt-1.5 text-[14px] leading-relaxed text-ink-soft">{step.body}</p>
          </li>
        ))}
      </ol>

      <section className="mt-12 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl bg-sand p-7">
          <TruckIcon className="h-6 w-6 text-moss-600" />
          <h2 className="mt-3 font-display text-[22px] tracking-tight">
            Tracking not updating?
          </h2>
          <p className="mt-2 text-[14.5px] leading-relaxed text-ink-soft">
            It can take up to 48 hours after you receive the shipping email for the carrier to
            register the first scan. Until then, the tracking page may look empty even though
            your package is already moving.
          </p>
          <p className="mt-3 text-[14.5px] leading-relaxed text-ink-soft">
            If your order has not arrived within 20 days of the shipping confirmation, contact
            us with your name and order number and we will open a trace with the carrier the
            same day.
          </p>
        </div>

        <div className="rounded-2xl border border-ink/10 bg-white p-7 shadow-card">
          <h2 className="font-display text-[22px] tracking-tight">Ask us directly</h2>
          <p className="mt-2 text-[14.5px] leading-relaxed text-ink-soft">
            Send your order number and we will tell you exactly where your order is.{' '}
            {site.contact.responseTime}
          </p>
          <ul className="mt-5 space-y-3 text-[15px]">
            <li>
              <a
                href={`mailto:${site.contact.email}?subject=${encodeURIComponent('Order status request')}`}
                className="flex items-center gap-2.5 font-semibold hover:text-moss-700"
              >
                <MailIcon className="h-4 w-4 text-moss-600" />
                {site.contact.email}
              </a>
            </li>
            <li>
              <a
                href={`tel:${site.contact.phoneHref}`}
                className="flex items-center gap-2.5 font-semibold hover:text-moss-700"
              >
                <PhoneIcon className="h-4 w-4 text-moss-600" />
                {site.contact.phone}
              </a>
            </li>
          </ul>
          <p className="mt-3 text-[13px] text-ink-muted">{site.contact.hours}</p>
          <Link href="/contact" className="btn-primary mt-5">
            Contact us
          </Link>
        </div>
      </section>

      <p className="mt-8 text-[14px] text-ink-soft">
        Need to return something instead?{' '}
        <Link href="/policies/returns#start-a-return" className="font-semibold text-moss-700 underline underline-offset-2">
          Start a return →
        </Link>
      </p>
    </div>
  );
}
