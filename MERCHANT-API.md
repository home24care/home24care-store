# Getting products into Merchant Center

There are three routes, all carrying identical values — verified by
cross-checking each against the others attribute by attribute. Pick **one** as
the primary data source; running two means both claim all 278 products and
overwrite each other on every refresh.

| Route | Built by | Effort | Stays in sync? |
| --- | --- | --- | --- |
| **Scheduled fetch** of `/feeds/google` | `src/app/feeds/google/route.ts` | paste one URL | yes, on each deploy |
| **Google Sheets** | `scripts/build-sheet-feed.mjs` | import a CSV | no, re-import after changes |
| **Merchant API** | `scripts/upload-merchant.mjs` | one-time key setup | no, re-run after changes |

## Google Sheets

```bash
node scripts/build-sheet-feed.mjs
```

Writes `data/merchant-sheet.csv`. In the sheet Merchant Center generated for
you: `File > Import > Upload`, choose the file, pick **Replace current sheet**
and **Comma** as the separator, then click Continue in Merchant Center.

Replacing the sheet also clears the template's instruction rows, so the
"delete rows 2 to 5" step in Merchant Center's own instructions is already
handled.

The file reproduces that template's own 40 columns in its own order, then
appends the eight it leaves out but this catalogue needs:
`google_product_category`, `product_type`, `shipping`, `shipping_weight` and
the four handling and transit times. Merchant Center matches columns by header
name rather than position, so appending is safe.

Two details in this catalogue decide the file's format, and getting either
wrong corrupts the feed without any error:

**118 of 396 product highlights contain a comma.** Google accepts a repeated
attribute either as one comma-separated cell or as several columns holding one
value each. The first would split those 118 at their own commas — "Ships in one
box, fully assembled" becoming two highlights — so the file uses separate
columns. Same for the additional images.

**237 descriptions contain a paragraph break.** The file is RFC 4180 quoted
CSV, which the Sheets importer reads correctly. Tab-separated text pasted
directly would split each of those products across two rows.

Two template cells are also worth ignoring. It labels `description` "up to 200
characters", but the product data specification allows 5000; the longest here
is 977. And it marks `identifier_exists` required, while the specification says
to omit it when a product has a brand and an MPN, as all 278 do — sending "no"
there would tell Google to ignore the 185 GTINs. That column is left blank.

## Merchant API

`scripts/upload-merchant.mjs` pushes all 278 products straight into Merchant
Center — title, description, price, sale price, images, GTIN, MPN, brand,
category, variants, shipping and highlights — instead of waiting for Google to
fetch the RSS feed.

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

A product is identified by `offerId` + `feedLabel` + `contentLanguage`. All
three routes send the same offer ids, so if any two of them — the scheduled
fetch of `/feeds/google`, the Google Sheet, the API upload — are configured as
**primary** sources, they will both claim all 278 products and overwrite each
other on every refresh.

That shared offer id is deliberate. It is a product's permanent handle in
Merchant Center, so using the same rule everywhere means switching between the
three routes never orphans a product's history.

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
