'use client';

import { useEffect } from 'react';
import Script from 'next/script';

/** Property and widget ids from the Tawk.to dashboard (Administration → Chat Widget). */
const TAWK_SRC = 'https://embed.tawk.to/6ab7b48cf80f883440d59679/1k3epihom';

type TawkApi = { showWidget?: () => void; hideWidget?: () => void; onLoad?: () => void };
declare global {
  interface Window {
    Tawk_API?: TawkApi;
    Tawk_LoadStart?: Date;
  }
}

/**
 * The Tawk.to live-chat launcher.
 *
 * Loaded with `lazyOnload` so the third-party script waits until the page is
 * idle and never competes with the product images for bandwidth. Tawk's widget
 * outlives client-side navigation once injected, so it is hidden whenever this
 * component unmounts — StorefrontChrome does not render it on /admin or at
 * checkout — and shown again when the shopper comes back to the store.
 */
export default function TawkChat() {
  useEffect(() => {
    window.Tawk_API?.showWidget?.();
    return () => window.Tawk_API?.hideWidget?.();
  }, []);

  return (
    <Script id="tawk-to" strategy="lazyOnload">
      {`var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
(function(){
var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
s1.async=true;
s1.src='${TAWK_SRC}';
s1.charset='UTF-8';
s1.setAttribute('crossorigin','*');
s0.parentNode.insertBefore(s1,s0);
})();`}
    </Script>
  );
}
