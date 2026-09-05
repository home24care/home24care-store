import { currency } from './site';

const usd = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency,
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Money is stored as integer cents everywhere; only format at the edge. */
export const formatPrice = (cents: number) => usd.format(cents / 100);

/** Feed/JSON-LD want a bare decimal, not a currency-formatted string. */
export const priceDecimal = (cents: number) => (cents / 100).toFixed(2);
