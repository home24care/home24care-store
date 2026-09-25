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
      'Current markdowns on sealed hobby boxes and trading card games. The price shown on each card is the price you pay at checkout — no coupon required, and standard shipping stays free.',
    googleCategory: 'Arts & Entertainment > Hobbies & Creative Arts > Collectibles > Collectible Trading Cards',
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
    title: 'High Demand',
    tagline: 'The boxes collectors are chasing right now.',
    description:
      'Releases trading at or above their original price on the U.S. secondary market — the boxes that sell out first. Every one ships factory sealed with free shipping.',
    googleCategory: 'Arts & Entertainment > Hobbies & Creative Arts > Collectibles > Collectible Trading Cards',
    select: () =>
      products.filter((p) => p.badges.includes('High Demand')),
  },
  {
    slug: 'new-arrivals',
    title: 'New Arrivals',
    tagline: 'The latest releases to land in the shop.',
    description:
      'The newest sealed releases in the shop. Everything here ships with the same free standard shipping and returns window as the rest of the store.',
    googleCategory: 'Arts & Entertainment > Hobbies & Creative Arts > Collectibles > Collectible Trading Cards',
    select: () => products.filter((p) => p.badges.includes('New Release')),
  },
  {
    slug: 'limited-releases',
    title: 'Limited Releases',
    tagline: 'Sapphire, Delight and Logofractor editions.',
    description:
      'Short-print premium formats produced in far smaller quantities than standard hobby boxes. When our allocation is gone it rarely comes back.',
    googleCategory: 'Arts & Entertainment > Hobbies & Creative Arts > Collectibles > Collectible Trading Cards',
    select: () => products.filter((p) => p.badges.includes('Limited Release')),
  },
];

export const getVirtualCollection = (slug: string) =>
  virtualCollections.find((c) => c.slug === slug);
