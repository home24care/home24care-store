'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CloseIcon } from './icons';

type RecentSale = {
  firstName: string | null;
  region: string | null;
  product: string;
  ts: number;
};

/** Wait before the first toast, so it does not land on top of page load. */
const FIRST_DELAY_MS = 9000;
/** How long each toast stays. */
const VISIBLE_MS = 6500;
/** Gap between toasts. Deliberately long — this is a nudge, not a slot machine. */
const GAP_MS = 22000;
const DISMISSED_KEY = 'h24c_sales_toast_dismissed';

/**
 * Recent-sale notifications.
 *
 * Every toast is a real paid order, read from /api/sales/recent. When there
 * have been no orders the endpoint returns nothing and this renders nothing —
 * there is no seeded or sample mode, because a notification for a sale that
 * did not happen is a deceptive practice, not a growth tactic.
 *
 * Dismissing it silences the feed for the rest of the browser session. A
 * visitor who has said no should not be asked again on the next page.
 */
export default function SalesNotifications() {
  const [mounted, setMounted] = useState(false);
  const [sales, setSales] = useState<RecentSale[]>([]);
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    setMounted(true);
    try {
      if (sessionStorage.getItem(DISMISSED_KEY)) setDismissed(true);
    } catch {
      /* private mode */
    }
  }, []);

  useEffect(() => {
    if (!mounted || dismissed) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/sales/recent');
        if (!res.ok) return;
        const data = (await res.json()) as { sales?: RecentSale[] };
        if (!cancelled && data.sales?.length) setSales(data.sales);
      } catch {
        /* Social proof is not worth a retry loop. */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mounted, dismissed]);

  // Cycle: wait, show, hide, wait, show the next one.
  useEffect(() => {
    if (!sales.length || dismissed) return;

    const clear = () => {
      timers.current.forEach((t) => window.clearTimeout(t));
      timers.current = [];
    };

    const run = (delay: number) => {
      timers.current.push(
        window.setTimeout(() => {
          setVisible(true);
          timers.current.push(
            window.setTimeout(() => {
              setVisible(false);
              setIndex((i) => (i + 1) % sales.length);
              run(GAP_MS);
            }, VISIBLE_MS)
          );
        }, delay)
      );
    };

    run(FIRST_DELAY_MS);
    return clear;
  }, [sales, dismissed]);

  if (!mounted || dismissed || !sales.length) return null;

  const sale = sales[index];
  if (!sale) return null;

  const ago = (ts: number) => {
    const mins = Math.max(1, Math.round((Date.now() - ts) / 60000));
    if (mins < 60) return `${mins} min${mins === 1 ? '' : 's'} ago`;
    const hours = Math.round(mins / 60);
    if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    const days = Math.round(hours / 24);
    return `${days} day${days === 1 ? '' : 's'} ago`;
  };

  const who = sale.firstName
    ? sale.region
      ? `${sale.firstName} from ${sale.region}`
      : sale.firstName
    : sale.region
      ? `A customer in ${sale.region}`
      : 'A customer';

  const dismiss = () => {
    setDismissed(true);
    setVisible(false);
    try {
      sessionStorage.setItem(DISMISSED_KEY, '1');
    } catch {
      /* ignore */
    }
  };

  return createPortal(
    <div
      // Above the page, below the chat panel and its launcher.
      className={`fixed bottom-5 left-5 z-[60] w-[min(360px,calc(100vw-2.5rem))] transition-all duration-500 ${
        visible
          ? 'pointer-events-auto translate-y-0 opacity-100'
          : 'pointer-events-none translate-y-3 opacity-0'
      }`}
      // Announced politely: useful if heard, never interrupting.
      role="status"
      aria-live="polite"
      aria-hidden={!visible}
    >
      <div className="flex items-start gap-3 rounded-2xl border border-ink/10 bg-white p-3 pr-2 shadow-lift">
        <span className="relative mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-moss-100 text-moss-700">
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
            <path
              d="M6 2h12l1 5H5l1-5Zm-1 5v13a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V7M9 11a3 3 0 0 0 6 0"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span
            className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500"
            aria-hidden="true"
          />
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-[14px] leading-snug text-ink-soft">
            <strong className="font-semibold text-ink">{who}</strong> bought
          </p>
          <p className="truncate text-[14px] font-semibold leading-snug text-ink">
            {sale.product}
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-[11.5px] font-semibold uppercase tracking-wide text-moss-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
            {ago(sale.ts)}
          </p>
        </div>

        <button
          type="button"
          onClick={dismiss}
          aria-label="Hide these notifications"
          className="-mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-ink/5 hover:text-ink"
        >
          <CloseIcon className="h-4 w-4" />
        </button>
      </div>
    </div>,
    document.body
  );
}
