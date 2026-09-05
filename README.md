# Home24Care storefront

A Next.js 15 (App Router) e-commerce storefront for **home24care.com** — 278 products
across outdoor living and HVAC refrigerants, with Stripe Checkout, a Google Merchant
Center product feed, and a complete policy set.

```bash
npm install
cp .env.example .env.local     # add your Stripe keys
npm run dev                    # http://localhost:3000
```

---

## What's in here

| Area | Where |
| --- | --- |
| Business identity (name, address, phone, email, policy constants) | `src/lib/site.ts` |
| Product catalog (generated) | `data/catalog.json` |
| Catalog queries, search, related products | `src/lib/catalog.ts` |
| Cart state (localStorage-backed) | `src/lib/cart.tsx` |
| Stripe client / checkout / webhook | `src/lib/stripe.ts`, `src/app/api/` |
| Order persistence seam | `src/lib/orders.ts` |
| Policy documents | `src/content/policies-*.ts` |
| FAQs | `src/content/faqs.ts` |
| JSON-LD builders | `src/lib/schema.ts` |
| Google Merchant feed | `src/app/feeds/google/route.ts` |

**`src/lib/site.ts` is the single source of truth.** Address, phone, email, the return
window, the warranty term and shipping timings are all read from it by the storefront,
the policy pages, the JSON-LD and the Merchant feed. Change a value there and it updates
everywhere — which is exactly what keeps the site consistent under review.

---

## Setup

### 1. Environment

```bash
cp .env.example .env.local
```

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Production origin, no trailing slash. Used for canonical URLs, JSON-LD, sitemap and feed links. **Must be correct before you submit the feed.** |
| `STRIPE_SECRET_KEY` | Stripe → Developers → API keys |
| `STRIPE_WEBHOOK_SECRET` | Stripe → Developers → Webhooks → signing secret |

### 2. Stripe webhook

Create an endpoint at `https://home24care.com/api/webhooks/stripe` subscribed to:

```
checkout.session.completed
checkout.session.async_payment_succeeded
checkout.session.async_payment_failed
checkout.session.expired
charge.refunded
payment_intent.payment_failed
```

Locally:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

The handler verifies the signature against the **raw** request body, is idempotent by
event id, and returns a non-2xx on handler failure so Stripe retries with backoff.

Fulfilment is stubbed in `src/lib/orders.ts` — the functions log today and are where you
add your database writes and confirmation emails. The webhook route needs no changes.

### 3. Product images

Images are pre-encoded to WebP and served from `public/product-images/`, at the
three widths the storefront actually renders:

| Variant | Width | Rendered at | Avg size |
| --- | --- | --- | --- |
| `thumb` | 192px | 84px gallery rail, 86px cart | ~6 KB |
| `card` | 640px | 320px product card | ~40 KB |
| `full` | 1100px | 620px product gallery | ~89 KB |

Each is roughly 2x its largest CSS slot, so retina screens stay sharp without
paying for pixels nobody sees. Because they are already at the right size and
format, `next/image` is bypassed (`unoptimized`) and they are served straight
off disk with a one-year immutable cache header.

To re-run after adding products:

```bash
npm run localize:images
```

The script is incremental — existing files are skipped — and sets
`catalog.localized`, which is what flips the storefront into direct-serve mode.
If it only partially completes, the flag stays `false` and everything falls
back to optimizing remote URLs, so a half-finished run never breaks the site.

### Why this matters

The first build served images from the source CDNs through `next/image` with
AVIF enabled. Measured cost per image on a cold cache:

| Path | Per image | 40-image collection page |
| --- | --- | --- |
| Remote + AVIF encode | 0.7 – 2.2 s | ~60 s |
| Remote + WebP encode | 0.12 – 0.49 s | ~18 s |
| Local pre-encoded WebP | ~2 ms | ~0.1 s |

Two things were wrong. AVIF encodes 3-10x slower than WebP in sharp for roughly
30% file saving, and every image on a fresh deploy is cold — so `formats` is now
WebP-only. And every cold image paid a network round-trip to a third-party CDN
before encoding could even start, which is what localizing removes.

Alongside that:

- Card hover images mount on `pointerenter` instead of eagerly, halving image
  requests on a listing page — a visitor who scrolls past pays nothing, and
  touch devices never load them at all.
