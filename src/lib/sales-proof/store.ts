import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Redis } from '@upstash/redis';
import { redisCredentials } from '@/lib/analytics/store';

/**
 * Recent-sale feed behind the storefront's sales notifications.
 *
 * Every entry is a real, paid order. Nothing here is generated, seeded or
 * back-filled — a notification claiming a purchase that did not happen is a
 * deceptive practice under the FTC Act and a Google Merchant policy breach,
 * and it is the same mistake as an invented product review. With no orders
 * the feed is empty and the storefront shows nothing.
 *
 * Only the four fields the toast actually renders are stored. The order record
 * itself carries an email, a phone number and a full shipping address; none of
 * that is copied here, so a public endpoint cannot leak what it never had.
 */

export type RecentSale = {
  /** First name only, or null when the buyer gave none. */
  firstName: string | null;
  /** State or region code — never a street address or postcode. */
  region: string | null;
  /** Product title, resolved at write time from the SKU. */
  product: string;
  /** Epoch ms of the order, for the "17 mins ago" line. */
  ts: number;
};

const KEY = 'sales:recent';
/** Keep a short window: a three-week-old sale is not social proof. */
const MAX_ENTRIES = 30;
const TTL_SECONDS = 60 * 60 * 24 * 14;

let client: Redis | null = null;

function redis(): Redis | null {
  const creds = redisCredentials();
  if (!creds) return null;
  if (!client) client = new Redis(creds);
  return client;
}

export const available = () => redisCredentials() !== null;

/**
 * First name only, and only when it looks like a name.
 *
 * Stripe's `customer_details.name` is whatever the buyer typed, so it can be a
 * full name, a company, or an email address they pasted into the wrong box.
 * Anything with an @ or a digit is dropped rather than displayed.
 */
export function firstNameOf(name: string | null | undefined): string | null {
  if (!name) return null;
  const first = name.trim().split(/\s+/)[0] ?? '';
  if (!first || first.length > 20) return null;
  if (/[@\d]/.test(first)) return null;
  if (!/^[\p{L}'-]+$/u.test(first)) return null;
  // Title case, so "JOHN" does not shout from the corner of the page.
  return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
}

/**
 * Dev-only file fallback, so the notification can be built and seen without
 * provisioning Redis. Production never reaches it: `available()` is false, and
 * on serverless a file written by one invocation is not there for the next.
 */
const devFile = () => path.join(os.tmpdir(), 'h24c-sales-dev.json');
const devIsAllowed = () => process.env.NODE_ENV !== 'production';

export async function recordSale(sale: RecentSale): Promise<void> {
  const r = redis();
  if (!r) {
    if (!devIsAllowed()) return;
    try {
      const existing = JSON.parse(fs.readFileSync(devFile(), 'utf8')) as RecentSale[];
      fs.writeFileSync(devFile(), JSON.stringify([sale, ...existing].slice(0, MAX_ENTRIES)));
    } catch {
      try {
        fs.writeFileSync(devFile(), JSON.stringify([sale]));
      } catch {
        /* ignore */
      }
    }
    return;
  }
  try {
    const p = r.pipeline();
    p.lpush(KEY, JSON.stringify(sale));
    p.ltrim(KEY, 0, MAX_ENTRIES - 1);
    p.expire(KEY, TTL_SECONDS);
    await p.exec();
  } catch {
    // A failed social-proof write must never fail the webhook, or Stripe will
    // retry a delivery whose order was already recorded.
  }
}

export async function recentSales(limit = 12): Promise<RecentSale[]> {
  const r = redis();
  if (!r) {
    if (!devIsAllowed()) return [];
    try {
      const all = JSON.parse(fs.readFileSync(devFile(), 'utf8')) as RecentSale[];
      return Array.isArray(all) ? all.slice(0, limit) : [];
    } catch {
      return [];
    }
  }
  try {
    const raw = await r.lrange<string | RecentSale>(KEY, 0, limit - 1);
    return raw
      .map((entry) => {
        if (typeof entry === 'object' && entry !== null) return entry as RecentSale;
        try {
          return JSON.parse(entry) as RecentSale;
        } catch {
          return null;
        }
      })
      .filter((s): s is RecentSale => s !== null && typeof s.product === 'string');
  } catch {
    return [];
  }
}
