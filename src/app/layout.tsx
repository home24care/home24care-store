import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { Karla, Lora } from 'next/font/google';
import './globals.css';
import { CartProvider } from '@/lib/cart';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import StorefrontChrome from '@/components/StorefrontChrome';
import JsonLd from '@/components/JsonLd';
import { collectionGroups } from '@/lib/catalog';
import { site } from '@/lib/site';
import { organizationSchema, websiteSchema } from '@/lib/schema';
import { GA_ID, ADS_ID } from '@/lib/gtag';

/**
 * Microsoft Clarity project id. Public, like the Google ids, and overridable
 * per deploy so a staging site does not pollute the production recordings.
 */
/*
  The hobby-shop pairing: Lora for headings, Karla for everything else.
  next/font self-hosts both at build time, so no request leaves for Google
  at runtime and there is no layout shift while they load.
*/
const sans = Karla({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-sans', display: 'swap' });
const display = Lora({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-display', display: 'swap' });

const CLARITY_ID = process.env.NEXT_PUBLIC_CLARITY_ID ?? 'ygx35r58b9';

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} — Sealed Sports Cards & Hobby Boxes`,
    template: `%s | ${site.name}`,
  },
  description: site.description,
  applicationName: site.name,
  keywords: [
    'hobby boxes',
    'sports cards',
    'Topps Chrome hobby box',
    'Bowman baseball hobby box',
    'Panini Prizm World Cup',
    'Pokemon elite trainer box',
    'Magic the Gathering collector booster box',
    'sealed trading cards',
  ],
  authors: [{ name: site.legalName }],
  creator: site.legalName,
  publisher: site.legalName,
  formatDetection: { telephone: true, address: false, email: true },
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: site.name,
    title: `${site.name} — Sealed Sports Cards & Hobby Boxes`,
    description: site.description,
    url: site.url,
    locale: 'en_US',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: site.name }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${site.name} — Sealed Sports Cards & Hobby Boxes`,
    description: site.description,
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
};

export const viewport: Viewport = {
  themeColor: '#1f2a24',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const groups = collectionGroups();

  return (
    <html lang="en" className={`${sans.variable} ${display.variable}`}>
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
gtag('config', '${GA_ID}');
gtag('config', '${ADS_ID}');`}
            </Script>
          </>
        )}
        {/*
          Microsoft Clarity — heatmaps and session replay.

          Clarity's own snippet is an IIFE that inserts its script tag into the
          head. next/script with afterInteractive does the same job without
          blocking first paint, which matters more here than for a counting
          pixel: this file loads on every page of the store.

          Note that unlike the first-party analytics in src/lib/analytics,
          which is deliberately anonymous, Clarity records sessions. Its text
          masking is on by default, but the privacy policy has to disclose it.
        */}
        {CLARITY_ID && (
          <Script id="ms-clarity" strategy="afterInteractive">
            {`(function(c,l,a,r,i,t,y){
c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
})(window, document, "clarity", "script", "${CLARITY_ID}");`}
          </Script>
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
          >
            {children}
          </StorefrontChrome>
        </CartProvider>
      </body>
    </html>
  );
}
