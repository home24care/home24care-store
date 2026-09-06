# Price review

Six refrigerant listings were imported with a price that belongs to a pallet of
40 cylinders rather than the single cylinder the title describes.

## What went wrong upstream

The original product pages are multi-variant — "1 cylinder" and "40 cylinders"
on one page — so they render a price range like `$449.00 - $15,960.00`.
Whichever process built the supplier's catalogue took the **top** of that range.
The supplier still publishes these prices today, so this is their standing
error, not stale data on our side.

Two things confirm the items are single cylinders: the source `weight` field
reads ~36 lb for the 25 lb products (25 lb of refrigerant plus roughly 11 lb of
cylinder tare) where a 40-cylinder pallet would be about 1,440 lb, and the
descriptions never mention a pallet.

Note that dividing the listed price by 40 does **not** recover the retail price.
It yields the pallet's volume-discounted per-unit rate, which runs 8-26% below
what any surveyed retailer charges for one cylinder.

## Corrected

Applied through `data/price-overrides.json`, which `scripts/build-catalog.mjs`
re-applies on every rebuild. Each entry records the evidence behind it.

| SKU | Product | Was | Now | Basis |
| --- | --- | ---: | ---: | --- |
| `686114002029` | 22lb Solstice EZ-Flush | $14,900 | **$449.00** | mode of five retailers, $432-$459.95 |
| `40 R448a` | 25lb R-448A | $11,960 | **$365.00** | median of twelve retailers, cluster $350-$390 |
| `440` | 25lb R-438A (MO99) | $9,996 | **$345.00** | midpoint of five retailers, $314-$389.95 |

Prices surveyed 2026-09-06.

## Still wrong, and why they are not guessed at

These three are left at the imported price on purpose. Each needs a fact only
the supplier holds, and a wrong price here sells a HazMat-shipped cylinder at a
loss or gets the listing disapproved.

**`424` - 25lb R-422B (NU-22), $11,200.** Branded ICOR NU-22B and generic
R-422B are different tiers at the same retailer ($525 against $420 at one), and
"NU-22" in the title *is* the ICOR brand, so the name does not settle which one
ships. Generic sits at $320-$396, branded at $420-$525. If generic, about $369;
if ICOR-branded, about $500. Separately, several sellers state virgin R-422B can
no longer be sold into California or New York, which is a listing-geography
question as much as a pricing one.

**`40-422D` - 25lb R-422D, $15,960.** The title names two different chemicals:
MO29 is R-422D, NU-22B is ICOR's R-422B. Their price bands do not overlap
($435-$466 against $320-$396), so no single price is safe under both readings.
This is a product-identity question before it is a pricing one.

**`22Brown` - 30lb R-22 Refrigerant Center, $4,500.** Found during this pass;
it had been escaping the audit because the filter skipped any title containing
"center", and this product's name ends in "Refrigerant Center". The filter is
fixed. For comparison the other 30 lb R-22 cylinder in this catalogue is $200
and the R-22 pallet works out to $560 per cylinder, so $4,500 is clearly the
same pallet-price error — but the right single-cylinder figure has not been
verified, so it has not been changed.
