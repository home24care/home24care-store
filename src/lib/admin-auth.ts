import { cookies } from 'next/headers';

/**
 * Admin session handling.
 *
 * The dashboard exposes revenue, order counts and traffic, so it must never be
 * reachable without a password. Deliberately minimal — one shared password in
 * an env var, an HMAC-signed cookie, no user table — because this guards a
 * single-operator dashboard, not a multi-tenant account system. If more than
 * one person needs their own login, replace this with a real identity provider
 * rather than growing it.
 *
 * Notable properties:
 *  - When ADMIN_PASSWORD is unset, every check fails closed. An unconfigured
 *    deploy has no admin panel rather than an open one.
 *  - The cookie carries an expiry inside the signed payload, so it cannot be
 *    extended by editing the cookie's own Max-Age.
 *  - Password comparison is constant-time, so response timing does not leak
 *    how much of a guess was correct.
 */

export const ADMIN_COOKIE = 'tuf_admin';
const SESSION_MS = 12 * 60 * 60 * 1000;

const enc = new TextEncoder();

const secret = () =>
  process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || '';

export const adminConfigured = () => Boolean(process.env.ADMIN_PASSWORD);

const toHex = (buf: ArrayBuffer) =>
  Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

async function sign(payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  return toHex(await crypto.subtle.sign('HMAC', key, enc.encode(payload)));
}

/** Length-independent comparison, so no early exit reveals the prefix. */
function timingSafeEqual(a: string, b: string): boolean {
  const max = Math.max(a.length, b.length);
  let diff = a.length ^ b.length;
  for (let i = 0; i < max; i++) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0;
}

export async function verifyPassword(input: unknown): Promise<boolean> {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || typeof input !== 'string') return false;
  return timingSafeEqual(input, expected);
}

export async function createSessionValue(): Promise<string> {
  const expires = Date.now() + SESSION_MS;
  const payload = String(expires);
  return `${payload}.${await sign(payload)}`;
}

export async function isValidSession(value: string | undefined): Promise<boolean> {
  if (!value || !adminConfigured()) return false;
  const [payload, signature] = value.split('.');
  if (!payload || !signature) return false;

  const expires = Number(payload);
  if (!Number.isFinite(expires) || expires < Date.now()) return false;

  return timingSafeEqual(await sign(payload), signature);
}

/** Server-component helper — the middleware guards the route itself. */
export async function isAuthenticated(): Promise<boolean> {
  const jar = await cookies();
  return isValidSession(jar.get(ADMIN_COOKIE)?.value);
}
