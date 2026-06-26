import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { isAdmin } from '@/features/admin/auth';
import { logoutAction } from '@/features/admin/actions';

export const metadata: Metadata = { robots: { index: false, follow: false } };

const nav = [
  ['/admin', 'Dashboard'],
  ['/admin/projects', 'Projects'],
  ['/admin/skills', 'Skills'],
  ['/admin/tags', 'Tags'],
  ['/admin/messages', 'Messages'],
] as const;

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  if (!(await isAdmin())) redirect('/admin/login');

  return (
    <div className="relative z-10 min-h-dvh bg-secondary text-white">
      <header className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-white/10 px-6 py-3">
        <span className="font-semibold tracking-wide text-primary">ADMIN</span>
        <nav className="flex gap-4 text-sm text-white/70">
          {nav.map(([href, label]) => (
            <Link key={href} href={href} className="hover:text-white">{label}</Link>
          ))}
        </nav>
        <form action={logoutAction} className="ml-auto">
          <button className="text-sm text-white/60 hover:text-white">Log out</button>
        </form>
      </header>
      <main className="px-6 py-8">{children}</main>
    </div>
  );
}
