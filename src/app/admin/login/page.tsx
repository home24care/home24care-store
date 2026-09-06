import type { Metadata } from 'next';
import LoginForm from '@/components/admin/LoginForm';
import { adminConfigured } from '@/lib/admin-auth';

export const metadata: Metadata = {
  title: 'Sign in',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-[26px] tracking-tight text-ink">Sign in</h1>
        <p className="mt-1.5 text-[13.5px] text-ink-muted">
          This dashboard shows revenue and order data.
        </p>

        {adminConfigured() ? (
          <LoginForm />
        ) : (
          <p className="mt-6 rounded-xl border border-clay-300 bg-clay-50 px-4 py-3 text-[13px] leading-relaxed text-clay-900">
            <strong className="font-semibold">Admin access is not configured.</strong> Set{' '}
            <code>ADMIN_PASSWORD</code> in your environment to enable it. Until then the
            dashboard is closed to everyone, which is the safe default.
          </p>
        )}
      </div>
    </div>
  );
}
