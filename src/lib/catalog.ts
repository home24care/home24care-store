import catalog from '@data/catalog.json';

export type ProductImage = {
  thumb: string;
  card: string;
  full: string;
  alt: string;
  width: number | null;
  height: number | null;
};

export type Product = {
  id: string;
  slug: string;
  title: string;
  brand: string;
  collection: string;
  productType: string;
  sku: string;
  /** Integer cents. Never use floats for money. */
  price: number;
  compareAtPrice: number | null;
  currency: string;
  available: boolean;
  preorder: boolean;
  description: string;
  excerpt: string;
  images: ProductImage[];
  highlights: string[];
  badges: string[];
  shippingIncluded: boolean;
  requiresShipping: boolean;
  weightGrams: number;
  regulated?: boolean;
  source: 'outdoor' | 'gas' | 'equipment';

  /* --- Google Merchant attributes, derived from the title by
     scripts/enrich-merchant.mjs. All optional: absent means the title did not
     state it, and an absent attribute is always safer than a guessed one. --- */
  /** Real GS1 GTIN (UPC-A), verified by check digit. Absent when none exists. */
  gtin?: string;
  /** Manufacturer part number, where a real one is known. */
  mpn?: string;
  /** Variant size, e.g. "16x12". */
  size?: string;
  /** Variant colour or finish, e.g. "Black". */
  color?: string;
  /** Groups genuine size/colour variants of one model. */
  itemGroupId?: string;
  /** Count of identical units in a merchant-defined multipack. */
  multipack?: number;
  /** Different products sold together as one offer. */
  isBundle?: boolean;
  /** Net content of one unit, e.g. "25 lb". */
  unitPricingMeasure?: string;
  shippingWeightLb?: number;
  /** True once the inherited copy has been replaced. */
  rewritten?: boolean;
};

export type Collection = {
  slug: string;
  title: string;
  group: string;
  tagline: string;
  googleCategory: string;
  count: number;
};

export const products = catalog.products as Product[];
export const collections = catalog.collections as Collection[];

const bySlug = new Map(products.map((p) => [p.slug, p]));
const collectionBySlug = new Map(collections.map((c) => [c.slug, c]));

export const getProduct = (slug: string) => bySlug.get(slug);

/**
 * Lookup by SKU, for the places that only carry a SKU — Stripe session
 * metadata and the Merchant feed's offer ids both do.
 */
const bySku = new Map(products.map((p) => [p.sku, p]));
export const getProductBySku = (sku: string) => bySku.get(sku);
export const getCollection = (slug: string) => collectionBySlug.get(slug);

/** The group a collection belongs to ("Outdoor Living", "Garage & Workshop"...). */
export const collectionGroup = (slug: string): string | undefined =>
  collectionBySlug.get(slug)?.group;

export const productsIn = (slug: string) =>
  products.filter((p) => p.collection === slug);

/** Collections grouped under their storefront department, in menu order. */
export const collectionGroups = (): { group: string; collections: Collection[] }[] => {
  const order: string[] = [];
  const map = new Map<string, Collection[]>();
  for (const c of collections) {
    if (!map.has(c.group)) {
      map.set(c.group, []);
      order.push(c.group);
    }
    map.get(c.group)!.push(c);
  }
  return order.map((group) => ({ group, collections: map.get(group)! }));
};

/** Deterministic pseudo-random pick so server and client markup agree. */
const hash = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
};

export const featured = (n: number, seed = 'home') =>
  [...products]
    .filter((p) => p.available && p.images.length > 1)
    .sort((a, b) => hash(seed + a.id) - hash(seed + b.id))
    .slice(0, n);

export const bestSellers = (n: number) =>
  products
    .filter((p) => p.badges.includes('Best Seller') || p.badges.includes('Top Seller'))
    .slice(0, n);

export const newArrivals = (n: number) =>
  products.filter((p) => p.badges.includes('New Arrival')).slice(0, n);

export const onSale = (n: number) =>
  [...products]
    .filter((p) => p.compareAtPrice && p.available)
    .sort((a, b) => discountPct(b) - discountPct(a))
    .slice(0, n);

export const discountPct = (p: Product) =>
  p.compareAtPrice ? Math.round(((p.compareAtPrice - p.price) / p.compareAtPrice) * 100) : 0;

/** Same collection first, then anything from the same department. */
export const relatedTo = (p: Product, n = 4) => {
  const sameCollection = products.filter(
    (x) => x.collection === p.collection && x.id !== p.id && x.available
  );
  const group = collectionBySlug.get(p.collection)?.group;
  const sameGroup = products.filter(
    (x) =>
      x.id !== p.id &&
      x.available &&
      x.collection !== p.collection &&
      collectionBySlug.get(x.collection)?.group === group
  );
  return [...sameCollection, ...sameGroup].slice(0, n);
};

export const search = (query: string, limit = 40) => {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  const terms = q.split(/\s+/);
  return products
    .map((p) => {
      const haystack = `${p.title} ${p.productType} ${p.brand} ${p.sku}`.toLowerCase();
      let score = 0;
      for (const t of terms) {
        if (p.title.toLowerCase().includes(t)) score += 6;
        else if (haystack.includes(t)) score += 3;
        else if (p.description.toLowerCase().includes(t)) score += 1;
        else return null;
      }
      if (p.title.toLowerCase().startsWith(q)) score += 8;
      return { p, score };
    })
    .filter((x): x is { p: Product; score: number } => x !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.p);
};

export const priceRange = () => {
  const prices = products.map((p) => p.price);
  return { min: Math.min(...prices), max: Math.max(...prices) };
};
