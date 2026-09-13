# GTIN audit — equipment range (381 products)

**Conclusion: no GTINs were imported. The source's barcodes are fabricated.**

## What the scan found

Every one of the 381 product pages was fetched and its JSON-LD read.

| result | count |
| --- | ---: |
| none | 274 |
| invalid | 83 |
| valid | 23 |
| fetch fail | 1 |

`INVALID` means the number fails the GS1 check digit — it is not a well-formed barcode at all.

## Why the 23 check-digit-valid codes were rejected too

17 of the 23 share a five-digit prefix with a code that provably fails its check digit.
A licensed GS1 company prefix cannot emit malformed barcodes, so these blocks are
generated rather than owned. The valid ones are simply the cases where the generator
happened to land on a correct check digit (23/106 = 21.7%).

| prefix | valid | invalid |
| --- | ---: | ---: |
| `84967` | 4 | 14 |
| `88981` | 1 | 8 |
| `81052` | 2 | 3 |
| `46396` | 1 | 3 |
| `85004` | 2 | 1 |
| `76812` | 1 | 2 |
| `85002` | 2 | 1 |
| `73171` | 1 | 1 |

## What is sent instead

Google accepts **brand + MPN** where a product has no GTIN. The retailer SKUs in the
source export are internal ids (`67279`, `P0038S`, `SQ7506`), not manufacturer part
numbers, so they are not submitted as MPN. Real model codes were read from the product
titles instead; where none could be established the product carries no MPN and declares
`identifier_exists: no`, which is the documented handling for goods that genuinely have
neither identifier.

## To get real GTINs

They have to come from the manufacturer — a brand's own spec sheet or a GS1 lookup,
matched on model. That is per-brand work and is not done here.
