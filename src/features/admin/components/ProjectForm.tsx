/**
 * @file src/features/admin/components/ProjectForm.tsx
 * Shared create/edit form for a project. Server component — posts directly to a
 * server action via the native <form action>, so no client state is needed.
 */

import type { Project, Tag } from '@/lib/types';

const field = 'w-full rounded border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-primary';
const label = 'block text-xs uppercase tracking-wider text-white/50 mb-1';

interface ProjectFormProps {
  action: (formData: FormData) => void | Promise<void>;
  project?: Project | null;
  tags: Tag[];
  textureKeys: string[];
  submitLabel: string;
}

export default function ProjectForm({ action, project, tags, textureKeys, submitLabel }: ProjectFormProps) {
  const dateValue = project ? new Date(project.date).toISOString().slice(0, 10) : '';
  const currentTexture = project?.visual?.textureUrl ?? 'procedural';
  const selectedTagIds = new Set(project?.tags.map((t) => t.id) ?? []);

  return (
    <form action={action} className="grid gap-4 max-w-2xl">
      {project && <input type="hidden" name="id" value={project.id} />}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={label}>Title</label>
          <input name="title" required defaultValue={project?.title} className={field} />
        </div>
        <div>
          <label className={label}>Category</label>
          <input name="category" required defaultValue={project?.category} className={field} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className={label}>Date</label>
          <input type="date" name="date" required defaultValue={dateValue} className={field} />
        </div>
        <div>
          <label className={label}>Orbit slot (order)</label>
          <input type="number" name="order" min={0} defaultValue={project?.order ?? 0} className={field} />
        </div>
        <div>
          <label className={label}>Planet skin</label>
          <select name="textureUrl" defaultValue={currentTexture} className={field}>
            <option value="procedural">procedural</option>
            {textureKeys.map((k) => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className={label}>Short description</label>
        <input name="shortDesc" required defaultValue={project?.shortDesc} className={field} />
      </div>
      <div>
        <label className={label}>Full description</label>
        <textarea name="fullDesc" rows={4} defaultValue={project?.fullDesc} className={field} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={label}>GitHub URL</label>
          <input name="githubURL" type="url" defaultValue={project?.githubURL ?? ''} className={field} />
        </div>
        <div>
          <label className={label}>Deployed URL</label>
          <input name="deployedURL" type="url" defaultValue={project?.deployedURL ?? ''} className={field} />
        </div>
      </div>

      <div>
        <label className={label}>Tags</label>
        <div className="flex flex-wrap gap-2">
          {tags.map((t) => (
            <label key={t.id} className="flex items-center gap-1.5 rounded border border-white/15 px-2 py-1 text-xs">
              <input type="checkbox" name="tagIds" value={t.id} defaultChecked={selectedTagIds.has(t.id)} />
              <span style={{ color: t.color }}>{t.name}</span>
            </label>
          ))}
          {tags.length === 0 && <span className="text-xs text-white/40">No tags yet — add some on the Tags page.</span>}
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="active" defaultChecked={project?.active ?? true} />
        Active (visible in the galaxy)
      </label>

      <button type="submit" className="justify-self-start rounded bg-primary px-4 py-2 text-sm font-semibold text-black">
        {submitLabel}
      </button>
    </form>
  );
}
