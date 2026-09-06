'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Sign in failed.');

      // Only accept a same-origin relative path, so ?next= cannot be used to
      // bounce someone off-site after a successful login.
      const next = params.get('next');
      const target = next && /^\/admin(\/|$)/.test(next) ? next : '/admin';
      router.replace(target);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed.');
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="mt-6">
      <label htmlFor="password" className="mb-1.5 block text-[13.5px] font-semibold">
        Password
      </label>
      <input
        id="password"
        type="password"
        autoComplete="current-password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="field"
      />

      {error && (
        <p role="alert" className="mt-3 rounded-lg bg-clay-50 px-3 py-2 text-[13px] text-clay-800">
          {error}
        </p>
      )}

      <button type="submit" disabled={busy || !password} className="btn-primary mt-4 w-full py-3">
        {busy ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}