- `sizes` hints live in `src/lib/image.ts` next to the grid definition, so a
  320px card can no longer negotiate a 1920px variant.
- `deviceSizes` / `imageSizes` are trimmed to the widths actually used.
- Blur placeholders hold layout while images decode.
- `absoluteImage()` in `src/lib/image.ts` turns the root-relative catalog paths
  into absolute URLs wherever one leaves the page — the Merchant feed, Product
  JSON-LD, OG tags and the Stripe Checkout line items. Merchant Center rejects a
  relative `image_link` and Stripe silently drops relative images, so anything
  emitting an off-site image URL must go through it.
- Full-bleed heroes use a separate 1920x1000 `-hero.webp` (`npm run
  build:heroes`). The standard `full` variant is 1100px, sized for the 620px
  gallery slot; pointing a 100vw hero at it upscaled ~1.3x on a 1440px display.
  `heroVariant()` checks `data/hero-variants.json` and falls back to `full` when
  no wide variant exists, so a missing file can never 404 the LCP image.
- Only the hero is preloaded. Category tiles are `loading="lazy"` — preloading
  below-the-fold art competed with the hero for the LCP slot.
- `/product-images/*` is cached for a year with `stale-while-revalidate`, not
  `immutable`: filenames hash the source URL rather than the file contents, so a
  re-encode reuses the name and `immutable` would strand the old bytes.

## Rebuilding the catalog

`data/catalog.json` is generated from the raw exports in `scripts/source/`:

```bash
node scripts/build-catalog.mjs
```

The script normalises both sources into one schema, maps them onto 15 storefront
collections, decodes HTML entities, derives brands, and writes `PRICE-REVIEW.md` for
anything that looks mispriced.

**Money is stored as integer cents throughout.** Never introduce a float — format only
at the edge with `formatPrice()` from `src/lib/format.ts`.

---

## Google Merchant Center

The feed lives at **`/feeds/google`** (RSS 2.0 with the `g:` namespace). Point a
scheduled fetch at `https://home24care.com/feeds/google`.

It is generated from the same catalog the product pages render, so the feed and the
landing page can never disagree on price or availability — the most common cause of
item disapproval. All 15 `google_product_category` values are verified against the
official Google taxonomy.

What is already handled:

- Verified `google_product_category` per collection, plus `product_type`
- `price` as list price with `sale_price` for discounted items
- `availability`, `condition`, `brand`, `mpn`, `identifier_exists`
- Free `shipping` with handling and transit times matching the shipping policy
- `Product` JSON-LD on every product page with `hasMerchantReturnPolicy` and
  `OfferShippingDetails`
- `OnlineStore` + `WebSite` JSON-LD sitewide, `BreadcrumbList`, `FAQPage`, `ItemList`
- Every required policy page, reachable from the footer on every page
- Contact details identical across the storefront, policies and structured data

### Before you submit

1. **Set `NEXT_PUBLIC_SITE_URL`** to the real origin — otherwise every feed link points
   at the wrong host.
2. **Review `PRICE-REVIEW.md`.** Five refrigerant listings were imported at pallet-scale
   prices despite being single cylinders (e.g. a 25 lb cylinder at $11,960). Prices were
   imported exactly as published on the source sites and not silently "corrected" —
   confirm or fix each one, because a price/value mismatch will get items disapproved.
3. **Verify the business address and phone** match your Merchant Center and Stripe
   accounts exactly.
4. **Re-run `npm run localize:images`** if you have added products since the last
   run, so every feed image link resolves from your own domain.
5. **Set your Trustpilot business unit id** so review widgets render — see below.

### Reviews

There are two review paths, and the storefront picks one automatically.

**Trustpilot (recommended).** Set a business unit id and the real TrustBox
widgets take over every review slot. Reviews are collected and hosted by
Trustpilot, so you never hold the liability for them.

```bash
NEXT_PUBLIC_TRUSTPILOT_BUSINESS_UNIT_ID=   # Trustpilot Business -> Integrations -> TrustBox
NEXT_PUBLIC_TRUSTPILOT_LOCALE=en-US
NEXT_PUBLIC_TRUSTPILOT_RATING=             # e.g. 4.6  — structured data only
NEXT_PUBLIC_TRUSTPILOT_REVIEW_COUNT=       # e.g. 218  — structured data only
```

