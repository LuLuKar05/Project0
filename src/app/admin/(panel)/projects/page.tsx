import Link from 'next/link';
import { listProjectsAdmin } from '@/server/admin/projects';
import { listTags } from '@/server/admin/tags';
import { PLANET_TEXTURES } from '@/features/galaxy/lib/planetTextures';
import ProjectForm from '@/features/admin/components/ProjectForm';
import { createProjectAction, deleteProjectAction } from '@/features/admin/actions';

export default async function AdminProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const [{ notice }, projects, tags] = await Promise.all([
    searchParams,
    listProjectsAdmin(),
    listTags(),
  ]);
  const textureKeys = Object.keys(PLANET_TEXTURES);

  return (
    <div className="grid gap-10">
      {notice && (
        <p className="rounded border border-success/40 bg-success/10 px-4 py-2 text-sm text-success">
          {notice}
        </p>
      )}
      <section className="grid gap-4">
        <h1 className="text-xl font-semibold">Projects</h1>
        <div className="overflow-x-auto rounded-lg border border-white/10">
          <table className="w-full text-sm">
            <thead className="bg-white/5 text-left text-white/50">
              <tr>
                <th className="px-3 py-2">#</th>
                <th className="px-3 py-2">Title</th>
                <th className="px-3 py-2">Category</th>
                <th className="px-3 py-2">Skin</th>
                <th className="px-3 py-2">Active</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => (
                <tr key={p.id} className="border-t border-white/10">
                  <td className="px-3 py-2 text-white/50">{p.order}</td>
                  <td className="px-3 py-2">{p.title}</td>
                  <td className="px-3 py-2 text-white/60">{p.category}</td>
                  <td className="px-3 py-2 text-white/60">{p.visual?.textureUrl ?? '—'}</td>
                  <td className="px-3 py-2">{p.active ? '✓' : '—'}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-end gap-3">
                      <Link href={`/admin/projects/${p.id}`} className="text-primary hover:underline">Edit</Link>
                      <form action={deleteProjectAction}>
                        <input type="hidden" name="id" value={p.id} />
                        <button className="text-error hover:underline">Delete</button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
              {projects.length === 0 && (
                <tr><td colSpan={6} className="px-3 py-6 text-center text-white/40">No projects yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-4">
        <h2 className="text-lg font-semibold">New project</h2>
        <ProjectForm action={createProjectAction} tags={tags} textureKeys={textureKeys} submitLabel="Create project" />
      </section>
    </div>
  );
}
