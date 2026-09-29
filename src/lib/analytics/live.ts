import { store } from './store';
import { isExcludedCountry, type AnalyticsEvent, type LiveVisitor } from './types';

/*
 * Who is on the site right now.
 *
 * One hash per minute, each expiring after six. A browser writes its id into the
 * current minute's hash on every event and on a once-a-minute heartbeat from an
 * open tab; "live" is every id seen in the last five minutes. Redis deletes old
 * minutes itself, so nothing grows with traffic and there is no cleanup job.
 *
 * Excluded countries (the owner) are never written here, so nothing has to be
 * filtered on read.
 */
const LIVE_MINUTES = 5;
const minuteKey = (t: number) => `a:live:${Math.floor(t / 60_000)}`;

export async function touchLive(
  event: Pick<AnalyticsEvent, 'visitorId' | 'country' | 'path'> & { channel: AnalyticsEvent['channel'] | null }
): Promise<void> {
  if (isExcludedCountry(event.country) || event.visitorId === 'server') return;
  const s = store();
  const now = Date.now();
  const key = minuteKey(now);
  const value = JSON.stringify({ c: event.country ?? null, p: event.path.slice(0, 200), ch: event.channel ?? null, t: now });
  await s.setField(key, event.visitorId, value);
  await s.expire(key, (LIVE_MINUTES + 1) * 60).catch(() => {});
}

export async function readLive(): Promise<LiveVisitor[]> {
  const s = store();
  const now = Date.now();
  const keys = Array.from({ length: LIVE_MINUTES }, (_, i) => minuteKey(now - i * 60_000));
  const hashes = await Promise.all(keys.map((key) => s.getHash(key).catch(() => ({}))));

  const latest = new Map<string, LiveVisitor>();
  for (const h of hashes) {
    for (const [vid, raw] of Object.entries(h as Record<string, unknown>)) {
      // Upstash parses JSON values itself; the memory store hands back strings.
      let v: { c?: string | null; p?: string; ch?: string | null; t?: number } | null;
      try {
        v = typeof raw === 'string' ? JSON.parse(raw) : (raw as typeof v);
      } catch {
        continue;
      }
      if (!v || typeof v.t !== 'number' || now - v.t > LIVE_MINUTES * 60_000) continue;
      const prev = latest.get(vid);
      if (!prev || prev.lastSeen < v.t) {
        // Heartbeats carry no channel; keep the one from the visitor's last real event.
        latest.set(vid, { country: v.c ?? null, path: v.p ?? '/', channel: v.ch ?? prev?.channel ?? null, lastSeen: v.t });
      } else if (!prev.channel && v.ch) {
        prev.channel = v.ch;
      }
    }
  }
  return [...latest.values()].sort((a, b) => b.lastSeen - a.lastSeen);
}
