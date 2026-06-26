import type { Metadata } from 'next';
import { loginAction } from '@/features/admin/actions';

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <main className="relative z-10 min-h-dvh flex items-center justify-center bg-secondary text-white px-6">
      <form action={loginAction} className="grid w-full max-w-xs gap-3 rounded-lg border border-white/15 bg-white/5 p-6">
        <h1 className="text-lg font-semibold">Admin sign in</h1>
        <input
          type="password"
          name="password"
          placeholder="Password"
          required
          autoFocus
          className="w-full min-w-0 rounded border border-white/15 bg-white/5 px-3 py-2 text-sm outline-none focus:border-primary"
        />
        {error === '1' && <p className="text-xs text-error">Invalid password.</p>}
        {error === 'rate' && <p className="text-xs text-error">Too many attempts. Wait a few minutes and try again.</p>}
        <button className="w-full rounded bg-primary px-4 py-2 text-sm font-semibold text-black">Sign in</button>
      </form>
    </main>
  );
}
