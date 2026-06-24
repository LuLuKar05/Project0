import { listSkillData } from '@/server/admin/skills';
import {
  createCategoryAction, deleteCategoryAction, createSkillAction, deleteSkillAction,
} from '@/features/admin/actions';

const field = 'rounded border border-white/15 bg-white/5 px-3 py-2 text-sm outline-none focus:border-primary';
const btn   = 'rounded bg-primary px-3 py-2 text-sm font-semibold text-black';

export default async function AdminSkillsPage() {
  const categories = await listSkillData();

  return (
    <div className="grid gap-8 max-w-3xl">
      <h1 className="text-xl font-semibold">Skills</h1>

      {categories.map((cat) => (
        <section key={cat.id} className="rounded-lg border border-white/10 p-4">
          <div className="mb-3 flex items-center gap-3">
            <h2 className="text-lg font-semibold text-gx-bright">{cat.name}</h2>
            <span className="text-xs text-white/40">order {cat.displayOrder}</span>
            <form action={deleteCategoryAction} className="ml-auto">
              <input type="hidden" name="id" value={cat.id} />
              <button className="text-xs text-error hover:underline">Delete category</button>
            </form>
          </div>

          <div className="mb-3 flex flex-wrap gap-2">
            {cat.skills.map((s) => (
              <span key={s.id} className="flex items-center gap-2 rounded border border-white/15 px-2 py-1 text-xs">
                {s.name}
                <form action={deleteSkillAction}>
                  <input type="hidden" name="id" value={s.id} />
                  <button className="text-error">×</button>
                </form>
              </span>
            ))}
            {cat.skills.length === 0 && <span className="text-xs text-white/40">No skills.</span>}
          </div>

          <form action={createSkillAction} className="flex gap-2">
            <input type="hidden" name="categoryId" value={cat.id} />
            <input name="name" required placeholder="New skill" className={field} />
            <button className={btn}>Add</button>
          </form>
        </section>
      ))}

      <section className="rounded-lg border border-white/10 p-4">
        <h2 className="mb-3 text-lg font-semibold">New category</h2>
        <form action={createCategoryAction} className="flex flex-wrap gap-2">
          <input name="name" required placeholder="Category name" className={field} />
          <input name="displayOrder" type="number" defaultValue={categories.length} placeholder="Order" className={`${field} w-24`} />
          <button className={btn}>Add category</button>
        </form>
      </section>
    </div>
  );
}
