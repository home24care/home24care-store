'use client';

import { usePathname } from 'next/navigation';
import ChatWidget from './ChatWidget';

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
  cart,
  tracker,
  children,
}: {
  header: React.ReactNode;
  footer: React.ReactNode;
  cart: React.ReactNode;
  tracker: React.ReactNode;
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
      {cart}
      {tracker}
      {/*
        Rendered here rather than in the root layout so it never appears on
        /admin — the agent answering chat has the console, and a launcher over
        their own dashboard would only get in the way.
      */}
      <ChatWidget />
    </>
  );
}
