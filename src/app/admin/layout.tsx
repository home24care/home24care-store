import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { site } from '@/lib/site';

export const metadata: Metadata = {
  title: { default: 'Admin', template: `%s · ${site.name} Admin` },
  robots: { index: false, follow: false, nocache: true },
};

/**
 * The admin area deliberately does not reuse the storefront Header/Footer.
 * It has no cart, no nav, and must never be mistaken for a customer-facing
 * page — nor should storefront JS load here.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-sand">
      {/* The storefront chrome is suppressed for /admin — see StorefrontChrome. */}
      <header className="border-b border-ink/10 bg-white">
        <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/admin" className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="" width={28} height={28} className="h-7 w-7 rounded object-contain" />
            <span className="font-display text-[17px] font-semibold tracking-tight">
              {site.name} <span className="text-ink-muted">Admin</span>
            </span>
          </Link>

          <div className="flex items-center gap-4 text-[13px]">
            <Link href="/" className="text-ink-soft hover:text-moss-700">
              View store ↗
            </Link>
            <form action="/api/admin/logout" method="post">
              <button type="submit" className="font-medium text-ink-soft hover:text-clay-700">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main id="main">{children}</main>
    </div>
  );
}
