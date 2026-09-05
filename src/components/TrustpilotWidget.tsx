'use client';

import { useEffect, useRef, useState } from 'react';
import { trustpilot, TRUSTPILOT_SCRIPT } from '@/lib/trustpilot';

declare global {
  interface Window {
    Trustpilot?: { loadFromElement: (el: HTMLElement, forceReload?: boolean) => void };
  }
}

/**
 * Loads the Trustpilot bootstrap script exactly once per page, and only when a
 * widget is close to the viewport.
 *
 * The script is ~100 KB of third-party JavaScript. Loading it eagerly would
 * undo the image work and push out LCP for a section most visitors scroll past,
 * so an IntersectionObserver with a generous rootMargin starts the download
 * shortly before the widget is actually needed.
 */
let scriptPromise: Promise<void> | null = null;

function loadScript(): Promise<void> {
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<void>((resolve, reject) => {
    // The bootstrap defines window.Trustpilot. Checking for it rather than for
    // the <script> tag also covers a script that loaded but threw during
    // evaluation — a filtering proxy or consent blocker serving a stub fires
    // `load`, not `error`, so the tag alone proves nothing.
    if (window.Trustpilot) return resolve();

    const stale = document.querySelector<HTMLScriptElement>(
      `script[src="${TRUSTPILOT_SCRIPT}"]`
    );
    // A tag left over from a failed attempt will never fire another event, so
    // listening to it would hang every later widget forever. Drop it and start
    // a fresh request instead.
    stale?.remove();

    const script = document.createElement('script');
    script.src = TRUSTPILOT_SCRIPT;
    script.async = true;
    script.onload = () =>
      window.Trustpilot
        ? resolve()
        : reject(new Error('trustpilot bootstrap loaded but defined nothing'));
    script.onerror = () => reject(new Error('trustpilot bootstrap failed to load'));
    document.head.appendChild(script);
  }).catch((error) => {
    // Clear the cache so a later widget can retry rather than inheriting a
    // permanently rejected promise.
    scriptPromise = null;
    throw error;
  });

  return scriptPromise;
}

export type TrustpilotWidgetProps = {
  templateId: string;
  /** Widget box height, per Trustpilot's template docs. */
  height: string;
  width?: string;
  theme?: 'light' | 'dark';
  stars?: string;
  /** Renders the product-scoped variant of a template. */
  sku?: string;
  className?: string;
};

export default function TrustpilotWidget({
  templateId,
  height,
  width = '100%',
  theme = 'light',
  stars = '4,5',
  sku,
  className,
}: TrustpilotWidgetProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || !trustpilot.enabled) return;

    let cancelled = false;

    const activate = () => {
      loadScript()
        .then(() => {
          if (cancelled || !ref.current) return;
          // The bootstrap initialises every .trustpilot-widget it finds on
          // load. Only drive it manually for nodes that scan missed — ones
          // mounted afterwards, which is the case loadFromElement exists for.
          if (ref.current.childElementCount > 0 && ref.current.querySelector('iframe')) {
            return;
          }
          window.Trustpilot?.loadFromElement(ref.current, true);
        })
        .catch(() => {
          if (!cancelled) setFailed(true);
        });
    };

    // Older browsers without IntersectionObserver just load it immediately.
    if (typeof IntersectionObserver === 'undefined') {
      activate();
      return () => {
        cancelled = true;
      };
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          observer.disconnect();
          activate();
        }
      },
      { rootMargin: '400px' }
    );
    observer.observe(el);

    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, []);

  // No business unit id configured, or the script could not load: render
  // nothing rather than an empty box or a placeholder rating.
  if (!trustpilot.enabled || failed) return null;

  return (
    <div
      ref={ref}
      className={`trustpilot-widget ${className ?? ''}`}
      data-locale={trustpilot.locale}
      data-template-id={templateId}
      data-businessunit-id={trustpilot.businessUnitId}
      data-style-height={height}
      data-style-width={width}
      data-theme={theme}
      data-stars={stars}
      data-no-reviews="hide"
      data-scroll-to-list="true"
      {...(sku ? { 'data-sku': sku, 'data-review-languages': 'en' } : {})}
    >
      {/* Trustpilot replaces this anchor with the widget; it stays as the
          no-JavaScript fallback and satisfies their attribution requirement. */}
      <a href={trustpilot.profileUrl} target="_blank" rel="noopener noreferrer">
        Read our reviews on Trustpilot
      </a>
    </div>
  );
}
