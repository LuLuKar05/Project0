import { listTags } from '@/server/admin/tags';
import { createTagAction, deleteTagAction } from '@/features/admin/actions';

const field = 'rounded border border-white/15 bg-white/5 px-3 py-2 text-sm outline-none focus:border-primary';
const btn   = 'rounded bg-primary px-3 py-2 text-sm font-semibold text-black';

export default async function AdminTagsPage() {
  const tags = await listTags();

  return (
    <div className="grid gap-6 max-w-3xl">
      <h1 className="text-xl font-semibold">Tags</h1>

      <div className="flex flex-wrap gap-2">
        {tags.map((t) => (
          <span key={t.id} className="flex items-center gap-2 rounded border border-white/15 px-2.5 py-1 text-xs">
            <span className="inline-block h-3 w-3 rounded-full" style={{ background: t.color }} />
            <span>{t.name}</span>
            <span className="text-white/40">· {t.category}</span>
            <form action={deleteTagAction}>
              <input type="hidden" name="id" value={t.id} />
              <button className="text-error">×</button>
            </form>
          </span>
        ))}
        {tags.length === 0 && <span className="text-xs text-white/40">No tags yet.</span>}
      </div>

      <section className="rounded-lg border border-white/10 p-4">
        <h2 className="mb-3 text-lg font-semibold">New tag</h2>
        <form action={createTagAction} className="flex flex-wrap items-center gap-2">
          <input name="name" required placeholder="Name (e.g. Next.js 16)" className={field} />
          <input name="category" required placeholder="Category (e.g. framework)" className={field} />
          <input name="color" type="color" defaultValue="#4FC3F7" className="h-9 w-12 rounded border border-white/15 bg-transparent" />
          <button className={btn}>Add tag</button>
        </form>
      </section>
    </div>
  );
}
