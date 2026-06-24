import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getProjectAdmin } from '@/server/admin/projects';
import { listTags } from '@/server/admin/tags';
import { PLANET_TEXTURES } from '@/features/galaxy/lib/planetTextures';
import ProjectForm from '@/features/admin/components/ProjectForm';
import { updateProjectAction } from '@/features/admin/actions';

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [project, tags] = await Promise.all([getProjectAdmin(id), listTags()]);
  if (!project) notFound();

  return (
    <div className="grid gap-4">
      <Link href="/admin/projects" className="text-sm text-white/60 hover:text-white">← Projects</Link>
      <h1 className="text-xl font-semibold">Edit · {project.title}</h1>
      <ProjectForm
        action={updateProjectAction}
        project={project}
        tags={tags}
        textureKeys={Object.keys(PLANET_TEXTURES)}
        submitLabel="Save changes"
      />
    </div>
  );
}
