'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Script from 'next/script';
import { useCart } from '@/lib/cart';

/** Property and widget ids from the Tawk.to dashboard (Administration → Chat Widget). */
const TAWK_SRC = 'https://embed.tawk.to/6ab7b48cf80f883440d59679/1k3epihom';

type TawkApi = {
  onLoad?: () => void;
  onChatMaximized?: () => void;
  onChatMinimized?: () => void;
  hideWidget?: () => void;
  showWidget?: () => void;
  minimize?: () => void;
  isChatMaximized?: () => boolean;
  isChatOngoing?: () => boolean;
  isVisitorEngaged?: () => boolean;
};
declare global {
  interface Window {
    Tawk_API?: TawkApi;
    Tawk_LoadStart?: Date;
  }
}

/* The parts of the widget a shopper taps to open the chat. */
const OPENERS = ['min-widget', 'chat-bubble', 'message-preview'];
/* A maximise this soon after a tap on an opener is the shopper's own doing. */
const TAP_WINDOW_MS = 1500;

let lastOpenerTap = 0;
const hooked = new WeakSet<Document>();

/** Tawk draws each part in a same-origin iframe; a capturing listener sees taps on it. */
function hookOpeners() {
  const mark = () => {
    lastOpenerTap = Date.now();
  };
  for (const id of OPENERS) {
    const frame = document.getElementById(id)?.querySelector('iframe');
    let doc: Document | null = null;
    try {
      doc = frame?.contentDocument ?? null;
    } catch {
      // Not readable — openersUnwatched() then lets every open stand.
    }
    if (!doc || hooked.has(doc)) continue;
    hooked.add(doc);
    doc.addEventListener('pointerdown', mark, true);
    doc.addEventListener('keydown', mark, true);
  }
}

/** True when the openers could not be watched, so no open the shopper made is ever undone. */
function openersUnwatched() {
  return OPENERS.every((id) => {
    const frame = document.getElementById(id)?.querySelector('iframe');
    try {
      return !frame?.contentDocument;
    } catch {
      return true;
    }
  });
}

/**
 * The Tawk.to live-chat widget, kept off the way to pay.
 *
 * - Bottom-left, not Tawk's default bottom-right: the product buy column, the
 *   cart drawer's Checkout button and the checkout summary all sit on the right,
 *   and the bubble with its "We Are Here!" graphic covered them.
 * - Hidden outright where even the corner would cover the way to pay: while the
 *   cart drawer is open, on /cart on a phone, and at checkout.
 * - On a phone, only the shopper opens the chat window. Tawk's automatic
 *   greeting maximises it by itself and at phone width that covers Add to cart
 *   and Buy now; such opens are closed and the greeting waits behind the unread
 *   badge. Desktop is unchanged.
 *
 * Loaded with lazyOnload so it never competes with the product images. Not
 * rendered on /admin or /checkout at all (StorefrontChrome skips it there).
 */
export default function TawkChat() {
  const pathname = usePathname();
  const { isOpen: cartOpen } = useCart();
  const blocked = useRef(false);

  useEffect(() => {
    const phone = () => window.matchMedia('(max-width: 1023px)').matches;
    blocked.current = cartOpen || pathname === '/checkout' || (phone() && pathname === '/cart');

    // Handlers set before the loader survive it: its first line is Tawk_API = Tawk_API || {}.
    window.Tawk_API = window.Tawk_API || {};
    const api = window.Tawk_API;

    const shopperOpened = () =>
      Date.now() - lastOpenerTap < TAP_WINDOW_MS ||
      Boolean(api.isChatOngoing?.()) ||
      Boolean(api.isVisitorEngaged?.()) ||
      openersUnwatched();

    const apply = () => {
      if (!api.hideWidget || !api.showWidget) return;
      hookOpeners();
      if (blocked.current) {
        api.minimize?.();
        api.hideWidget();
      } else {
        api.showWidget();
        if (phone() && api.isChatMaximized?.() && !shopperOpened()) api.minimize?.();
      }
    };

    api.onLoad = apply;
    api.onChatMaximized = () => {
      if (blocked.current || (phone() && !shopperOpened())) api.minimize?.();
    };
    // Tawk may redraw the bubble when the window closes.
    api.onChatMinimized = hookOpeners;
    apply();
  }, [cartOpen, pathname]);

  // Leaving the storefront chrome (/admin, /checkout) hides the widget, which
  // otherwise survives client-side navigation once injected.
  useEffect(() => () => window.Tawk_API?.hideWidget?.(), []);

  return (
    <Script id="tawk-to" strategy="lazyOnload">
      {`var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
/* Must be set before the embed boots; Tawk reads it once. Bottom-left keeps the
   bubble off the buy buttons and checkout; 90px on phones clears the bottom edge. */
Tawk_API.customStyle={visibility:{desktop:{position:'bl',xOffset:20,yOffset:20},mobile:{position:'bl',xOffset:12,yOffset:90}}};
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
