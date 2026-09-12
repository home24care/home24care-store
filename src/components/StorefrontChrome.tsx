'use client';

import { usePathname } from 'next/navigation';
import AnalyticsTracker from './AnalyticsTracker';
import CartDrawer from './CartDrawer';
import ChatWidget from './ChatWidget';
import SalesNotifications from './SalesNotifications';

/**
 * Renders the storefront header, footer and cart everywhere except /admin.
 *
 * A nested layout in the App Router still sits *inside* the root layout, so
 * src/app/admin/layout.tsx alone could not stop the shop chrome rendering
 * above the dashboard. The architecturally pure alternative is two root
 * layouts behind route groups, which would mean relocating every storefront
 * route for one private page — not worth it.
 *
 * The slots are server components passed through as props, so nothing about
 * the storefront becomes client-rendered; this only decides whether to render
 * them at all.
 */
export default function StorefrontChrome({
  header,
  footer,
  children,
}: {
  header: React.ReactNode;
  footer: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin') ?? false;

  if (isAdmin) return <>{children}</>;

  return (
    <>
      {header}
      <main id="main" className="flex-1">
        {children}
      </main>
      {footer}
      {/*
        CartDrawer and AnalyticsTracker are rendered here rather than passed
        down as slots from the root layout.

        Both are 'use client', so routing them through props bought nothing --
        and it cost a real bug. A client element handed across the RSC
        boundary as a prop arrives as a lazy chunk reference, not an element.
        React's jsx-dev-runtime stamps _store.validated only on values whose
        $$typeof is REACT_ELEMENT_TYPE, so a lazy slot sitting in this
        fragment's static children array never gets stamped; reconciliation
        then resolves the lazy, sees validated=0 with key=null, and emits
        "Each child in a list should have a unique key" -- attributed to the
        element's origin in layout.tsx, one module away from this array.

        Created locally they are ordinary elements at jsxs() time, get
        validated=1, and the check cannot fire. header and footer stay as
        props: footer is a Server Component, which is what the pattern is
        actually for, and an inline element prop is serialized whole rather
        than outlined into a lazy row.
      */}
      <CartDrawer />
      <AnalyticsTracker />
      {/*
        Rendered here rather than in the root layout so it never appears on
        /admin — the agent answering chat has the console, and a launcher over
        their own dashboard would only get in the way.
      */}
      <ChatWidget />
      <SalesNotifications />
    </>
  );
}
