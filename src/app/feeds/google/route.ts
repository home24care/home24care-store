import { products, getCollection } from '@/lib/catalog';
import { priceDecimal } from '@/lib/format';
import { site } from '@/lib/site';
import { absoluteImage } from '@/lib/image';

/**
 * Google Merchant Center product feed (RSS 2.0 with the g: namespace).
 *
 * Point your Merchant Center scheduled fetch at
 *   https://<your-domain>/feeds/google
 *
 * Every value here is derived from the same catalog the product pages render,
 * so the feed and the landing page can never disagree on price or availability
 * — the most common cause of item disapproval.
 */
export const dynamic = 'force-static';
// The feed is derived entirely from data/catalog.json, which only changes on
// deploy — there is nothing for a timed revalidate to pick up.
export const revalidate = false;

/** Control characters make the XML invalid, so drop them before escaping. */
const clean = (value: string) =>
  value.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

const escape = (value: string) =>
  clean(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const cdata = (value: string) =>
  `<![CDATA[${clean(value).replace(/]]>/g, ']]&gt;')}]]>`;

export async function GET() {
  const items = products
    .filter((p) => p.images.length > 0 && p.price > 0)
    .map((product) => {
      const collection = getCollection(product.collection);
      const url = `${site.url}/products/${product.slug}`;

      const availability = !product.available
        ? 'out_of_stock'
        : product.preorder
          ? 'preorder'
          : 'in_stock';

      const description =
        product.description.slice(0, 4900) ||
        `${product.title} from ${product.brand}, sold by ${site.name} with free standard shipping.`;

      const additionalImages = product.images
        .slice(1, 11)
        .map(
          (img) =>
            `      <g:additional_image_link>${escape(
            absoluteImage(img.full, site.url)
          )}</g:additional_image_link>`
        )
        .join('\n');

      // Merchant Center expects g:price to be the list price and g:sale_price
      // the current one, so a discount renders as a strikethrough in Shopping.
      const listPrice = priceDecimal(product.compareAtPrice ?? product.price);
      const salePrice = product.compareAtPrice
        ? `\n      <g:sale_price>${priceDecimal(product.price)} ${product.currency}</g:sale_price>`
        : '';

      const productType = `${collection?.group ?? 'Home'} > ${
        collection?.title ?? product.productType
      }`;

      return `    <item>
      <g:id>${escape(product.sku)}</g:id>
      <g:title>${cdata(product.title.slice(0, 150))}</g:title>
      <g:description>${cdata(description)}</g:description>
      <g:link>${escape(url)}</g:link>
      <g:image_link>${escape(absoluteImage(product.images[0].full, site.url))}</g:image_link>
${additionalImages}
      <g:availability>${availability}</g:availability>
      <g:price>${listPrice} ${product.currency}</g:price>${salePrice}
      <g:condition>new</g:condition>
      <g:brand>${cdata(product.brand)}</g:brand>
      <g:mpn>${escape(product.sku)}</g:mpn>
      <g:identifier_exists>no</g:identifier_exists>
      <g:google_product_category>${cdata(
        collection?.googleCategory ?? 'Home & Garden'
      )}</g:google_product_category>
      <g:product_type>${cdata(productType)}</g:product_type>
      <g:shipping>
        <g:country>US</g:country>
        <g:service>Standard</g:service>
        <g:price>0.00 USD</g:price>
      </g:shipping>
      <g:min_handling_time>0</g:min_handling_time>
      <g:max_handling_time>1</g:max_handling_time>
      <g:min_transit_time>1</g:min_transit_time>
      <g:max_transit_time>3</g:max_transit_time>
      <g:adult>no</g:adult>
    </item>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${cdata(site.name)}</title>
    <link>${escape(site.url)}</link>
    <description>${cdata(site.description)}</description>
${items}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
