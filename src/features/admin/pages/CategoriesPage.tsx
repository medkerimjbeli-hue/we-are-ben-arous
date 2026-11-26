import { useState } from 'react';
import { Plus, Save, Trash2 } from 'lucide-react';
import type { Category } from '../../../types';
import { slugify } from '../../../lib/localize';
import { useAdmin } from '../AdminApp';
import { deleteCategory, saveCategory } from '../api';
import { ConfirmButton, PageHeader, Toast } from '../ui';

export default function CategoriesPage() {
  const { catalog: c, reload } = useAdmin();
  const [msg, setMsg] = useState<{ text: string; kind: 'ok' | 'error' } | null>(null);
  const [draft, setDraft] = useState<Category | null>(null);
  const run = async (fn: () => Promise<void>, ok: string) => {
    try { await fn(); await reload(); setMsg({ text: ok, kind: 'ok' }); } catch (e) { setMsg({ text: (e as Error).message, kind: 'error' }); }
  };
  const rows = draft ? [...c.categories, draft] : c.categories;
  return (
    <div className="max-w-4xl">
      <PageHeader title="Categories">
        <button className="btn btn-primary" disabled={!!draft} onClick={() => setDraft({ id: crypto.randomUUID(), slug: '', name: {}, sortOrder: c.categories.length + 1 })}><Plus className="h-4 w-4" /> New category</button>
      </PageHeader>
      <p className="mb-4 text-sm text-muted">Assign a category to a location only when it is supported by owner-provided or verified information. Categories with no published locations are hidden from public filters.</p>
      <Toast message={msg?.text ?? null} kind={msg?.kind} />
      <div className="mt-4 space-y-3">
        {rows.map((cat) => <CategoryRow key={cat.id} cat={cat} isNew={cat.id === draft?.id} used={c.locations.filter((l) => l.categoryId === cat.id).length}
          onSave={(x) => run(async () => { await saveCategory(x, x.id === draft?.id); if (x.id === draft?.id) setDraft(null); }, 'Category saved.')}
          onDelete={() => cat.id === draft?.id ? setDraft(null) : run(() => deleteCategory(cat.id), 'Category deleted.')} />)}
      </div>
    </div>
  );
}

function CategoryRow({ cat, isNew, used, onSave, onDelete }: { cat: Category; isNew: boolean; used: number; onSave: (c: Category) => void; onDelete: () => void }) {
  const [x, setX] = useState(cat);
  const valid = /^[a-z0-9-]+$/.test(x.slug) && Object.values(x.name).some((v) => v?.trim());
  return (
    <div className="card grid items-end gap-3 p-4 sm:grid-cols-[1fr_1fr_1fr_1fr_80px_auto]">
      <div><label className="label" htmlFor={`s-${cat.id}`}>Slug</label><input id={`s-${cat.id}`} className="field" value={x.slug} onChange={(e) => setX({ ...x, slug: slugify(e.target.value) })} /></div>
      {(['en', 'fr', 'ar'] as const).map((l) => (
        <div key={l}><label className="label" htmlFor={`${l}-${cat.id}`}>{l.toUpperCase()}</label>
          <input id={`${l}-${cat.id}`} lang={l} dir={l === 'ar' ? 'rtl' : 'ltr'} className="field" value={x.name[l] ?? ''} onChange={(e) => setX({ ...x, name: { ...x.name, [l]: e.target.value } })} /></div>
      ))}
      <div><label className="label" htmlFor={`o-${cat.id}`}>Order</label><input id={`o-${cat.id}`} type="number" className="field" value={x.sortOrder} onChange={(e) => setX({ ...x, sortOrder: Number(e.target.value) || 0 })} /></div>
      <div className="flex gap-2">
        <button className="btn btn-primary !px-3" disabled={!valid} onClick={() => onSave(x)} aria-label="Save"><Save className="h-4 w-4" /></button>
        {isNew ? <button className="btn btn-ghost !px-3" onClick={onDelete} aria-label="Cancel">×</button> :
          <ConfirmButton className="btn btn-ghost !px-3 text-primary" label={<Trash2 className="h-4 w-4" aria-label="Delete" />} title="Delete category?"
            body={`${used} location(s) use this category; they will become uncategorised. This cannot be undone.`} onConfirm={onDelete} />}
      </div>
    </div>
  );
}
