'use client';

import { forwardRef, type ReactNode } from 'react';
import Link from 'next/link';
import type { Appearance, CssFontSource } from '@stripe/stripe-js';
import { site } from '@/lib/site';

/*
  The pieces both checkout forms share — the Checkout Session form
  (CheckoutForm) and the PaymentIntent form it falls back to
  (CheckoutIntentForm) — so the two cannot drift apart in look or wording.
*/

/**
 * Stripe draws its fields in iframes, so no site CSS reaches them. These
 * values make them match our own inputs below (FIELD, LABEL): Karla, labels
 * above, the same border, radius and moss focus ring. Everything else is
 * Stripe's stock theme, card-brand marks and Link row included, so the form
 * still reads as Stripe's.
 */
const BORDER = '#c9ccca';
const ACCENT = '#5f9a70'; // moss-500

export const STRIPE_APPEARANCE: Appearance = {
  theme: 'stripe',
  labels: 'above',
  variables: {
    fontFamily: 'Karla, ui-sans-serif, system-ui, sans-serif',
    fontSizeBase: '15px',
    colorPrimary: ACCENT,
    colorText: '#1b1f1c',
    colorTextSecondary: '#454b47',
    colorTextPlaceholder: '#767d78',
    colorDanger: '#b42318',
    colorBackground: '#ffffff',
    borderRadius: '6px',
    spacingUnit: '4px',
  },
  rules: {
    '.Input': { border: `1px solid ${BORDER}`, boxShadow: 'none', padding: '12px' },
    '.Input:focus': { borderColor: ACCENT, boxShadow: `0 0 0 1px ${ACCENT}` },
    '.Label': { fontWeight: '500', color: '#1b1f1c', fontSize: '14px', marginBottom: '6px' },
    '.Tab': { border: `1px solid ${BORDER}`, boxShadow: 'none' },
    '.Tab--selected': { borderColor: ACCENT, boxShadow: `0 0 0 1px ${ACCENT}` },
  },
};

// Stripe's iframes cannot use the self-hosted next/font copy, so they load
// Karla from Google Fonts themselves.
export const STRIPE_FONTS: CssFontSource[] = [
  { cssSrc: 'https://fonts.googleapis.com/css2?family=Karla:wght@400;500;600;700&display=swap' },
];

/** Our own inputs, boxed exactly like Stripe's .Input rule above. */
export const FIELD =
  'block h-12 w-full rounded-md border border-[#c9ccca] bg-white px-3 text-[15px] text-ink placeholder:text-ink-muted outline-none transition-shadow focus:border-moss-500 focus:shadow-[0_0_0_1px_#5f9a70]';
export const LABEL = 'mb-1.5 block text-[14px] font-medium text-ink';
export const HELPER = 'mt-1.5 text-[12.5px] leading-snug text-ink-muted';

export function Section({
  id,
  title,
  note,
  className = 'mt-9',
  children,
}: {
  id: string;
  title: string;
  note?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={id} className={className}>
      <h2 id={id} className="font-display text-[21px] font-semibold text-ink">
        {title}
      </h2>
      {note ? <p className="mt-1 text-[13px] text-ink-muted">{note}</p> : null}
      <div className="mt-3">{children}</div>
    </section>
  );
}

/** The rule between the wallet buttons and the form. */
export function OrDivider() {
  return (
    <div className="mt-7 flex items-center gap-4" aria-hidden="true">
      <span className="h-px flex-1 bg-ink/10" />
      <span className="text-[11.5px] font-semibold uppercase tracking-[0.14em] text-ink-muted">or</span>
      <span className="h-px flex-1 bg-ink/10" />
    </div>
  );
}

/**
 * One option, priced at zero. Shown rather than hidden, because a checkout
 * that never mentions shipping reads as though a cost is about to appear.
 */
export function ShippingMethod() {
  return (
    <div className="flex min-w-0 items-center justify-between gap-4 rounded-md border border-moss-500 bg-moss-50 px-4 py-3.5 shadow-[0_0_0_1px_#5f9a70]">
      <span className="min-w-0">
        <span className="block text-[15px] font-semibold text-ink">Free shipping</span>
        <span className="block text-[13px] text-ink-soft">
          Dispatched in {site.shipping.handlingTime}, delivered in{' '}
          {site.shipping.transitTime.replace(/\s*\(.*\)$/, '')}
        </span>
      </span>
      <span className="shrink-0 text-[15px] font-semibold text-ink">Free</span>
    </div>
  );
}

const POLICY_LINK = 'font-medium text-moss-600 underline underline-offset-2';

/** Terms, Privacy and Returns, as one sentence of links. */
export function PolicyLinks() {
  return (
    <>
      <Link href="/policies/terms" className={POLICY_LINK}>Terms</Link>, the{' '}
      <Link href="/policies/privacy" className={POLICY_LINK}>Privacy Policy</Link> and the{' '}
      <Link href="/policies/returns" className={POLICY_LINK}>Return Policy</Link>
    </>
  );
}

export const TermsCheckbox = forwardRef<
  HTMLInputElement,
  { checked: boolean; onChange: (checked: boolean) => void }
>(function TermsCheckbox({ checked, onChange }, ref) {
  return (
    <label className="mt-8 flex cursor-pointer items-start gap-3 text-[14px] leading-relaxed text-ink-soft">
      <input
        ref={ref}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-4 w-4 shrink-0 accent-moss-500"
      />
      <span>
        I have read and accept the <PolicyLinks />.
      </span>
    </label>
  );
});

export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="mt-5 rounded-md border border-[#b42318]/30 bg-[#fef3f2] px-4 py-3 text-[14px] text-[#912018]">
      {message}
    </p>
  );
}

export function PlaceOrder({ busy, disabled, total }: { busy: boolean; disabled: boolean; total: string }) {
  return (
    <>
      <button type="submit" disabled={disabled || busy} className="btn-primary mt-6 w-full py-4 text-[14px]">
        {busy ? 'Processing…' : `Place order · ${total}`}
      </button>
      <p className="mt-3 text-center text-[12.5px] leading-relaxed text-ink-muted">
        No hidden costs. The amount above is what you pay, shipping is free, and every box
        ships sealed as described.
      </p>
    </>
  );
}
