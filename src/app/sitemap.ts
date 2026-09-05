import type { MetadataRoute } from 'next';
import { products, collections } from '@/lib/catalog';
import { virtualCollections } from '@/lib/virtual-collections';
import { policies } from '@/content/policies';
import { site } from '@/lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const url = (path: string) => `${site.url}${path}`;

  return [
    { url: url('/'), lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: url('/collections'), lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: url('/about'), lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: url('/contact'), lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: url('/faq'), lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: url('/order-status'), lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: url('/policies'), lastModified: now, changeFrequency: 'monthly', priority: 0.6 },

    ...collections.map((c) => ({
      url: url(`/collections/${c.slug}`),
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    ...virtualCollections.map((c) => ({
      url: url(`/collections/${c.slug}`),
      lastModified: now,
      changeFrequency: 'daily' as const,
      priority: 0.7,
    })),
    ...products.map((p) => ({
      url: url(`/products/${p.slug}`),
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    ...policies.map((p) => ({
      url: url(`/policies/${p.slug}`),
      lastModified: now,
      changeFrequency: 'yearly' as const,
      priority: 0.5,
    })),
  ];
}
