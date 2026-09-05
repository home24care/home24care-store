import type { MetadataRoute } from 'next';
import { site } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Cart, checkout and search results are per-visitor and add no index value.
        disallow: ['/api/', '/cart', '/checkout/', '/search'],
      },
    ],
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}
