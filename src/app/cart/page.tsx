import type { Metadata } from 'next';
import { Suspense } from 'react';
import CartPageClient from '@/components/CartPageClient';
import Breadcrumbs from '@/components/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Your Cart',
  description: 'Review the items in your cart and proceed to secure checkout.',
  robots: { index: false, follow: true },
  alternates: { canonical: '/cart' },
};

export default function CartPage() {
  return (
    <div className="container-page">
      <Breadcrumbs trail={[{ name: 'Cart', url: '/cart' }]} />
      <Suspense fallback={<div className="py-24 text-center text-ink-muted">Loading your cart…</div>}>
        <CartPageClient />
      </Suspense>
    </div>
  );
}
