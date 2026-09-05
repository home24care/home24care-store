# Payment card marks

Local copies of the four accepted-card marks, used on the footer and the cart
to show which payment methods the store takes.

| File | Source | Notes |
| --- | --- | --- |
| `visa.svg` | Wikimedia Commons, *Visa Inc. logo (2021–present)* | Official wordmark, brand blue `#1434cb` |
| `mastercard.svg` | Wikimedia Commons, *Mastercard-logo.svg* | Official interlocking-circles symbol |
| `amex.svg` | Wikimedia Commons, *American Express logo (2018)* | `viewBox` added; the source had only fixed width/height |
| `discover.svg` | Wikimedia Commons, *Font Awesome 5 brands cc-discover* (CC BY 4.0) | Recoloured to Discover orange `#FF6000` |

Discover uses the Font Awesome glyph because neither Wikimedia vector was
usable: `Discover Card logo.svg` is a base64 PNG wrapped in an SVG, and
`DiscoverCard.svg` renders its wordmark with `<text>` and so depends on a font
the visitor almost certainly does not have.

All four were sanitized before committing: XML prolog, doctype, comments,
editor metadata and namespaces removed, along with any `<script>` or `on*`
handler, and fixed `width`/`height` dropped so the `viewBox` drives sizing.

## On trademarks

These are registered trademarks of their respective networks. Displaying them
to indicate which cards a merchant accepts is the use each network's brand
guidelines provide them for. Do not restyle, recolour or combine them with
other marks beyond the neutral tile used here — and note that Discover's is a
third-party glyph rather than the official mark, so swap it for the asset from
Discover's own merchant brand centre if you want exact fidelity.
