import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import './globals.css';
import { CartProvider } from '@/lib/cart';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import AnalyticsTracker from '@/components/AnalyticsTracker';
import StorefrontChrome from '@/components/StorefrontChrome';
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
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: site.name }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${site.name} — Outdoor Living & Refrigerants`,
    description: site.description,
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
};

/** GA4 measurement id. Public by design; an env var overrides it per deploy. */
const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? 'G-1RGPPFFLKK';

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
        {/*
          Google Analytics 4.
          Google's own snippet says to paste it immediately after <head>. In the
          App Router that tag cannot be hand-placed, and next/script is the
          supported equivalent: it emits the same gtag.js and config call, but
          `afterInteractive` runs it once the page is interactive instead of
          blocking first paint. GA records the pageview either way.
          The measurement id is a public identifier, so it is committed rather
          than kept in an env var — though the env var still overrides it, which
          is what a staging deploy wants so its traffic does not land in the
          production property.
        */}
        {GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-config" strategy="afterInteractive">
              {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_ID}');`}
            </Script>
          </>
        )}
        <JsonLd data={[organizationSchema(), websiteSchema()]} />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-moss-700 focus:px-4 focus:py-2 focus:text-white"
        >
          Skip to content
        </a>
        <CartProvider>
          <StorefrontChrome
            header={<Header groups={groups} />}
            footer={<Footer />}
            cart={<CartDrawer />}
            tracker={<AnalyticsTracker />}
          >
            {children}
          </StorefrontChrome>
        </CartProvider>
      </body>
    </html>
  );
}
