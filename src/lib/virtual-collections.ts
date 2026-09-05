import { products, type Product } from './catalog';

/**
 * Merchandising collections that aren't a category — sale, best sellers and
 * new arrivals. They share the collection page template and route namespace.
 */
export type VirtualCollection = {
  slug: string;
  title: string;
  tagline: string;
  description: string;
  googleCategory: string;
  select: () => Product[];
};

export const virtualCollections: VirtualCollection[] = [
  {
    slug: 'sale',
    title: 'Sale',
    tagline: 'Everything currently marked down.',
    description:
      'Current markdowns across outdoor structures and refrigerants. The price shown on each card is the price you pay at checkout — no coupon required, and standard shipping stays free.',
    googleCategory: 'Home & Garden',
    select: () =>
      products
        .filter((p) => p.compareAtPrice && p.available)
        .sort(
          (a, b) =>
            (b.compareAtPrice! - b.price) / b.compareAtPrice! -
            (a.compareAtPrice! - a.price) / a.compareAtPrice!
        ),
  },
  {
    slug: 'best-sellers',
    title: 'Best Sellers',
    tagline: 'The products customers order most.',
    description:
      'Our most-ordered products across every department, refreshed as sales data comes in.',
    googleCategory: 'Home & Garden',
    select: () =>
      products.filter(
        (p) => p.badges.includes('Best Seller') || p.badges.includes('Top Seller')
      ),
  },
  {
    slug: 'new-arrivals',
    title: 'New Arrivals',
    tagline: 'The latest additions to the catalog.',
    description:
      'Newly stocked products across outdoor living and refrigerants. Everything here ships with the same free standard shipping and returns window as the rest of the store.',
    googleCategory: 'Home & Garden',
    select: () => products.filter((p) => p.badges.includes('New Arrival')),
  },
];

export const getVirtualCollection = (slug: string) =>
  virtualCollections.find((c) => c.slug === slug);
