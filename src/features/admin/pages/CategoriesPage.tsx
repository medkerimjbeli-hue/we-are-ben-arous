import { useState } from 'react';
import { Plus, Save, Trash2 } from 'lucide-react';
import type { Category } from '../../../types';
import { slugify } from '../../../lib/localize';
import { useAdmin } from '../AdminApp';
import { deleteCategory, saveCategory } from '../api';
import { ConfirmButton, PageHeader, Toast, useA, useErrorText, type Msg } from '../ui';

export default function CategoriesPage() {
  const { catalog: c, reload } = useAdmin();
  const { a } = useA();
  const errText = useErrorText();
  const [msg, setMsg] = useState<Msg>(null);
  const [draft, setDraft] = useState<Category | null>(null);
  const run = async (fn: () => Promise<void>, ok: string) => {
    try { await fn(); await reload(); setMsg({ text: ok, kind: 'ok' }); } catch (e) { setMsg({ text: errText(e), kind: 'error' }); }
  };
  const rows = draft ? [...c.categories, draft] : c.categories;
  return (
    <div className="max-w-5xl">
      <PageHeader title={a('categories.title')}>
        <button className="btn btn-primary" disabled={!!draft} onClick={() => setDraft({ id: crypto.randomUUID(), slug: '', name: {}, sortOrder: c.categories.length + 1 })}><Plus className="h-4 w-4" aria-hidden /> {a('categories.new')}</button>
      </PageHeader>
      <p className="mb-4 text-sm text-muted">{a('categories.intro')}</p>
      <Toast message={msg?.text ?? null} kind={msg?.kind} />
      <div className="mt-4 space-y-3">
        {rows.map((cat) => <CategoryRow key={cat.id} cat={cat} isNew={cat.id === draft?.id} used={c.locations.filter((l) => l.categoryId === cat.id).length}
          onSave={(x) => run(async () => { await saveCategory(x, x.id === draft?.id); if (x.id === draft?.id) setDraft(null); }, a('categories.saved'))}
          onDelete={() => cat.id === draft?.id ? setDraft(null) : run(() => deleteCategory(cat.id), a('categories.deleted'))} />)}
      </div>
    </div>
  );
}

function CategoryRow({ cat, isNew, used, onSave, onDelete }: { cat: Category; isNew: boolean; used: number; onSave: (c: Category) => void; onDelete: () => void }) {
  const { a } = useA();
  const [x, setX] = useState(cat);
  const valid = /^[a-z0-9-]+$/.test(x.slug) && Object.values(x.name).some((v) => v?.trim());
  return (
    <div className="card grid items-end gap-3 p-4 sm:grid-cols-[1fr_1fr_1fr_1fr_80px_auto]">
      <div><label className="label" htmlFor={`s-${cat.id}`}>{a('common.slug')}</label><input id={`s-${cat.id}`} dir="ltr" className="field" value={x.slug} onChange={(e) => setX({ ...x, slug: slugify(e.target.value) })} /></div>
      {(['en', 'fr', 'ar'] as const).map((l) => (
        <div key={l}><label className="label" htmlFor={`${l}-${cat.id}`}>{a(`langs.${l}`)}</label>
          <input id={`${l}-${cat.id}`} lang={l} dir={l === 'ar' ? 'rtl' : 'ltr'} className="field" value={x.name[l] ?? ''} onChange={(e) => setX({ ...x, name: { ...x.name, [l]: e.target.value } })} /></div>
      ))}
      <div><label className="label" htmlFor={`o-${cat.id}`}>{a('common.order')}</label><input id={`o-${cat.id}`} type="number" className="field" value={x.sortOrder} onChange={(e) => setX({ ...x, sortOrder: Number(e.target.value) || 0 })} /></div>
      <div className="flex gap-2">
        <button className="btn btn-primary !px-3" disabled={!valid} onClick={() => onSave(x)} aria-label={a('common.save')}><Save className="h-4 w-4" aria-hidden /></button>
        {isNew ? <button className="btn btn-ghost !px-3" onClick={onDelete} aria-label={a('common.cancel')}>×</button> :
          <ConfirmButton className="btn btn-ghost !px-3 text-primary" ariaLabel={a('common.delete')} label={<Trash2 className="h-4 w-4" aria-hidden />} title={a('categories.deleteTitle')}
            body={a('categories.deleteBody', { count: used })} onConfirm={onDelete} />}
      </div>
    </div>
  );
}
