import { listMessages } from '@/server/admin/messages';
import { deleteMessageAction } from '@/features/admin/actions';

export default async function AdminMessagesPage() {
  const messages = await listMessages();

  return (
    <div className="grid gap-4">
      <h1 className="text-xl font-semibold">Contact messages</h1>

      <div className="grid gap-3">
        {messages.map((m) => (
          <article key={m.id} className="rounded-lg border border-white/10 bg-white/5 p-4">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
              <span className="font-semibold">{m.name}</span>
              <a href={`mailto:${m.email}`} className="text-primary hover:underline">{m.email}</a>
              {m.org && <span className="text-white/50">· {m.org}</span>}
              <span className="rounded bg-white/10 px-1.5 py-0.5 text-xs text-white/60">{m.type}</span>
              <span className={`text-xs ${m.emailSent ? 'text-success' : 'text-error'}`}>
                {m.emailSent ? 'emailed' : 'email pending'}
              </span>
              <span className="ml-auto text-xs text-white/40">{new Date(m.createdAt).toLocaleString()}</span>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm text-white/80">{m.message}</p>
            <form action={deleteMessageAction} className="mt-2">
              <input type="hidden" name="id" value={m.id} />
              <button className="text-xs text-error hover:underline">Delete</button>
            </form>
          </article>
        ))}
        {messages.length === 0 && <p className="text-sm text-white/40">No messages yet.</p>}
      </div>
    </div>
  );
}
