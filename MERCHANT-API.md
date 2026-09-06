# Uploading products through the Merchant API

`scripts/upload-merchant.mjs` pushes all 278 products straight into Merchant
Center — title, description, price, sale price, images, GTIN, MPN, brand,
category, variants, shipping and highlights — instead of waiting for Google to
fetch the RSS feed.

Both paths stay available. The feed at `/feeds/google` still works; the uploader
sends byte-identical values, verified across 22 attributes per product. Use one
or the other as the **primary** source, never both (see *Do not run both* below).

## One-time setup

You have to do these four steps yourself — they involve credentials, which
should not pass through a chat window.

**1. Enable the API.** In [Google Cloud Console](https://console.cloud.google.com),
pick or create a project, then enable **Merchant API**
(`APIs & Services > Library`, search "Merchant API").

**2. Create a service account.** `IAM & Admin > Service Accounts > Create`.
No project roles are needed — its access comes from Merchant Center, not IAM.
Copy the generated email, which looks like
`something@your-project.iam.gserviceaccount.com`.

**3. Download a key.** On that service account: `Keys > Add key > Create new key
> JSON`. Save the downloaded file as:

```
.secrets/merchant-service-account.json
```

`.secrets/` is gitignored, so the key will not be committed. Do not paste its
contents anywhere.

**4. Grant it Merchant Center access.** In Merchant Center:
`Settings > People and access > Add person`. Enter the service account email
from step 2 and give it **Admin**. (Standard is not enough to write products.)

## Configure and run

```bash
export MERCHANT_ACCOUNT_ID=<your Merchant Center account ID>
node scripts/upload-merchant.mjs check
```

The account ID is the number shown top-right in Merchant Center — it is *not*
the data source ID from the feed screen.

`check` authenticates, lists your data sources, marks which ones accept API
uploads, and prints the exact payload for one product so you can eyeball it
before sending 278. It writes nothing.

If no data source is marked `[API OK]`, create one:

```bash
node scripts/upload-merchant.mjs create-source
export MERCHANT_DATA_SOURCE_ID=<the id it prints>
```

Then upload, wait a few minutes for Google to process, and read back the result:

```bash
node scripts/upload-merchant.mjs upload
node scripts/upload-merchant.mjs status
```

`status` groups Google's own item-level issues by cause and sorts disapprovals
first, so 200 items failing one way read as one problem rather than two hundred.

`delete` removes everything the uploader sent, if you need to start over.

## Your existing data source probably will not work

The Merchant API only accepts product inserts into data sources whose type is
**API**. The source in your screenshot — `HOME24CARE`, ID `10721889509` — was
created through the Merchant Center interface, so its type is `FILE` or `UI`,
and inserts into it will be refused.

This is not a problem, just an extra step: `check` reports the type of every
source, and `create-source` makes a proper API one. Nothing about the existing
source needs deleting.

## Do not run both at once

A product is identified by `offerId` + `feedLabel` + `contentLanguage`. If the
scheduled fetch of `/feeds/google` and the API upload are both configured as
**primary** sources, they will both claim all 278 products and overwrite each
other on every refresh.

Pick one:

- **API primary** — run `upload` after each catalog change. Delete or pause the
  scheduled fetch.
- **Feed primary** — leave the scheduled fetch alone and do not run `upload`.

The uploader deliberately reuses the feed's offer id rule (SKU, or a truncated
SKU plus a hash of it past 50 characters) so that switching between the two
never orphans a product's history.

## What is already handled

Verified offline against Google's published `products/v1` schema, all 278
products:

- every required attribute present — title, description, link, image,
  availability, condition, price, brand
- 185 GTINs, each already checked against its GS1 check digit
- MPN and brand on all 278, so the 93 without a GTIN still carry a valid
  identifier pair
- 192 sale prices, none above their list price
- 79 products grouped into variant families by `itemGroupId`
- images as JPEG (Merchant rejects WebP), absolute, live and returning 200
- shipping, handling and transit times, `unitPricingMeasure`, `shippingWeight`,
  `multipack`, `isBundle`, size, colour, product highlights
- no duplicate offer ids, none over the 50-character limit

## What will still be flagged

Two things the uploader cannot fix, because fixing them means changing your
data rather than how it is transmitted:

**Five refrigerant prices** look like pallet prices on single cylinders — see
[PRICE-REVIEW.md](PRICE-REVIEW.md). A 25 lb cylinder listed at $11,960 will be
disapproved for a price/value mismatch. These were imported exactly as
published upstream and need a decision, not a code change.

**Twenty-one images are under 800×800.** Google's hard minimum is 100×100, so
they will not be disapproved, but they may be demoted. The source images are
that size; nothing is lost by re-encoding, there is simply no more detail.

Anything else Google objects to will show up in `status`, grouped by cause.
