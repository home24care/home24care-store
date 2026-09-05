import type { Metadata, Viewport } from 'next';
import './globals.css';
import { CartProvider } from '@/lib/cart';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import JsonLd from '@/components/JsonLd';
import { collectionGroups } from '@/lib/catalog';
import { site } from '@/lib/site';
import { organizationSchema, websiteSchema } from '@/lib/schema';

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} — Outdoor Living & Refrigerants`,
    template: `%s | ${site.name}`,
  },
  description: site.description,
  applicationName: site.name,
  keywords: [
    'swing sets',
    'gazebos',
    'pergolas',
    'outdoor kitchens',
    'backyard saunas',
    'greenhouses',
    'R-410A refrigerant',
    'R-134a refrigerant',
    'HVAC refrigerant',
  ],
  authors: [{ name: site.legalName }],
  creator: site.legalName,
  publisher: site.legalName,
  formatDetection: { telephone: true, address: false, email: true },
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: site.name,
    title: `${site.name} — Outdoor Living & Refrigerants`,
    description: site.description,
    url: site.url,
    locale: 'en_US',
    images: [{ url: '/logo.png', width: 1024, height: 1024, alt: site.name }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${site.name} — Outdoor Living & Refrigerants`,
    description: site.description,
    images: ['/logo.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  icons: { icon: '/logo.png', apple: '/logo.png' },
};

export const viewport: Viewport = {
  themeColor: '#274a37',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const groups = collectionGroups();

  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col">
        <JsonLd data={[organizationSchema(), websiteSchema()]} />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-moss-700 focus:px-4 focus:py-2 focus:text-white"
        >
          Skip to content
        </a>
        <CartProvider>
          <Header groups={groups} />
          <main id="main" className="flex-1">
            {children}
          </main>
          <Footer />
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}