| Placement | Template | Component |
| --- | --- | --- |
| Homepage review band | Carousel | `TrustpilotReviews` |
| Product buy box | Micro Combo | `TrustpilotStars` |
| Product page section | Grid, scoped to SKU | `TrustpilotProductReviews` |
| Footer | Micro Star | `TrustpilotFooter` |

The ~100 KB Trustpilot script loads once per page via an IntersectionObserver
with a 400px margin, so it never competes with the hero. If it fails to load the
widget unmounts to a plain profile link rather than a broken box.

**Self-hosted fallback.** With no business unit id, the same slots are filled
from `src/content/reviews.ts` in a Trustpilot-styled layout — the same green
rating blocks, score word ("Excellent"), star distribution and verified badges.

| Placement | Component |
| --- | --- |
| Homepage section (score + distribution + 6 cards) | `ReviewsSection` |
| Product buy box (stars + score + count, links to `#reviews`) | `ProductRating` |
| Product page section (3 cards) | `ProductReviews` |

#### The sample reviews shipped in this repo are NOT real

`src/content/reviews.ts` ships six placeholder reviews so the layout renders
while you build. Every one is flagged `sample: true`. **Replace them before you
take real orders.**

Two guards make that hard to forget:

1. **No rating structured data while any review is a sample.** `AggregateRating`
   is withheld from both `OnlineStore` and `Product` schema until either
   Trustpilot is configured or every `sample` flag is `false`. Verified both
   ways: with samples the pages emit zero `aggregateRating`; with the flags
   cleared they emit 4.8/5 from 6 reviews.
2. **A sample-content banner in development**, which never renders in a
   production build.

This matters more than it looks. Publishing invented reviews — and especially
rating markup with nothing behind it — breaches Google Merchant Center's
misrepresentation policy and the FTC endorsement rules, and it is among the
fastest ways to lose a Merchant account. The guards stop the *markup* leaking,
but they cannot stop the *text* being displayed: deleting the placeholders is
still your job.

Note also that `ProductReviews` is headed "What people say about buying from
us" and states the reviews cover the store, not that product. Store reviews
presented as product reviews is itself a misrepresentation.

---

## Policies

Eight documents, all at `/policies/<slug>` and linked from the footer sitewide:

| Slug | Document |
| --- | --- |
| `shipping` | Shipping Policy |
| `returns` | Refunds and Returns Policy |
| `warranty` | Warranty and Replacement Policy |
| `order-acceptance` | Order Acceptance and Cancellation Policy |
| `payment-security` | Secure Payment and Security Policy |
| `privacy` | Privacy Policy |
| `terms` | Terms of Service |
| `accessibility` | Accessibility Statement |

They are authored as structured blocks (`src/lib/policy-types.ts`) rather than raw HTML,
so every page renders with consistent typography and a specific clause is easy to find
when a reviewer asks for one. Each ends with identical contact details pulled from
`site.ts`.

Refrigerants are treated as regulated goods throughout — Clean Air Act §608/§609
certification language appears on the product page, in the shipping policy, in the
returns exclusions and in the terms.

**Have a lawyer review these before you trade.** They are thorough and internally
consistent, but they are not legal advice.

---

## Notable implementation details

- **Server-side price resolution.** `/api/checkout` ignores any price sent by the client
  and re-resolves every line against the catalog, rejecting unknown or out-of-stock
  items. A tampered cart cannot change what you charge.
- **Static generation.** 320 pages prerender at build time; only checkout, search and the
  API routes are dynamic.
- **Security headers** (HSTS, `X-Content-Type-Options`, `Referrer-Policy`,
  `Permissions-Policy`) are set in `next.config.mjs`.
- **Accessibility**: skip link, single `main` landmark, visible focus rings, labelled
  form fields, `prefers-reduced-motion` respected, no horizontal overflow at 320px.
- **`npm audit`** reports one unfixed `postcss` advisory reached through Next's own
  dependency tree. `postcss@8.5.28` is the latest published version and no patch exists
  yet; it affects build tooling, not request handling. `sharp` is pinned forward via an
  override.

## Scripts

| Command | Does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run localize:images` | Download product images and self-host them |
| `npm run build:heroes` | Generate the wide 1920x1000 hero variants |
| `node scripts/build-catalog.mjs` | Regenerate `data/catalog.json` |
