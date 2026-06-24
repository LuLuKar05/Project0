import Link from 'next/link';
import { listProjectsAdmin } from '@/server/admin/projects';
import { listSkillData } from '@/server/admin/skills';
import { listTags } from '@/server/admin/tags';
import { listMessages } from '@/server/admin/messages';

export default async function AdminDashboard() {
  const [projects, skills, tags, messages] = await Promise.all([
    listProjectsAdmin(),
    listSkillData(),
    listTags(),
    listMessages(),
  ]);

  const cards: [string, number, string][] = [
    ['Projects', projects.length, '/admin/projects'],
    ['Skill categories', skills.length, '/admin/skills'],
    ['Tags', tags.length, '/admin/tags'],
    ['Messages', messages.length, '/admin/messages'],
  ];

  return (
    <div className="grid gap-6">
      <h1 className="text-xl font-semibold">Dashboard</h1>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {cards.map(([label, n, href]) => (
          <Link
            key={href}
            href={href}
            className="rounded-lg border border-white/10 bg-white/5 p-5 hover:border-primary"
          >
            <div className="text-3xl font-semibold">{n}</div>
            <div className="mt-1 text-sm text-white/60">{label}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
