import { products, getCollection, plainDescription } from '@/lib/catalog';
import { priceDecimal } from '@/lib/format';
import { site } from '@/lib/site';
import { createHash } from 'node:crypto';
import { absoluteImage, feedImage, FEED_EXTRA } from '@/lib/image';

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


/**
 * The feed `id`, which Google caps at 50 characters.
 *
 * An id is the permanent handle for an offer — changing one orphans that
 * product's history and performance data in Merchant Center. So the SKU is
 * passed through untouched wherever it already fits, and only the handful
 * that are too long get shortened, deterministically, by keeping a readable
 * prefix and appending a hash of the full SKU so the result stays unique and
 * stable across builds.
 */
const feedId = (sku: string) => {
  const trimmed = sku.trim();
  if (trimmed.length <= 50) return trimmed;
  const hash = createHash('sha1').update(trimmed).digest('hex').slice(0, 8);
  return `${trimmed.slice(0, 41)}-${hash}`;
};

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
        plainDescription(product.description).slice(0, 4900) ||
        `${product.title} from ${product.brand}, sold by ${site.name} with free standard shipping.`;

      const additionalImages = product.images
        .slice(1, 1 + FEED_EXTRA)
        .map(
          (img) =>
            `      <g:additional_image_link>${escape(
            absoluteImage(feedImage(img.full), site.url)
          )}</g:additional_image_link>`
        )
        .join('\n');

      // Merchant Center expects g:price to be the list price and g:sale_price
      // the current one, so a discount renders as a strikethrough in Shopping.
      const listPrice = priceDecimal(product.compareAtPrice ?? product.price);
      const salePrice = product.compareAtPrice
        ? `\n      <g:sale_price>${priceDecimal(product.price)} ${product.currency}</g:sale_price>`
        : '';

      // Optional attributes are emitted only when the title actually stated
      // them. A guessed size or multipack is worse than an absent one, because
      // Google matches the offer against the wrong thing.
      //
      // identifier_exists is sent ONLY when a product genuinely has neither a
      // GTIN nor an MPN, which is exactly what the attribute means. For most
      // of this catalog the SKU is the supplier's part number, so brand + MPN
      // is the identifier pair and the attribute stays off.
      //
      // The equipment range is the exception. Its source publishes no usable
      // GTIN and its SKUs are the retailer's internal ids,
      // not manufacturer codes, so an MPN is sent only where a real model code
      // was established. Where none was, the honest signal is identifier_exists
      // = no, rather than a part number the manufacturer would not recognise.
      const mpn = product.mpn ?? null;

      const identifiers = [
        mpn && `\n      <g:mpn>${escape(mpn)}</g:mpn>`,
        !product.gtin && !mpn && `\n      <g:identifier_exists>no</g:identifier_exists>`,
      ]
        .filter(Boolean)
        .join('');

      const optional = [
        // A real GS1 code where one exists. Google prefers gtin over mpn for
        // matching, and sending both is correct when both are known.
        product.gtin && `\n      <g:gtin>${escape(product.gtin)}</g:gtin>`,
        product.itemGroupId && `\n      <g:item_group_id>${escape(product.itemGroupId)}</g:item_group_id>`,
        product.size && `\n      <g:size>${escape(product.size)}</g:size>`,
        product.color && `\n      <g:color>${escape(product.color)}</g:color>`,
        product.multipack && `\n      <g:multipack>${product.multipack}</g:multipack>`,
        product.isBundle && `\n      <g:is_bundle>yes</g:is_bundle>`,
        product.unitPricingMeasure &&
          `\n      <g:unit_pricing_measure>${escape(product.unitPricingMeasure)}</g:unit_pricing_measure>`,
        product.shippingWeightLb &&
          `\n      <g:shipping_weight>${product.shippingWeightLb} lb</g:shipping_weight>`,
        ...product.highlights
          .slice(0, 5)
          .map((h) => `\n      <g:product_highlight>${cdata(h.slice(0, 150))}</g:product_highlight>`),
      ]
        .filter(Boolean)
        .join('');

      const productType = `${collection?.group ?? 'Trading Cards'} > ${
        collection?.title ?? product.productType
      }`;

      return `    <item>
      <g:id>${escape(feedId(product.sku))}</g:id>
      <g:title>${cdata(product.title.slice(0, 150))}</g:title>
      <g:description>${cdata(description)}</g:description>
      <g:link>${escape(url)}</g:link>
      <g:image_link>${escape(absoluteImage(feedImage(product.images[0].full), site.url))}</g:image_link>
${additionalImages}
      <g:availability>${availability}</g:availability>
      <g:price>${listPrice} ${product.currency}</g:price>${salePrice}
      <g:condition>new</g:condition>
      <g:brand>${cdata(product.brand)}</g:brand>${identifiers}${optional}
      <g:google_product_category>${cdata(
        collection?.googleCategory ?? 'Arts & Entertainment > Hobbies & Creative Arts > Collectibles > Collectible Trading Cards'
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
