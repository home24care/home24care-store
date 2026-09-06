import { site } from './site';
import type { Product } from './catalog';
import { priceDecimal } from './format';
import { trustpilot } from './trustpilot';
import { absoluteImage, feedImage, FEED_EXTRA } from './image';
import { reviewStats, hasSampleReviews } from '@/content/reviews';

/**
 * JSON-LD builders. Google Merchant Center reconciles the structured data on
 * the landing page against the feed, so price, availability and currency here
 * must be produced from the same catalog values used by the feed route.
 */


/**
 * The rating to publish as structured data, or null.
 *
 * Trustpilot wins when configured. Otherwise self-hosted reviews qualify only
 * once every placeholder has been replaced — `hasSampleReviews` is the gate.
 * Emitting a rating that no real customer gave breaches Google Merchant
 * Center's misrepresentation policy, so the null case is the safe default.
 */
const publishableRating = () => {
  if (trustpilot.aggregate) {
    return {
      ratingValue: trustpilot.aggregate.ratingValue,
      reviewCount: trustpilot.aggregate.reviewCount,
      source: 'Trustpilot',
    };
  }
  if (reviewStats && !hasSampleReviews) {
    return {
      ratingValue: reviewStats.average,
      reviewCount: reviewStats.count,
      source: null,
    };
  }
  return null;
};

export const organizationSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'OnlineStore',
  '@id': `${site.url}/#organization`,
  name: site.name,
  legalName: site.legalName,
  url: site.url,
  logo: `${site.url}/logo.png`,
  image: `${site.url}/og-image.jpg`,
  description: site.description,
  email: site.contact.email,
  telephone: site.contact.phone,
  address: {
    '@type': 'PostalAddress',
    streetAddress: site.address.street,
    addressLocality: site.address.city,
    addressRegion: site.address.region,
    postalCode: site.address.postalCode,
    addressCountry: site.address.country,
  },
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer service',
    telephone: site.contact.phone,
    email: site.contact.email,
    areaServed: 'US',
    availableLanguage: ['English'],
  },
  areaServed: { '@type': 'Country', name: 'United States' },
  paymentAccepted: 'Visa, Mastercard, American Express, Discover',
  currenciesAccepted: 'USD',
  // Only present when real Trustpilot figures are configured AND a Trustpilot
  // widget is rendered on the page. Rating markup with nothing behind it is a
  // manual-action risk, so the absent case is deliberate.
  ...(() => {
    const rating = publishableRating();
    return rating
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: rating.ratingValue,
            reviewCount: rating.reviewCount,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {};
  })(),
});

export const websiteSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${site.url}/#website`,
  url: site.url,
  name: site.name,
  publisher: { '@id': `${site.url}/#organization` },
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${site.url}/search?q={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
});

export const productSchema = (product: Product) => {
  // Merchant Center wants an explicit, future-dated price validity window.
  const validUntil = new Date();
  validUntil.setFullYear(validUntil.getFullYear() + 1);

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${site.url}/products/${product.slug}#product`,
    name: product.title,
    description: product.excerpt || product.description.slice(0, 500),
    sku: product.sku,
    mpn: product.sku,
    ...(product.gtin ? { gtin12: product.gtin, gtin: product.gtin } : {}),
    brand: { '@type': 'Brand', name: product.brand },
    // Mirrors the Merchant feed. Google reconciles the landing page's
    // structured data against the feed, so a variant attribute present in one
    // and absent from the other is a mismatch worth avoiding.
    ...(product.color ? { color: product.color } : {}),
    ...(product.size ? { size: product.size } : {}),
    ...(product.itemGroupId ? { inProductGroupWithID: product.itemGroupId } : {}),
    ...(product.shippingWeightLb
      ? {
          weight: {
            '@type': 'QuantitativeValue',
            value: product.shippingWeightLb,
            unitCode: 'LBR',
          },
        }
      : {}),
    category: product.productType,
    // Same JPEG copies the feed cites, so the two cannot disagree.
    image: product.images
      .slice(0, 1 + FEED_EXTRA)
      .map((i) => absoluteImage(feedImage(i.full), site.url)),
    // Store-wide Trustpilot score, attributed to Trustpilot as the source.
    // Emitted only when configured — see trustpilot.aggregate.
    // NOTE: deliberately no aggregateRating here.
    //
    // The only rating we have is a store-wide score — one Trustpilot figure,
    // or the average of store reviews. Attaching it to all 278 products would
    // claim each item has been rated when none of them has been. Google treats
    // a seller rating presented as a product rating as misrepresentation, and
    // it is a structured-data violation besides. The store rating lives on the
    // Organization node, which is where it belongs.
    //
    // To publish real per-product ratings, collect reviews per SKU and build
    // the aggregate from those.
    url: `${site.url}/products/${product.slug}`,
    offers: {
      '@type': 'Offer',
      url: `${site.url}/products/${product.slug}`,
      priceCurrency: product.currency,
      price: priceDecimal(product.price),
      priceValidUntil: validUntil.toISOString().slice(0, 10),
      itemCondition: 'https://schema.org/NewCondition',
      availability: product.available
        ? product.preorder
          ? 'https://schema.org/PreOrder'
          : 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      seller: { '@id': `${site.url}/#organization` },
      hasMerchantReturnPolicy: {
        '@type': 'MerchantReturnPolicy',
        applicableCountry: 'US',
        returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
        merchantReturnDays: site.returns.windowDays,
        returnMethod: 'https://schema.org/ReturnByMail',
        returnFees: 'https://schema.org/FreeReturn',
      },
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingRate: {
          '@type': 'MonetaryAmount',
          value: '0.00',
          currency: 'USD',
        },
        shippingDestination: {
          '@type': 'DefinedRegion',
          addressCountry: 'US',
        },
        deliveryTime: {
          '@type': 'ShippingDeliveryTime',
          handlingTime: {
            '@type': 'QuantitativeValue',
            minValue: 0,
            maxValue: 1,
            unitCode: 'DAY',
          },
          transitTime: {
            '@type': 'QuantitativeValue',
            minValue: 1,
            maxValue: 3,
            unitCode: 'DAY',
          },
        },
      },
    },
  };
};

export const breadcrumbSchema = (trail: { name: string; url: string }[]) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: trail.map((item, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: item.name,
    item: `${site.url}${item.url}`,
  })),
});

export const faqSchema = (faqs: { q: string; a: string }[]) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((f) => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a },
  })),
});

export const itemListSchema = (items: Product[], name: string, url: string) => ({
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name,
  url: `${site.url}${url}`,
  numberOfItems: items.length,
  itemListElement: items.slice(0, 30).map((p, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    url: `${site.url}/products/${p.slug}`,
    name: p.title,
  })),
});
