'use client';

/**
 * Chat alerting: a sound for both sides, plus a desktop notification and a
 * title-bar badge for the agent.
 *
 * The awkwardness here is all browser policy, not taste.
 */

/* ------------------------------------------------------------------ sound */

let audioContext: AudioContext | null = null;

/**
 * A short two-note chime, synthesised rather than loaded.
 *
 * No audio file, for two reasons: an mp3 is another blocking request on a store
 * that just had a 15-second asset removed from its critical path, and a
 * generated tone cannot 404.
 *
 * Browsers refuse to start an AudioContext until the user has interacted with
 * the page, so this is a no-op before the first click and works after it. That
 * is why the widget primes it on open rather than waiting for the first
 * incoming message — by then the visitor may be reading, not clicking.
 */
export function primeAudio(): void {
  if (typeof window === 'undefined' || audioContext) return;
  try {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (Ctor) audioContext = new Ctor();
  } catch {
    /* Audio is a nicety; never let it break the chat. */
  }
}

export function playChime(kind: 'incoming' | 'sent' = 'incoming'): void {
  primeAudio();
  const ctx = audioContext;
  if (!ctx) return;

  try {
    // A context created before a gesture starts suspended; resuming is a no-op
    // once it is already running.
    if (ctx.state === 'suspended') void ctx.resume();

    // Incoming rises (attention); sent falls (acknowledgement).
    const notes = kind === 'incoming' ? [660, 880] : [880, 660];
    const now = ctx.currentTime;

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;

      const start = now + i * 0.11;
      const end = start + 0.16;
      // Ramped, not switched: a square-edged gain change clicks audibly.
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(kind === 'incoming' ? 0.16 : 0.09, start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, end);

      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(end + 0.02);
    });
  } catch {
    /* ignore */
  }
}

/* ----------------------------------------------------- desktop notification */

export const notificationsSupported = () =>
  typeof window !== 'undefined' && 'Notification' in window;

export const notificationPermission = (): NotificationPermission | 'unsupported' =>
  notificationsSupported() ? Notification.permission : 'unsupported';

/**
 * Asks for notification permission.
 *
 * Must be called from a real user gesture — Chrome rejects the prompt
 * otherwise, and a rejected prompt cannot be re-requested for the session. The
 * admin console therefore puts it behind an explicit button instead of asking
 * on load.
 */
export async function requestNotifications(): Promise<NotificationPermission | 'unsupported'> {
  if (!notificationsSupported()) return 'unsupported';
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
}

export function desktopNotify(title: string, body: string, tag = 'chat'): void {
  if (!notificationsSupported() || Notification.permission !== 'granted') return;
  try {
    const n = new Notification(title, {
      body,
      tag, // same tag replaces rather than stacks, so a busy chat shows one alert
      icon: '/logo.png',
      badge: '/logo.png',
    });
    n.onclick = () => {
      window.focus();
      n.close();
    };
  } catch {
    /* Some browsers throw when constructed outside a service worker. */
  }
}

/* -------------------------------------------------------------- title badge */

let originalTitle: string | null = null;

/**
 * Puts the unread count in the tab title.
 *
 * The reason this exists alongside desktop notifications: a notification is
 * transient and easily missed, and permission is often simply denied. The tab
 * title is always available and persists until read.
 */
export function setTitleBadge(unread: number): void {
  if (typeof document === 'undefined') return;
  if (originalTitle === null) originalTitle = document.title.replace(/^\(\d+\)\s*/, '');
  document.title = unread > 0 ? `(${unread}) ${originalTitle}` : originalTitle;
}
